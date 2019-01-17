module.exports={
    template: '#video-box',
    data: function () {
      return {
        videoObj: null,
        remoteVideos: {},
        pendingOps: {},
        myConnection: null,
        screen: null,
        isStreamScreen: null
      }
    },
    props: ['isVidAvailable', 'isAudioAvailable','isScreenShared', 'discussionId', 'socket'],
    methods: {
      toggleStream: function () {
        if (window.stream) {
          window.stream.getVideoTracks().forEach((track) => {
            track.enabled = this.isStreamScreen || this.isVidAvailable
          })
          window.stream.getAudioTracks().forEach((track) => {
            track.enabled = this.isAudioAvailable
          })
          this.myConnection.trackChange(this.isAudioAvailable, this.isStreamScreen || this.isVidAvailable)
        }
      },
      fetchStream: function () {
        var that = this
        if(that.isStreamScreen) window.stream=null;
        that.toggleStream()
        if (window.stream == null) {
          navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(that.gotStream).catch(console.log)
        }
      },
      fetchScreen: function () {
        window.stream=null;
        var that = this
        if(that.isScreenShared){
          that.screen.share();
        }else{
          if(typeof that.screen.leave !== 'undefined') that.screen.leave();
        }
      },
      gotStream: function (stream, screen) {
        let that = this
        that.isStreamScreen=screen === true
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
        // generate video box from the template
        let elemTag = document.createElement('template')
        elemTag.innerHTML = document.getElementById('video_template').innerHTML.trim()
        elemTag.content.querySelector('video').srcObject = stream
        elemTag.content.querySelector('video').setAttribute('id','video-'+socketId);
        that.remoteVideos[socketId] = stream
        elemTag.content.querySelector('.video_box').setAttribute('id', 'remoteVid' + socketId)
        document.querySelector('.remote-videos').appendChild(elemTag.content)
        
        // click handlers for video controls
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
        document.getElementById('remoteVid' + socketId).querySelector('.expand-control').addEventListener('click', function () {
          let dontExpand = this.classList.contains('active')
          that.$emit('toggle-fullscreen','video-'+socketId);
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
          console.log('got streams');
          removeTrack(socketId)
          that.setUpRemoteVideo(e.streams[0], socketId)
        }, (e, socketId) => {
          if (e.type === 'trackchange') {
            that.checkOnNoShowVideo(socketId, { audio: e.audio, video: e.video })
          }
        }, (socketId) => {
          removeTrack(socketId)
        });
        that.screen = new Screen(newVal.id);
        that.screen.userid=newVal.id;
        that.screen.openSignalingChannel = function(callback) {
            return newVal.on('message', callback);
        };
        that.screen.onaddstream = function(e) {
            if(e.type=='local'){
              that.gotStream(e.stream, true);
            }else{
              that.setUpRemoteVideo(e.stream,e.userid)
            }
        };
        that.screen.onuserleft = function(userid) {
          if(userid=='self'){
            window.stream=null
            that.$emit('screen-share-stopped');
            that.myConnection.trackChange(false,false);
          }else{
            removeTrack(userid);  
          }
        };

      },
      isVidAvailable: function (newVal, oldVal) {
        this.fetchStream()
      },
      isAudioAvailable: function (newVal, oldVal) {
        this.fetchStream()
      },
      isScreenShared: function(newVal, oldVal){
        this.fetchScreen()
      }
    }
  }