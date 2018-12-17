/* globals Vue,ace */
'use strict';
(function () {
  var Paginate = require('vuejs-paginate');
  Vue.component('paginate', Paginate);
  Vue.use(Toasted);
  Vue.filter('capitalize', function (value) {
    if (!value) return ''
    value = value.toString()
    return value.charAt(0).toUpperCase() + value.slice(1)
  })
  var videoBox = Vue.component('video-box', {
    template: '#video-box',
    data: function () {
      return {
        videoObj: null,
        remoteVideos: {},
        pendingOps:{},
        myConnection: null
      }
    },
    props: ['isVidAvailable', 'isAudioAvailable', 'discussionId', 'socket'],
    methods: {
      toggleStream: function(){
        if (window.stream){
          window.stream.getVideoTracks().forEach((track)=>{
            track.enabled=this.isVidAvailable;
          });
          window.stream.getAudioTracks().forEach((track)=>{
            track.enabled=this.isAudioAvailable;
          });
          this.myConnection.trackChange(this.isAudioAvailable,this.isVidAvailable);
        }
      },
      fetchStream: function () {
        var that = this
        that.toggleStream();
        if (window.stream == null) navigator.mediaDevices.getUserMedia({video: true,audio: true})
          .then(that.gotStream).catch(console.log)
      },
      gotStream: function (stream) {
        let that = this
        window.stream = stream
        that.toggleStream();
        that.$refs.videoObj.srcObject = stream
        that.myConnection.addStream(stream);
      },
      checkOnNoShowVideo: function(socketId, opts){
        let vidElem=document.getElementById('remoteVid'+socketId);
        if(vidElem){
          vidElem.querySelector('.no-vid-container').classList.add('d-none');
          vidElem.querySelector('.no-vid-container').classList.remove('d-block');
          if(!opts.audio && !opts.video){
            vidElem.classList.remove('d-block');
            vidElem.classList.add('d-none');
          }else{
            vidElem.classList.remove('d-none');
            vidElem.classList.add('d-block');
            if(!opts.video){
              vidElem.querySelector('.no-vid-container').classList.remove('d-none');
              vidElem.querySelector('.no-vid-container').classList.add('d-block');
            }
          }
          if(this.pendingOps[socketId]) this.pendingOps[socketId].unshift();
        }else{
          if(this.pendingOps[socketId] == null) this.pendingOps[socketId]=[];
          this.pendingOps[socketId].push(opts);
        }
      },
      setUpRemoteVideo: function(stream,socketId){
        let that=this;
        let elemTag=document.createElement('template');
        elemTag.innerHTML=document.getElementById('video_template').innerHTML.trim();
        elemTag.content.querySelector('video').srcObject=stream;
        that.remoteVideos[socketId]=stream;
        elemTag.content.querySelector('.video_box').setAttribute('id','remoteVid'+socketId);
        document.querySelector('.remote-videos').appendChild(elemTag.content);
        document.getElementById('remoteVid'+socketId).querySelector('.video-control').addEventListener('click',function(){
          let dontSee=this.classList.contains('active');
          that.remoteVideos[socketId].getVideoTracks().forEach((track)=>{
            track.enabled=dontSee;
          });
          that.checkOnNoShowVideo(socketId,{audio: true,video: dontSee})
          this.classList.toggle('active');
        });
        document.getElementById('remoteVid'+socketId).querySelector('.audio-control').addEventListener('click',function(){
          let dontListen=this.classList.contains('active');
          that.remoteVideos[socketId].getAudioTracks().forEach((track)=>{
            track.enabled=dontListen;
          });
          this.classList.toggle('active');
        });
        if(that.pendingOps[socketId]){
          that.checkOnNoShowVideo(socketId,that.pendingOps[socketId][0]);
        }
        
      }
    },
    watch: {
      socket: function(newVal){
        let that=this;
        function removeTrack(socketId){
          if(document.getElementById('remoteVid'+socketId)) document.querySelector('.remote-videos').removeChild(document.getElementById('remoteVid'+socketId));
        }
        that.myConnection=new RTCConnection(newVal,(e,socketId)=>{
          removeTrack(socketId)
          that.setUpRemoteVideo(e.streams[0],socketId);
        },(e,socketId)=>{
          if(e.type=='trackchange'){
            that.checkOnNoShowVideo(socketId,{audio: e.audio,video:e.video});
          }
        },(socketId)=>{
          removeTrack(socketId);
        });
      },
      isVidAvailable: function (newVal, oldVal) {
        this.fetchStream()
      },
      isAudioAvailable: function (newVal, oldVal) {
        this.fetchStream()
      }
    }
  })
  var momentsAgo = Vue.component('moments-ago', {
    props: ['date'],
    data: function () {
      return {
        currentTime: Date.now()
      }
    },
    template: '#moments-ago',
    computed: {
      timeFromNow: function () {
        return require('moment').utc(this.date).from(this.currentTime)
      }
    },
    mounted: function () {
      var that = this
      VirtualDiss.$on('timeChanged', function () {
        that.currentTime = Date.now()
      })
    }
  })
  Vue.component('media-list', {
    props: ['mediaList'],
    template: '#media-list',
    methods: {
      loadVideo: function(media){
        VirtualDiss.$emit('loadVideo', media);
      }
    }
  })
  Vue.component('code-editor', {
    props: ['item', 'socket', 'discussionId'],
    data: function () {
      return {
        languages: ['javascript', 'html', 'css', 'php', 'python', 'xml'],
        chosenLang: 'javascript',
        editor: null
      }
    },
    template: '#code-editor',
    methods: {
      changeLanguage: function (tabId) {
        this.editor.session.setMode('ace/mode/' + this.chosenLang);
        VirtualDiss.$emit('languageChanged', this.chosenLang, tabId)
      },
      startSocket: function(){
        let that=this;
        that.silent = false
        that.socket.on('editorchange', (e, tabId) => {
          if (tabId !== that.item.id) return
          that.silent = true
          that.editor.getSession().getDocument().applyDeltas([JSON.parse(e)])
          that.silent = false
        })
        that.socket.on('editorchange_selection', (selPosition, tabId) => {
          if (tabId !== that.item.id) return
          that.silent = true
          that.editor.getSelection().setSelectionRange(JSON.parse(selPosition))
          that.silent = false
        })
        that.socket.on('editorchange_cursor', (curPosition, tabId) => {
          if (tabId !== that.item.id) return
          that.silent = true
          that.editor.getSelection().moveCursorToPosition(JSON.parse(curPosition))
          that.silent = false
        })
        that.socket.on('editorchange_language', (language, tabId) => {
          if (tabId !== that.item.id) return
          that.chosenLang = language
          that.editor.session.setMode('ace/mode/' + language)
        })
      }
    },
    watch: {
      socket: function(){
        that.startSocket();
      }
    },
    mounted: function () {
      var that = this
      that.editor = ace.edit(this.item.id)
      that.editor.setTheme('ace/theme/monokai')
      that.editor.setShowPrintMargin(false)
      that.editor.setFontSize(20)
      that.editor.session.setMode('ace/mode/' + that.item.language)
      this.chosenLang = that.item.language
      that.silent = false
      that.editor.on('change', (e) => {
        if (that.silent) return
        that.socket.emit('editorchange', JSON.stringify(e), this.item.id)
      })
      that.editor.selection.on('changeSelection', function (e) {
        if (that.silent) return
        that.socket.emit('editorchange_selection', JSON.stringify(that.editor.selection.getRange()), that.item.id)
      })
      that.editor.selection.on('changeCursor', (e) => {
        if (that.silent) return
        that.socket.emit('editorchange_cursor', JSON.stringify(that.editor.selection.getCursor()), that.item.id)
      })
      if(that.socket.connected){
        that.startSocket();
      }
      setTimeout(function () {
        that.editor.resize()
      }, 100)
    }
  })
  var messageList = Vue.component('message-list', {
    props: ['messages', 'loggedInUser'],
    template: '#message-list',
    components: { momentsAgo: momentsAgo }
  })

  var chatBox = Vue.component('chat-box', {
    props: ['socket', 'loggedInUser','participants'],
    data: function () {
      return {
        chatMessage: '',
        messageGroups: [{name: 'common',messages: [],newMessage: false,hideMe: false}],
        currentGroup: 'common'
      }
    },
    components: { messageList: messageList },
    methods: {
      addComment: function () {
        let that = this
        let message = Object.freeze(that.chatMessage)
        if (message.trim() !== '') {
          that.socket.emit('chatmessage', message,that.currentGroup);
        }
        that.chatMessage = ''
      },
      initChatWith: function(groupName){
        var that = this
        let foundGroup=-1
        let chatWith='common';
        if(groupName !=='common'){
          let chatWithIdentity=groupName.split('_');
          let loggedInIndex=chatWithIdentity.indexOf(that.loggedInUser.identity);
          if(loggedInIndex === -1) return;
          chatWith = chatWithIdentity[1-loggedInIndex];
        }
        
        that.messageGroups.forEach((group,index)=>{
          if(groupName==group.name){
            foundGroup=index;
            return;
          }
        });
        if(foundGroup==-1){
          that.messageGroups.push({
            name: groupName, 
            messages: [],
            newMessage: false, 
            to: Object.assign({},that.loggedInUser), 
            from: Object.assign({},that.participants[chatWith]) 
          });
          foundGroup=(that.messageGroups.length -1);
        }
        that.messageGroups[foundGroup].newMessage=false;
        return [foundGroup,groupName];
      },
      chatWith: function(identity){
        var that = this
        let groupName=[identity,that.loggedInUser.identity].sort().join('_');
        if(identity=='common') groupName=identity;
        let [foundGroup,_]=that.initChatWith(groupName);
        that.messageGroups[foundGroup].hideMe=false;
        that.currentGroup=groupName;
        VirtualDiss.$emit('chatGroupChanged');
        that.scrollToBottom();
      },
      removeChat: function(index,e){
        var that= this;
        that.messageGroups[index]['hideMe']=true;
        setTimeout(function () {
          that.currentGroup='common';
          that.messageGroups[0].hideMe=false;
          that.scrollToBottom();
        },10);
        e.stopPropagation();
      },
      scrollToBottom: function(){
        setTimeout(function () {
          document.querySelectorAll('.chat-list').forEach(listObj=>{
            listObj.scrollTop = listObj.scrollHeight + 18  
          });
        }, 10)
      }
    },
    watch: {
      socket: function () {
        var that = this
        that.socket.on('chatmessage', (msg,groupName) => {
          let [foundGroup,_]=that.initChatWith(groupName);
          msg=JSON.parse(msg)
          that.messageGroups[foundGroup].messages.push(msg);
          if(groupName != that.currentGroup){
            that.messageGroups[foundGroup].newMessage=true; 
            that.messageGroups[foundGroup].hideMe=false;
          }
          that.scrollToBottom();
        });
        that.socket.on('chatgroup', (group) => {
          group=JSON.parse(group);
          group.newMessage=false;
          group.hideMe=true;
          if(group.name=='common'){
            that.messageGroups[0].messages=group.messages;
          }else{
            that.messageGroups.push(group);
          }
          that.scrollToBottom();
        });
      }
    },
    template: '#chat-box'
  })
  var VirtualDiss = new Vue({
    el: '#discussion_board',
    data: {
      course: {},
      isVidAvailable: false,
      isAudioAvailable: false,
      isRecordingAvailable: false,
      showMenu: false,
      showItem: { 'youtube': false, 'media': false, 'content': false },
      youtubeVideoId: '',
      contentTabs: [],
      socket: null,
      currentTab: null,
      isLoading: true,
      loggedInUser: null,
      discussionId: null,
      presenter: null,
      participants:{},
      totalParticipants: 0,
      showNotification: false,
      mediaList: [],
      isLoadingMedia: false,
      totalMediaPages: 0,
      currentMediaPage: 1
    },
    components: { videoBox: videoBox, chatBox: chatBox },
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
      let raisedHands={};
      function addParticipants(peers,typeArray){
        if(typeArray){
          Object.keys(peers).forEach(function(peerId){
            peers[peerId].peerId=peerId;
            that.participants[peers[peerId].identity]=peers[peerId];
            if(peers[peerId].presenter) that.presenter = peers[peerId]
          }); 
        }else{
          that.participants[peers.identity]=peers;
        }
        
      }
      that.$on('languageChanged', function (lang, tabId) {
        for (let i = 0; i < that.contentTabs.length; i++) {
          if (that.contentTabs[i].id === tabId) {
            that.contentTabs[i].language = lang
            break
          }
        }
        that.socket.emit('editorchange_language', lang, tabId)
      })
      that.$on('chatGroupChanged', function () {
        that.handleResize();
      })
      that.$on('loadVideo',function(media){
        let tabId = this.uuidv4()
        let tabItem = { id: tabId, name: 'Media - ' + media.title, type: 'media', url: media.url, mediaType: media.type }
        this.addContainer(tabItem)
        this.toggleModel('media')
        this.socket.emit('tabadd', JSON.stringify(tabItem))
      });
      setInterval(function () {
        that.$emit('timeChanged', Date.now())
      }, 1000)
      window.addEventListener('resize', that.handleResize)
      window.addEventListener('click', that.handleClick)
      document.querySelector('.no-video-img').addEventListener('load', that.handleResize)
      that.handleResize()
      let bufferDumped=false;
      let serverConnectError;
      // make socket connection  
      let io = require('socket.io-client')(socketServerUrl, { query: 'token=' + token + '&discussion_id=' + discussionId })
      io.on('disconnect', () => {
        serverConnectError=Vue.toasted.error('Server is offline!',{position: 'bottom-right'});
        that.isLoading = true;
      });
      io.on('connect', () => {
        if(serverConnectError) serverConnectError.goAway(0);

        that.socket=io;
        that.socket.on('discussiondetail', function (course) {
          that.course = course
        })
        that.socket.on('validuser', function (user) {
          that.loggedInUser = user
          that.isLoading = false
        })
        that.socket.on('invaliduser', function (msg) {
          Vue.toasted.error(msg,{position: 'bottom-right'}).goAway(2000);
          setTimeout(() => {
            Vue.toasted.error('Redirecting to home..',{position: 'bottom-right'});
            // setTimeout(()=>{window.location='/'},1000)
          }, 3000)
        })
        that.socket.on('tabadd', function (tabItem) {
          that.addContainer(JSON.parse(tabItem))
        })
        that.socket.on('tabremove', function (tabId) {
          that.removeContainer(tabId, true)
        })
        that.socket.on('tabchanged', function (tabId) {
          that.currentTab = tabId
        })
        that.socket.on('raisehand', function (info) {
          if(raisedHands.hasOwnProperty(info.user.identity)) return;
          raisedHands[info.user.identity]=1;
          Vue.toasted.info(info.user.firstName+' raised a request!',{position: 'bottom-right',action: [
            {
              text: 'Chat',
              onClick: (e,toast)=>{
                delete raisedHands[info.user.identity];
                that.$refs.chatBox.chatWith(info.user.identity);
                toast.goAway(0);
              }
            },
            {
              text: 'Close',
              onClick: (e,toast)=>{
                delete raisedHands[info.user.identity];
                toast.goAway(0);
              }
            }
          ]});
        })
        that.socket.on('participants',function(peers){
          addParticipants(peers,true);
          that.totalParticipants=Object.keys(peers).length;
        });
        that.socket.on('peer-connect', function (data) {
          data.user.peerId=data.socketId;
          addParticipants(data.user,false);
          that.totalParticipants+=1;
          if(data.user.presenter==true){
            Vue.toasted.success('Presenter is online!',{position: 'bottom-right'}).goAway(1000);
            that.presenter = data.user
          }
        });
        that.socket.on('disconnect', function (err) {
          that.participants={};
          that.totalParticipants=0;
        });
        that.socket.on('peer-disconnect', function (data) {
          let peerIdentity;
          Object.keys(that.participants).forEach(identity=>{
            if(that.participants[identity].peerId===data.socketId){
              peerIdentity=identity;
              return;
            }
          });
          if(peerIdentity){
            delete that.participants[peerIdentity];
            that.totalParticipants-=1;
          }
          if(that.presenter===null) return;
          if(data.socketId==that.presenter.peerId){
            Vue.toasted.error('Presenter is gone offline!',{position: 'bottom-right'}).goAway(1000);
            that.presenter=null;
          }
        });
        that.socket.on('loadmedia', function (mediaData) {
          mediaData=JSON.parse(mediaData);
          that.mediaList=mediaData.mediaList;
          that.currentMediaPage=mediaData.page;
          that.totalMediaPages=mediaData.total_pages;
          that.isLoadingMedia=false;
        });
        if(!bufferDumped){
          that.socket.emit('dumpbuffer')
          bufferDumped=true;
        }
        // load Media files
        that.changeMediaPage(1);
      });
    },
    methods: {
      changeMediaPage: function(pageNum){
        this.isLoadingMedia=true;
        this.currentMediaPage=pageNum;
        this.socket.emit('loadmedia', pageNum);
      },
      chatWith: function(identity){
        if(identity !== this.loggedInUser.identity){
          this.$refs.chatBox.chatWith(identity);
        }
      },
      handleClick: function (ev) {
        if (!document.querySelector('.dropdown-container').contains(ev.target)) {
          this.showNotification=false;
        }
        if (!document.querySelector('#play-menu .dropdown').contains(ev.target)) {
          this.toggleMenu(true)
        }
      },
      drawRemainingTime: function (percentComplete) {
        var α = (percentComplete * 360) / 100
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
      },
      toggleAudio: function () {
        this.isAudioAvailable = !this.isAudioAvailable
      },
      toggleRecording: function () {
        this.isRecordingAvailable = !this.isRecordingAvailable
      },
      toggleMenu: function (hideMenu) {
        if (hideMenu) {
          this.showMenu = false
        } else {
          this.showMenu = !this.showMenu
        }
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
          document.querySelectorAll('.chat-list').forEach(tab=>{
            tab.style = 'height: ' + heightToChat + 'px;min-height: 128px';
          });
          let rightSideHeight = heightToPlay - 16 -16 -1 - document.getElementById('play-menu').clientHeight
          //rightSideHeight= rightSideHeight < minHeight ? minHeight : rightSideHeight;
          document.querySelectorAll('.content-tabs').forEach(function (tab) {
            tab.style = 'height: ' + rightSideHeight + 'px'
          })
        })
      },
      addItem: function (itemType) {
        switch (itemType) {
          case 'youtube':
            break
          case 'whiteboard':
            break
          case 'media':
            break
          case 'content':
            break
          case 'code':
            let tabId = this.uuidv4()
            let tabItem = { id: tabId, name: 'Code Editor', type: 'code', language: 'javascript' }
            this.addContainer(tabItem)
            this.socket.emit('tabadd', JSON.stringify(tabItem))
            break
        }
        this.toggleMenu()
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
      addContainer: function (tabItem) {
        this.contentTabs.push(tabItem)
        this.currentTab = tabItem.id
        this.handleResize()
      },
      setCurrentTab: function (tabId) {
        this.currentTab = tabId
        this.socket.emit('tabchanged', tabId)
      },
      toggleModel: function (itemType) {
        this.showItem[itemType] = !this.showItem[itemType]
        this.toggleMenu()
      },
      raiseHand: function () {
        this.socket.emit('raisehand');
        Vue.toasted.success('Request has been sent to presenter!',{position: 'bottom-right'}).goAway(1500);
      },
      toggleFullscreen: function () {
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
          let docElm = document.getElementById('discussion_board')
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
