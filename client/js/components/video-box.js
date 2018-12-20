module.exports={
    template: '#video-box',
    data: function () {
      return {
        videoObj: null,
        remoteVideos: {},
        pendingOps: {},
        myConnection: null
      }
    },
    props: ['isVidAvailable', 'isAudioAvailable', 'discussionId', 'socket'],
    methods: {
      toggleStream: function () {
        if (window.stream) {
          window.stream.getVideoTracks().forEach((track) => {
            track.enabled = this.isVidAvailable
          })
          window.stream.getAudioTracks().forEach((track) => {
            track.enabled = this.isAudioAvailable
          })
          this.myConnection.trackChange(this.isAudioAvailable, this.isVidAvailable)
        }
      },
      fetchStream: function () {
        var that = this
        that.toggleStream()
        if (window.stream == null) {
          navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(that.gotStream).catch(console.log)
        }
      },
      gotStream: function (stream) {
        let that = this
        window.stream = stream
        that.toggleStream()
        that.$refs.videoObj.srcObject = stream
        that.myConnection.addStream(stream)
      },
      checkOnNoShowVideo: function (socketId, opts) {
        let vidElem = document.getElementById('remoteVid' + socketId)
        if (vidElem) {
          vidElem.querySelector('.no-vid-container').classList.add('d-none')
          vidElem.querySelector('.no-vid-container').classList.remove('d-block')
          if (!opts.audio && !opts.video) {
            vidElem.classList.remove('d-block')
            vidElem.classList.add('d-none')
          } else {
            vidElem.classList.remove('d-none')
            vidElem.classList.add('d-block')
            if (!opts.video) {
              vidElem.querySelector('.no-vid-container').classList.remove('d-none')
              vidElem.querySelector('.no-vid-container').classList.add('d-block')
            }
          }
          if (this.pendingOps[socketId]) this.pendingOps[socketId].unshift()
        } else {
          if (this.pendingOps[socketId] == null) this.pendingOps[socketId] = []
          this.pendingOps[socketId].push(opts)
        }
      },
      setUpRemoteVideo: function (stream, socketId) {
        let that = this
        let elemTag = document.createElement('template')
        elemTag.innerHTML = document.getElementById('video_template').innerHTML.trim()
        elemTag.content.querySelector('video').srcObject = stream
        that.remoteVideos[socketId] = stream
        elemTag.content.querySelector('.video_box').setAttribute('id', 'remoteVid' + socketId)
        document.querySelector('.remote-videos').appendChild(elemTag.content)
        document.getElementById('remoteVid' + socketId).querySelector('.video-control').addEventListener('click', function () {
          let dontSee = this.classList.contains('active')
          that.remoteVideos[socketId].getVideoTracks().forEach((track) => {
            track.enabled = dontSee
          })
          that.checkOnNoShowVideo(socketId, { audio: true, video: dontSee })
          this.classList.toggle('active')
        })
        document.getElementById('remoteVid' + socketId).querySelector('.audio-control').addEventListener('click', function () {
          let dontListen = this.classList.contains('active')
          that.remoteVideos[socketId].getAudioTracks().forEach((track) => {
            track.enabled = dontListen
          })
          this.classList.toggle('active')
        })
        if (that.pendingOps[socketId]) {
          that.checkOnNoShowVideo(socketId, that.pendingOps[socketId][0])
        }
      }
    },
    watch: {
      socket: function (newVal) {
        let that = this
        function removeTrack (socketId) {
          if (document.getElementById('remoteVid' + socketId)) document.querySelector('.remote-videos').removeChild(document.getElementById('remoteVid' + socketId))
        }
        that.myConnection = require('../rtc-conn')(newVal, (e, socketId) => {
          removeTrack(socketId)
          that.setUpRemoteVideo(e.streams[0], socketId)
        }, (e, socketId) => {
          if (e.type === 'trackchange') {
            that.checkOnNoShowVideo(socketId, { audio: e.audio, video: e.video })
          }
        }, (socketId) => {
          removeTrack(socketId)
        })
      },
      isVidAvailable: function (newVal, oldVal) {
        this.fetchStream()
      },
      isAudioAvailable: function (newVal, oldVal) {
        this.fetchStream()
      }
    }
  }