'use strict'

import Toasted from 'vue-toasted';

(function () {
  var Vue = require('vue')
  Vue.use(Toasted)
  Vue.filter('capitalize', function (value) {
    if (!value) return ''
    value = value.toString()
    return value.charAt(0).toUpperCase() + value.slice(1)
  })
  
  Vue.component('paginate', require('vuejs-paginate'))
  Vue.component('media-list', require('./components/media-list'))
  Vue.component('content-list', require('./components/content-list'))
  Vue.component('code-editor', require('./components/code-editor'))
  Vue.component('white-board', require('./components/white-board'))
  Vue.component('video-box',require('./components/video-box'))
  Vue.component('chat-box', require('./components/chat-box'))

  new Vue({
    el: '#discussion_board',
    data: {
      course: {},
      isVidAvailable: false,
      isAudioAvailable: false,
      isRecordingAvailable: false,
      isScreenShared: false,
      showMenu: false,
      showItem: { 'youtube': false, 'media': false, 'content': false },
      youtubeVideoId: '',
      templateFile: null,
      contentTabs: [],
      socket: null,
      currentTab: null,
      isLoading: true,
      loggedInUser: null,
      discussionId: null,
      presenter: null,
      participants: {},
      totalParticipants: 0,
      showNotification: false,
      mediaList: [],
      isLoadingMedia: false,
      totalMediaPages: 0,
      currentMediaPage: 1,
      contentList: [],
      isLoadingContent: false,
      totalContentPages: 0,
      currentContentPage: 1
    },
    mounted: function () {
      var that = this
      // pick value from meta tags
      let token = document.querySelector('meta[key=token][value]').getAttribute('value')
      let discussionId = document.querySelector('meta[key=discussion_id][value]').getAttribute('value')
      let socketServerUrl = document.querySelector('meta[key=socket_server_url][value]').getAttribute('value')

      // replace if found in query params
      let urlParams = new URLSearchParams(window.location.search)
      let paramToken = urlParams.get('token')
      let paramDiscussionId = urlParams.get('discussion_id')

      if (paramToken) token = paramToken
      if (paramDiscussionId) discussionId = paramDiscussionId

      that.discussionId = discussionId
      

      let raisedHands = {}
      function addParticipants (peers, typeArray) {
        if (typeArray) {
          Object.keys(peers).forEach(function (peerId) {
            peers[peerId].peerId = peerId
            that.participants[peers[peerId].identity] = peers[peerId]
            if (peers[peerId].presenter) that.presenter = peers[peerId]
          })
        } else {
          that.participants[peers.identity] = peers
        }
      }
      window.addEventListener('resize', that.handleResize)
      window.addEventListener('click', that.handleClick)
      document.querySelector('.no-video-img').addEventListener('load', that.handleResize)
      that.handleResize()

      let bufferDumped = false
      let serverConnectError
      // make socket connection
      let io = require('socket.io-client')(socketServerUrl, { query: 'token=' + token + '&discussion_id=' + discussionId })
      io.on('disconnect', () => {
        serverConnectError = Vue.toasted.error('Server is offline!', { position: 'bottom-right' })
        that.isLoading = true
      })
      io.on('connect', () => {
        if (serverConnectError) serverConnectError.goAway(0)

        that.socket = io
        that.socket.on('discussiondetail', function (course) {
          that.course = course
        })
        that.socket.on('validuser', function (user) {
          that.loggedInUser = user
          that.isLoading = false
        })
        that.socket.on('invaliduser', function (msg) {
          Vue.toasted.error(msg, { position: 'bottom-right' }).goAway(2000)
          setTimeout(() => {
            Vue.toasted.error('Redirecting to home..', { position: 'bottom-right' })
            // setTimeout(()=>{window.location='/'},1000)
          }, 3000)
        })
        that.socket.on('tabadd', function (tabItem) {
          that.addContainer(JSON.parse(tabItem))
        })
        that.socket.on('tabremove', function (tabId) {
          that.removeContainer(tabId, true)
        })
        that.socket.on('tabrename', function (tabId,name) {
          for (let i = 0; i < that.contentTabs.length; i++) {
            if (that.contentTabs[i].id === tabId) {
              that.contentTabs[i]['name']=name;
              break
            }
          }
        })
        that.socket.on('tabchanged', function (tabId) {
          that.currentTab = tabId
          setTimeout(function(){
            that.handleResize();
          },100)
        })
        that.socket.on('raisehand', function (info) {
          if (raisedHands.hasOwnProperty(info.user.identity)) return
          raisedHands[info.user.identity] = 1
          Vue.toasted.info(info.user.firstName + ' raised a request!', { position: 'bottom-right',
            action: [
              {
                text: 'Chat',
                onClick: (e, toast) => {
                  delete raisedHands[info.user.identity]
                  that.$refs.chatBox.chatWith(info.user.identity)
                  toast.goAway(0)
                }
              },
              {
                text: 'Close',
                onClick: (e, toast) => {
                  delete raisedHands[info.user.identity]
                  toast.goAway(0)
                }
              }
            ] })
        })
        that.socket.on('participants', function (peers) {
          addParticipants(peers, true)
          that.totalParticipants = Object.keys(that.participants).length
        })
        that.socket.on('peer-connect', function (data) {
          data.user.peerId = data.socketId
          addParticipants(data.user, false)
          that.totalParticipants = Object.keys(that.participants).length
          if (data.user.presenter === true) {
            Vue.toasted.success('Presenter is online!', { position: 'bottom-right' }).goAway(1000)
            that.presenter = data.user
          }
        })
        that.socket.on('disconnect', function () {
          that.participants = {}
          that.totalParticipants = 0
        })
        that.socket.on('peer-disconnect', function (data) {
          let peerIdentity
          Object.keys(that.participants).forEach(identity => {
            if (that.participants[identity].peerId === data.socketId) {
              peerIdentity = identity
            }
          })
          if (peerIdentity) {
            delete that.participants[peerIdentity]
          }
          that.totalParticipants = Object.keys(that.participants).length
          if (that.presenter === null) return
          if (data.socketId === that.presenter.peerId) {
            Vue.toasted.error('Presenter is gone offline!', { position: 'bottom-right' }).goAway(1000)
            that.presenter = null
          }
        })
        that.socket.on('loadmedia', function (mediaData) {
          mediaData = JSON.parse(mediaData)
          that.mediaList = mediaData.mediaList
          that.currentMediaPage = mediaData.page
          that.totalMediaPages = mediaData.total_pages
          that.isLoadingMedia = false
        })
        that.socket.on('loadcontent', function (contentData) {
          contentData = JSON.parse(contentData)
          that.contentList = contentData.contentList
          that.currentContentPage = contentData.page
          that.totalContentPages = contentData.total_pages
          that.isLoadingContent = false
        })
        console.log('bufferDumped',bufferDumped);
        if (!bufferDumped) {
          setTimeout(function(){
            that.socket.emit('dumpbuffer')
          },100)
          bufferDumped = true
        }
        // load Media files
        that.changeMediaPage(1)
        // load Content files
        that.changeContentPage(1)
      })
    },
    methods: {
      changeMediaPage: function (pageNum) {
        this.isLoadingMedia = true
        this.currentMediaPage = pageNum
        this.socket.emit('loadmedia', pageNum)
      },
      changeContentPage: function (pageNum) {
        this.isLoadingContent = true
        this.currentContentPage = pageNum
        this.socket.emit('loadcontent', pageNum)
      },
      chatWith: function (identity) {
        if (identity !== this.loggedInUser.identity) {
          this.$refs.chatBox.chatWith(identity)
        }
      },
      languageChanged: function (lang, tabId) {
        let that=this;
        for (let i = 0; i < that.contentTabs.length; i++) {
          if (that.contentTabs[i].id === tabId) {
            that.contentTabs[i].language = lang
            break
          }
        }
        that.socket.emit('editorchange_language', lang, tabId)
      },
      handleClick: function (ev) {
        if (!document.querySelector('.dropdown-container').contains(ev.target)) {
          this.showNotification = false
        }
        if (!document.querySelector('#play-menu .dropdown').contains(ev.target)) {
          this.toggleMenu(true)
        }
      },
      drawRemainingTime: function () {
        let moment=require('moment')
        let remainingTimePercent=100;
        let currentTime=moment();
        let courseStartTime=moment(this.course.startTime);
        if(currentTime >= courseStartTime){
          let duration=moment.duration(courseStartTime.add(this.course.duration,'minutes').diff(currentTime));
          let remainingDuration=duration.asMinutes();
          if(remainingDuration > 0){
            remainingTimePercent=(remainingDuration/this.course.duration) * 100
          }else{
            remainingTimePercent=0;
          } 
        }
        var α = (remainingTimePercent * 360) / 100
        α %= 360
        var π = Math.PI; var r = (α * π / 180)
        var x = Math.sin(r) * 125
        var y = Math.cos(r) * -125
        var mid = (α > 180) ? 1 : 0
        var anim = 'M 0 0 v -125 A 125 125 1 ' +
                 mid + ' 1 ' +
                 x + ' ' +
                 y + ' z'
        return anim
      },
      toggleVideo: function () {
        this.isVidAvailable = !this.isVidAvailable
        if(this.isVidAvailable){
          this.isScreenShared=false;
        }
      },
      toggleAudio: function () {
        this.isAudioAvailable = !this.isAudioAvailable
        if(this.isAudioAvailable){
          this.isScreenShared=false;
        }
      },
      toggleRecording: function () {
        this.isRecordingAvailable = !this.isRecordingAvailable
      },
      stopScreenShare: function () {
        this.isScreenShared = false
      },
      toggleScreen: function () {
        this.isScreenShared = !this.isScreenShared
        if(this.isScreenShared){
          this.isVidAvailable=false;
          this.isAudioAvailable=false;
        }
      },
      toggleMenu: function (hideMenu) {
        if (hideMenu) {
          this.showMenu = false
        } else {
          this.showMenu = !this.showMenu
        }
      },
      renameTab: function (index,doneRenaming) {
        this.contentTabs[index]['renaming']=!doneRenaming;
        if(doneRenaming){
          this.socket.emit('tabrename', this.contentTabs[index].id,this.contentTabs[index].name);
        }
      },
      doneRenaming: function (index,event) {
        if(event.key==='Enter')this.renameTab(index,true);
      },
      removeContainer: function (tabId, triggeredByEvent, e) {
        if (tabId === this.currentTab) this.currentTab = null
        for (let i = 0; i < this.contentTabs.length; i++) {
          if (this.contentTabs[i].id === tabId) {
            this.contentTabs.splice(i, 1)
            break
          }
        }
        if (!triggeredByEvent) this.socket.emit('tabremove', tabId)
        if (e) e.stopPropagation()
      },
      handleResize: function (firstTime) {
        this.$nextTick(function () {
          // Remaining playground height= (Window - NavBar - Navbar bottom Margin - Playground bottom margin)
          let heightToPlay = window.innerHeight - document.querySelector('.header-bar').clientHeight - 16 - 16
          // Remaining ChatList height= (Playground - Playground margin - Playground padding - Playground border - Video - ChatBox margin - Chatbox heading - Chat Input)
          let heightToChat = heightToPlay - 16 - 32 - 1 - document.querySelector('.chat-bar').clientHeight - document.getElementById('video-container').clientHeight - 16 - 33 - document.querySelector('.chat-input').clientHeight
          // minHeight=video + top margin + padding + heading + heading margin + bottom margin + minHeight for chatlist
          let minHeight = document.getElementById('video-container').clientHeight + 16 + 32 + 33 + 8 + 10 + 128 + document.querySelector('.chat-bar').clientHeight + document.querySelector('.chat-input').clientHeight

          if (heightToPlay < minHeight) heightToPlay = minHeight
          document.querySelector('.playground').style = (window.innerWidth <= 768 ? '' : 'height: ' + heightToPlay + 'px;') + ' min-height: ' + minHeight + 'px'
          if (heightToChat < 0) heightToChat = 128
          document.querySelectorAll('.chat-list').forEach(tab => {
            tab.style = 'height: ' + heightToChat + 'px;min-height: 128px'
          })
          let rightSideHeight = heightToPlay - 16 - 16 - 1 - document.getElementById('play-menu').clientHeight
          // rightSideHeight= rightSideHeight < minHeight ? minHeight : rightSideHeight;
          document.querySelectorAll('.content-tabs').forEach(function (tab) {
            tab.style = 'height: ' + rightSideHeight + 'px'
            tab.querySelectorAll('canvas').forEach(function(canvas){
              canvas.setAttribute('height',rightSideHeight);
              canvas.setAttribute('width',tab.clientWidth);
            })
          })
          window.dispatchEvent(new Event('redraw'));
        })
      },
      addItem: function (itemType) {
        let tabId = this.uuidv4()
        let tabItem = { id: tabId, type: itemType }
        switch (itemType) {
          case 'youtube':
            break
          case 'whiteboard':
            tabItem.name = 'White Board'
            this.addContainer(tabItem)
            this.socket.emit('tabadd', JSON.stringify(tabItem))
            break
          case 'media':
            break
          case 'content':
            break
          case 'code':
            tabItem.name = 'Code Editor'
            tabItem.language = 'javascript'
            this.addContainer(tabItem)
            this.socket.emit('tabadd', JSON.stringify(tabItem))
            break
        }
        this.toggleMenu()
      },
      importTemplate: function () {
        let that=this;
        let templateFile = Object.freeze(that.templateFile)
        that.toggleModel('import');
        let importingToast=Vue.toasted.info('Importing template <div class="d-flex justify-content-center loader-container"><div class="lds-ripple"><div class="border-dark"></div><div class="border-dark"></div></div></div>',{position: 'bottom-right'});
        
        let fReader = new FileReader();
        fReader.readAsText(templateFile)
        fReader.onloadend = function(evt) {
          if (evt.target.readyState == FileReader.DONE) {
            that.contentTabs=[];
            that.socket.emit('importtemplate', evt.target.result, function (err) {
              importingToast.goAway(0);
              if(err){
                Vue.toasted.error('Import failed!').goAway(1500);
                return;  
              }
              Vue.toasted.success('Import complete',{position: 'bottom-right'}).goAway(1500);
              that.templateFile=null
              document.getElementById('templateFile').nextElementSibling.innerHTML='Choose File';
            });
          }
        };
      },
      exportTemplate: function() {
        this.toggleMenu();
        let exportingToast=Vue.toasted.info('Exporting template <div class="d-flex justify-content-center loader-container"><div class="lds-ripple"><div class="border-dark"></div><div class="border-dark"></div></div></div>',{position: 'bottom-right'});
        this.socket.emit('exporttemplate', function (err,fileBuffer) {
          exportingToast.goAway(0);
          if(err){
            Vue.toasted.error('Export failed!').goAway(1500);
            return;  
          }
          Vue.toasted.success('Export complete',{position: 'bottom-right',action: [
              {
                text: 'Download',
                onClick: (e, toast) => {
                  var element = document.createElement('a');
                  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(fileBuffer));
                  element.setAttribute('download', 'template'+require('moment')().format('YMdHmms')+'.vdtmpl');
                  element.style.display = 'none';
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                  toast.goAway(0)
                }
              },
              {
                text: 'Close',
                onClick: (e, toast) => {
                  toast.goAway(0)
                }
              }
            ] 
          })
        });
      },
      readTemplate: function (e) {
        let file=e.target.files[0];
        let filePlaceholder='Choose file';
        this.templateFile=null;
        if(file){
          filePlaceholder=file.name;
          this.templateFile=file;
        }
        e.target.nextElementSibling.innerHTML=filePlaceholder;
      },
      loadVideo: function () {
        let videoId = Object.freeze(this.youtubeVideoId)
        if (videoId.trim() === '') return
        videoId = videoId.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/)
        this.youtubeVideoId = (videoId[2] !== undefined) ? videoId[2].split(/[^0-9a-z_-]/i)[0] : videoId[0]
        let tabId = this.uuidv4()
        let tabItem = { id: tabId, name: 'Youtube - ' + this.youtubeVideoId, type: 'youtube', videoId: this.youtubeVideoId }
        this.addContainer(tabItem)
        this.youtubeVideoId = ''
        this.toggleModel('youtube')
        this.socket.emit('tabadd', JSON.stringify(tabItem))
      },
      loadMedia: function (media) {
        let tabId = this.uuidv4()
        let tabItem = { id: tabId, name: 'Media - ' + media.title, type: 'media', url: media.url, mediaType: media.type }
        this.addContainer(tabItem)
        this.toggleModel('media')
        this.socket.emit('tabadd', JSON.stringify(tabItem))
      },
      loadContent: function (content) {
        let that=this;
        let tabId = that.uuidv4()
        let contentPages={};
        content.images.forEach(img=>{
          let pageId=that.uuidv4();
          contentPages[pageId]={id: pageId, image: img, drawings: []}
        })
        let tabItem = { id: tabId, name: 'Content - ' + content.title, type: 'content', content: contentPages, contentType: content.type }
        that.addContainer(tabItem)
        that.toggleModel('content')
        that.socket.emit('tabadd', JSON.stringify(tabItem))
      },
      addContainer: function (tabItem) {
        tabItem.renaming=false;
        if(tabItem.type==='content') tabItem.currentPage=1;
        this.contentTabs.push(tabItem)
        this.currentTab = tabItem.id
        this.handleResize()
      },
      setCurrentTab: function (tabId) {
        let that=this;
        if(tabId !== that.currentTab){
          for (let i = 0; i < that.contentTabs.length; i++) {
            if (that.contentTabs[i].id === that.currentTab) {
              that.renameTab(i,true);
              break
            }
          }
        }
        that.currentTab = tabId
        that.socket.emit('tabchanged', tabId)
        setTimeout(function(){
          that.handleResize();
          window.dispatchEvent(new Event('resize'));
        },100)
      },
      toggleModel: function (itemType) {
        this.showItem[itemType] = !this.showItem[itemType]
        this.toggleMenu()
      },
      raiseHand: function () {
        this.socket.emit('raisehand')
        Vue.toasted.success('Request has been sent to presenter!', { position: 'bottom-right' }).goAway(1500)
      },
      toggleFullscreen: function (elemId) {
        var isInFullScreen = (document.fullscreenElement && document.fullscreenElement !== null) ||
        (document.webkitFullscreenElement && document.webkitFullscreenElement !== null) ||
        (document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
        (document.msFullscreenElement && document.msFullscreenElement !== null)
        if (isInFullScreen) {
          if (document.exitFullscreen) {
            document.exitFullscreen()
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen()
          } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen()
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen()
          }
        } else {
          let docElm = document.getElementById(elemId)
          if (docElm.requestFullscreen) {
            docElm.requestFullscreen()
          } else if (docElm.mozRequestFullScreen) {
            docElm.mozRequestFullScreen()
          } else if (docElm.webkitRequestFullScreen) {
            docElm.webkitRequestFullScreen()
          } else if (docElm.msRequestFullscreen) {
            docElm.msRequestFullscreen()
          }
        }
      },
      uuidv4: function () {
        var cryptoObj = window.crypto || window.msCrypto
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
          (c ^ cryptoObj.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        )
      }
    },
    watch: {
      course: function (course) {
        document.title = course.title
      }
    },
    created: function () {
      this.course = { title: 'Devil-101 \uD83D\uDE08' }
    },
    beforeDestroy: function () {
      window.removeEventListener('resize', this.handleResize)
      window.removeEventListener('click', this.handleClick)
    }
  })
})()
