'use strict'

import Toasted from 'vue-toasted';
import VueYouTubeEmbed from 'vue-youtube-embed';
import JsBandwidth from "./jsbandwidth";
import PdfMake from "pdfmake/build/pdfmake";
import PdfFonts from "pdfmake/build/vfs_fonts";
PdfMake.vfs = PdfFonts.pdfMake.vfs;
var Ace = require('./ace/ace');
(function () {
  var Vue = require('vue')
  Vue.use(Toasted)
  Vue.use(VueYouTubeEmbed)
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
      remainingDuration: {hours: 0,minutes: 0,seconds: 0},
      isVidAvailable: false,
      isAudioAvailable: false,
      isRecordingAvailable: false,
      isScreenShared: false,
      showMenu: false,
      showItem: { 'youtube': false, 'media': false, 'content': false },
      youtubeVideoId: '',
      layout: 'classroom-view',
      templateFile: null,
      contentTabs: [],
      socket: null,
      currentTab: null,
      isLoading: true,
      loggedInUser: null,
      discussionId: null,
      presenter: null,
      participants: {},
      allParticipants: {},
      breakoutName: '',
      selectedBreakouts: [],
      selectedParticipants: [],
      participantToRemove:{},
      participantList: [],
      breakouts: [],
      breakout: {name: '',participants: [],groupLeader: null,timeOut: 60},
      currentBreakout: null,
      breakoutIndex: -1,
      addBreakoutIndex: -1,
      remaining_participants: {},
      isBreakoutActive: false,
      totalParticipants: 0,
      showNotifications: false,
      showParticipants: false,
      showChatBox: true,
      showWebCamBox: false,
      notifications: [],
      showTimer: false,
      mediaList: [],
      speaker: {},
      isLoadingMedia: false,
      totalMediaPages: 0,
      currentMediaPage: 1,
      contentList: [],
      folderList: [],
      currentFolder: {},
      showPrivate: null,
      isLoadingContent: false,
      totalContentPages: 0,
      currentContentPage: 1,
      volumePts: 0,
      selectedCamera: '',
      selectedMic: '',
      selectedSetting: 'video',
      videoDevices: [],
      audioDevices: [],
      connectivitySettings: {
          internet: navigator.onLine,
          browser: true,
          connected: false,
          rtt: navigator.connection.rtt,
          downlink: navigator.connection.downlink,
          download: navigator.connection.downlink,
          upload: navigator.connection.downlink,
          latency: '0'
      },
      serverUrl: '',
    },
    mounted: function () {
      var that = this
      // pick value from meta tags
      let token = document.querySelector('meta[key=token][value]').getAttribute('value')
      let discussionId = document.querySelector('meta[key=discussion_id][value]').getAttribute('value')
      that.serverUrl = document.querySelector('meta[key=socket_server_url][value]').getAttribute('value')
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
      let io = require('socket.io-client')(that.serverUrl, { query: 'token=' + token + '&discussion_id=' + discussionId })
      io.on('disconnect', () => {
        serverConnectError = Vue.toasted.error('Server is offline!', { position: 'bottom-right' })
        that.isLoading = true
        that.connectivitySettings.connected=false;
      })
      io.on('connect', () => {
        if (serverConnectError) serverConnectError.goAway(0)
        that.connectivitySettings.connected=true;
        that.socket = io
        that.socket.on('discussiondetail', function (course) {
          that.course = course
          let intervalTimer=setInterval(_=>{
           let secondRemain=that.calculateRemainingTime();
           if(secondRemain <= 0){
            //clearInterval(intervalTimer);
            //that.endSession();
           } 
          },1000)
        })
        that.socket.on('validuser', function (user) {
          that.loggedInUser = user
          that.isLoading = false
        })
        that.socket.on('changeleader', function (identity) {
          that.currentBreakout.groupLeader= identity;
        })
        that.socket.on('validuser', function (user) {
          that.loggedInUser = user
          that.isLoading = false
        })
        that.socket.on('invaliduser', function (msg) {
          Vue.toasted.error(msg, { position: 'bottom-right' }).goAway(2000)
          setTimeout(() => {
            Vue.toasted.error('Redirecting to home..', { position: 'bottom-right' })
            setTimeout(()=>{window.location='/'},1000)
          }, 3000)
        })
        that.socket.on('tabadd', function (tabItem) {
          that.addContainer(JSON.parse(tabItem))
        })
        that.socket.on('tabremove', function (tabId) {
          that.removeContainer(tabId, true)
        })
        that.socket.on('layout', function (name){
          that.layout=name;
        });
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
          let msg='raised a request!';
          that.notifications.push({sender:  info.user.firstName, text: msg,time: new Date()})
          Vue.toasted.info(info.user.firstName +" "+msg, { position: 'bottom-right',
            action: [
              /*{
                text: 'Chat',
                onClick: (e, toast) => {
                  delete raisedHands[info.user.identity]
                  that.$refs.chatBox.chatWith(info.user.identity)
                  toast.goAway(0)
                }
              },*/
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
        that.socket.on('allparticipants',function (allParticipants){
          Object.keys(allParticipants).forEach(function (peerId) {
            allParticipants[peerId].peerId = peerId
            that.allParticipants[allParticipants[peerId].identity] = allParticipants[peerId]
          })
        })
        that.socket.on('breakouts', function (breakouts) {
          that.breakouts = breakouts;
        })
        that.socket.on('peer-connect', function (data) {
          data.user.peerId = data.socketId
          that.notifications.push({sender: data.user.firstName, text: 'is online!',time: new Date()});
          addParticipants(data.user, false)
          that.allParticipants[data.user.identity]=data.user;
          that.totalParticipants = Object.keys(that.participants).length
          if (data.user.presenter === true) {
            Vue.toasted.success('Presenter is online!', { position: 'bottom-right' }).goAway(1000)
            that.presenter = data.user
          }
          that.manageBreakout();
        })
        that.socket.on('peer-connect-global', function (data) {
          if(that.loggedInUser.presenter){
            that.allParticipants[data.user.identity]=data.user;
          }
        })
        that.socket.on('disconnect', function () {
          that.participants = {}
          that.allParticipants={};
          that.totalParticipants = 0
        })
        that.socket.on('changepermission', function(action, value){
          that.loggedInUser.permissions[action]=value;
        })
        that.socket.on('peer-disconnect-global', function (data) {
          let peerIdentity
          Object.keys(that.allParticipants).forEach(identity => {
            if (that.allParticipants[identity].peerId === data.socketId) {
              peerIdentity = identity
            }
          })
          if (peerIdentity) {
            delete that.allParticipants[peerIdentity];
          }
        });
        that.socket.on('peer-disconnect', function (data) {
          let peerIdentity
          Object.keys(that.allParticipants).forEach(identity => {
            if (that.allParticipants[identity].peerId === data.socketId) {
              peerIdentity = identity
            }
          })
          if (peerIdentity) {
            that.notifications.push({sender: that.participants[peerIdentity].firstName, text: 'is offline!',time: new Date()});
            delete that.participants[peerIdentity]
            delete that.allParticipants[peerIdentity];
          }

          that.participants=Object.assign({},that.participants);
          that.remaining_participants=Object.assign({},that.participants);
          if(that.breakout.participants.length){
            that.breakout.participants.forEach(function(identity){
              if(that.remaining_participants[identity]){
                delete that.remaining_participants[identity];
              }
            })
            let partIn=that.breakout.participants.indexOf(peerIdentity);
            if(partIn !== -1){
              that.breakout.participants.splice(peerIdentity,1);
            }
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
          that.folderList = contentData.folderList
          that.contentList = contentData.contentList
          that.currentContentPage = contentData.page
          that.currentFolder = contentData.currentFolder
          that.totalContentPages = contentData.total_pages
          that.isLoadingContent = false
        })
        that.socket.on('folderadded', function(){
          that.changeContentPage(1);
        });
        that.socket.on('folderdeleted', function(){
          Vue.toasted.success('Folder deleted!', { position: 'bottom-right' }).goAway(1000)
          that.changeContentPage(1);
        })
        that.socket.on('fileadded', function () {
          Vue.toasted.success('File added successfully!', { position: 'bottom-right' }).goAway(1000)
          that.changeContentPage(1);
        });
        that.socket.on('fileaddfailed', function () {
          Vue.toasted.error('File addition failed!', { position: 'bottom-right' }).goAway(1000)
        });
        that.socket.on('reconnect', function(){
          window.location.reload()
        })
        // that.socket.on('isBreakoutActive', function(isActive){
        //   that.isBreakoutActive=isActive;
        // })
        that.socket.on('endsession', function(){
          that.endSession();
        });
        that.socket.on('breakoutinfo', function(info){
          that.currentBreakout=info.breakout;
          that.course.startTime=info.breakout.startTime;
          that.course.duration=info.breakout.timeOut;
          that.breakoutIndex=info.breakoutIndex;
        })
        that.socket.on('clearworkspace', function(){
          that.contentTabs = []
          that.currentTab=null
        })
        that.socket.on('dumpbuffer', function () {
          that.contentTabs = []
          that.currentTab=null
          that.socket.emit('dumpbuffer', true);
        });
        that.socket.on('updatepaused', function (tabId, mediaType, type, timestamp){
          if(mediaType=='youtube-player'){
            if(typeof YT == "undefined") return;
            let elem=YT.get(tabId);
            if(!elem) return;
            
            elem.seekTo(timestamp);
            switch(type){
              case 'play':
                elem.playVideo();
              break;
              case 'pause':
                elem.pauseVideo();
              break;
            }
          }else{
            let elem=document.getElementById(mediaType+"_"+tabId);
            if(!elem) return;
          
            elem.currentTime=timestamp;
            switch(type){
              case 'play':
                elem.play();
              break;
              case 'pause':
                elem.pause();
              break;
            }  
          }
        })
        if (!bufferDumped) {
          setTimeout(function(){
            that.socket.emit('dumpbuffer')
          },100)
          bufferDumped = true
        }
        // load Media files
        that.changeMediaPage(1)
        // load Content files
        //that.changeContentPage(1)
      })
      that.getSpeedInfo();
    },
    methods: {
      changeMediaPage: function (pageNum) {
        this.isLoadingMedia = true
        this.currentMediaPage = pageNum
        this.socket.emit('loadmedia', pageNum)
      },
      clearWorkspace: function(){
        this.contentTabs=[];
        this.currentTab=null;
        this.socket.emit('clearworkspace');
      },
      clearNotifications: function(){
        this.notifications=[];
      },
      changeContentPage: function (pageNum) {
        this.isLoadingContent = true
        this.currentContentPage = pageNum
        this.socket.emit('loadcontent', pageNum, this.showPrivate, this.currentFolder.id ? this.currentFolder.id : 0)
      },
      goBack: function (){
        if(typeof this.currentFolder.id=='undefined'){
          this.showPrivate=null;
          this.contentList=[];
        }else if(this.currentFolder.parent_id ==0){
          this.currentFolder={}
          this.privateContent(this.showPrivate);
        }else{
          this.currentFolder={id: this.currentFolder.parent_id}
          this.changeContentPage(1);
        }
      },
      changeLayout: function (e){
        this.layout=e.target.value;
        this.socket.emit('layout', e.target.value);
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
        /*if (!document.querySelector('.timer-container').contains(ev.target)) {
          this.showTimer=false
        }*/
        if (!document.querySelector('.notification-container').contains(ev.target)) {
          this.showNotifications = false
        }
        if (!document.querySelector('.participant-container').contains(ev.target)) {
          this.showParticipants = false
        }
        if (!document.querySelector('#play-menu .dropdown').contains(ev.target)) {
          this.toggleMenu(true)
        }
      },
      endSession: function(){
        this.isLoading=true;
        Vue.toasted.info('Discussion has been ended. You will be redirected to home page soon...', { position: 'bottom-right' })
        setTimeout(()=>{window.location='/'},3000)
        this.socket.emit('endsession');
      },
      calculateRemainingTime: function(){
        let moment=require('moment')
        let currentTime=moment();
        let courseStartTime=moment(this.course.startTime);
        if(currentTime >= courseStartTime){
          let duration=moment.duration(courseStartTime.add(this.course.duration,'minutes').diff(currentTime));
          if(duration.seconds() <= 0) return 0;
          this.remainingDuration.hours=duration.hours();
          this.remainingDuration.minutes=duration.minutes();
          this.remainingDuration.seconds=duration.seconds();
          return duration.asSeconds();
        }
        return 0;
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
      showParticipantList: function (index){
        this.participantList.push(index);
      },
      hideParticipantList: function (index){
        let currentIndex=this.participantList.indexOf(index);
        this.participantList.splice(currentIndex,1);
      },
      changeGroupLeader: function (index, identity, peerId) {
        this.socket.emit('changeleader', index, identity, peerId);
      },
      addParticipants: function (index) {
        let that=this;
        that.selectedParticipants.forEach(function(participant,participantIndex){
          if(participantIndex==0 && that.breakouts[index].participants.length ==0) that.breakouts[index].groupLeader=participant;
          that.breakouts[index].participants.push(participant);
          delete that.remaining_participants[participant];
          that.socket.emit('addparticipant',index, participant, that.allParticipants[participant].peerId);
        });
        that.manageBreakout();
        that.toggleModel('participants');
        that.toggleModel('breakout');
      }, 
      addParticipantToBreakout: function (index) {
        let that=this;
        that.selectedParticipants=[];
        that.addBreakoutIndex=index;
        that.breakout=Object.assign({},that.breakouts[index]);
        that.toggleModel('participants');
        that.toggleModel('breakout');
      },
      confirmParticipantRemove: function (index, identity) {
        let that=this;
        that.participantToRemove={'index': index,'identity': identity};
        that.toggleModel('confirmbox-participant');
      },
      removeParticipant: function (index, identity) {
        let that=this;
        let breakout=that.breakouts[index];
        let userIndex=breakout.participants.indexOf(identity);
        breakout.participants.splice(userIndex,1);
        if(breakout.groupLeader == identity){
          breakout.groupLeader=null;
          if(breakout.participants.length) breakout.groupLeader=breakout.participants[0];
        }
        that.remaining_participants[identity]=Object.assign({},that.participants[identity]);
        that.breakouts[index]=breakout;
        that.manageBreakout();
        that.socket.emit('delparticipant',index, identity, that.allParticipants[identity].peerId);
      },
      createBreakout: function (){
        let that = this;
        that.breakouts.push({name: that.breakoutName,participants: [],groupLeader: null,timeOut: 60,startTime: new Date().getTime()});
        that.socket.emit('createbreakout',that.breakouts);
        that.manageBreakout();
        that.toggleModel('createbreakout');
        that.toggleModel('breakout');
      },
      // createBreakout: function () {
      //   let that =this;
      //   //that.isBreakoutActive=true;
      //   that.breakouts.push(that.breakout);
      //   that.breakout={participants: [],groupLeader: null,timeOut: 60,startTime: new Date().getTime()};
      //   that.socket.emit('createbreakout',that.breakouts);
      // },
      changeRoom: function (identity, room) {
        let that=this;
        if(room==0){
          let userIndex=that.breakout.participants.indexOf(identity);
          that.breakout.participants.splice(userIndex,1);
          if(that.breakout.groupLeader == identity){
            that.breakout.groupLeader=null;
            if(that.breakout.participants.length) that.breakout.groupLeader=that.breakout.participants[0];
          }
          that.remaining_participants[identity]=Object.assign({},that.participants[identity]);
        }else{
          if(that.breakout.participants.length < 1){
            that.breakout.groupLeader=identity;
            that.breakout.timeOut=60;
          }
          that.breakout.participants.push(iidentitydentity);
          if(that.remaining_participants[identity]) delete that.remaining_participants[identity];
        }
      },
      enterRoom: function (event) {
        let value=event.target.value;
        event.target.value='-1';
        if(value=='create'){
          this.toggleModel('createbreakout');
          return;
        }
        this.socket.emit('enterroom',value);
      },
      changeTimeout: function (index,breakout){
        let that=this;
        that.socket.emit('createbreakout',that.breakouts);
      },
      endBreakout: function () {
        let that=this;
        this.selectedBreakouts.forEach(function(index){
          that.socket.emit('endbreakout',index);
        })
        setTimeout(function(){
          window.location.reload();
        },200);
      },
      endAllBreakout: function () {
        let that=this;
        this.breakouts.forEach(function(breakout,index){
          that.socket.emit('endbreakout',index);
        });
        setTimeout(function(){
          window.location.reload();
        },200);
      },
      exitBreakout: function(index){
        this.socket.emit('exitbreakout',index);
        setTimeout(function(){
          window.location.reload();
        },200);
      },
      manageBreakout: function () {
        let that=this
        that.breakout.participants=[];
        that.remaining_participants=Object.assign({},that.participants);
        that.breakouts.forEach(function(breakout){
          breakout.participants.forEach(function(identity){
            if(that.remaining_participants[identity]) delete that.remaining_participants[identity];
          });
        });
      },
      updatePausedYT: function (type, e){
        this.socket.emit('updatepaused',e.target.a.id, 'youtube-player', type, e.target.getCurrentTime());
      },
      updatePaused: function (tabId,e){
        this.socket.emit('updatepaused',tabId, e.target.localName, e.type, e.target.currentTime);
      },
      toggleMute: function (mediaId){
        let elem= document.getElementById(mediaId);
        if(!elem) return;
        if(typeof this.speaker[mediaId] == 'undefined') this.speaker[mediaId]=false;
        this.speaker[mediaId] = !this.speaker[mediaId];
        elem.muted=!this.speaker[mediaId];
      },
      toggleVideo: function () {
        this.isVidAvailable = !this.isVidAvailable
        if(this.isVidAvailable && this.isScreenShared){
          this.isScreenShared=false;
        }
      },
      toggleAudio: function () {
        this.isAudioAvailable = !this.isAudioAvailable
      },
      toggleRecording: function () {
        this.isRecordingAvailable = !this.isRecordingAvailable
      },
      stopRecording: function () {
        this.isRecordingAvailable = false
      },
      stopScreenShare: function () {
        this.isScreenShared = false
      },
      toggleBox: function (box) {
        switch(box){
          case 'chat':
            this.showChatBox=!this.showChatBox;
          break;
          case 'webcam':
            this.showWebCamBox=!this.showWebCamBox;
          break;
        }
        this.handleResize();
      },
      toggleScreen: function () {
        this.isScreenShared = !this.isScreenShared
        if(this.isScreenShared){
          this.isVidAvailable=false;
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
        this.handleResize();
        if (!triggeredByEvent) this.socket.emit('tabremove', tabId)
        if (e) e.stopPropagation()
      },
      handleResize: function (firstTime) {
        let that=this;
        that.$nextTick(function () {
          // right-sidebar margin
          document.querySelector('.right-sidebar').style="margin-top: "+(document.getElementById('play-menu').clientHeight) +"px";
          // Remaining playground height= (Window - NavBar - Navbar bottom Margin - Playground bottom margin)
          let heightToPlay = window.innerHeight - document.querySelector('.header-bar').clientHeight - 16 - 16
          // Remaining ChatList height= (Playground - Playground margin - Playground padding - Playground border - Video - ChatBox margin - Chatbox heading - Chat Input - PlayMenu Height - Margin Top Right Sidebar - Margin Bottom Video Box - Video Box Header)
          let heightToChat = heightToPlay - 12 - 16 - 32 - 1 - /*document.querySelector('.chat-bar').clientHeight -*/ document.getElementById('video-container').clientHeight - 16 - 33 - document.querySelector('.chat-input').clientHeight - document.getElementById('play-menu').clientHeight - 16 - 16 - 49
          // minHeight=video + top margin + padding + heading + heading margin + bottom margin + Play Menu Height +  Margin Top Right Sidebar + Margin Bottom Video Box + Video Box Header +  minHeight for chatlist
          let minHeight = document.getElementById('video-container').clientHeight + 16 + 32 + 33 + 8 + 10 + document.getElementById('play-menu').clientHeight + 16 + 16 + 49 +130 + /*document.querySelector('.chat-bar').clientHeight +*/ document.querySelector('.chat-input').clientHeight

          if (heightToPlay < minHeight) heightToPlay = minHeight
          document.querySelector('.playground').style = (window.innerWidth <= 768 ? '' : 'height: ' + heightToPlay + 'px;') + ' min-height: ' + minHeight + 'px'
          if (heightToChat < 0) heightToChat = 116
          document.querySelectorAll('.chat-list').forEach(tab => {
            tab.style = 'height: ' + heightToChat + 'px;min-height: 116px'
          })
          let rightSideHeight = heightToPlay - 16 - 16 - 1 - document.getElementById('play-menu').clientHeight
          if(that.isInFullScreen()){
            rightSideHeight=window.innerHeight- document.getElementById('play-menu').clientHeight;
          }
          // rightSideHeight= rightSideHeight < minHeight ? minHeight : rightSideHeight;
          let playWidth=document.getElementById('content-block').clientWidth;
          document.querySelectorAll('.content-tabs').forEach(function (tab) {
            tab.style = 'height: ' + rightSideHeight + 'px'
            tab.querySelectorAll('canvas').forEach(function(canvas){
              canvas.setAttribute('height',rightSideHeight);
              canvas.setAttribute('width',playWidth);
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
            this.socket.emit('tabchanged', tabId)
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
            this.socket.emit('tabchanged', tabId)
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
      saveToPdf: function(){
        let that=this;
        Vue.toasted.info("Generating pdf from the content!",{position: 'bottom-right'}).goAway(3000);
        new Promise((resolve,reject)=>{
          let docDefinition={
            styles: {
              intialheader: {
                fontSize: 24,
                bold: true
              },
              header: {
                fontSize: 18,
                bold: true
              },
              subheader: {
                fontSize: 15,
                bold: true
              },
              quote: {
                italics: true
              },
              small: {
                fontSize: 8
              },
              code: {
                fontSize: 12,
                italics: true
              }
            }
          };
          let docIndex=[];
          let content=[
            {text: that.course.title, style: 'intialheader',alignment: 'center',margin: [0, 200]},
            {text: 'Table of Content', style: 'header',alignment: 'center',pageBreak: 'before'},
          ];
          let contentPages=[  
          ];
          let mediaLinks=[];
          let isMediaPresent=false;
          that.contentTabs.forEach(function(tab){
            if(['code','whiteboard','content'].indexOf(tab.type) !==-1){
              docIndex.push({
                text: [
                        'Page #',
                        { pageReference: tab.id },
                        ': ',
                        { textReference: tab.id }
                      ]
              });
            }
            if(['media','youtube'].indexOf(tab.type) !== -1){
              if(!isMediaPresent) isMediaPresent=true;
              mediaLinks.push({
                text: tab.name+" : "+(tab.type=='youtube' ? 'https://www.youtube.com/watch?v='+tab.videoId : tab.url),
                margin: [0,2]
              })
            }
            switch(tab.type){
              case 'whiteboard':
                contentPages.push({
                  text: tab.name,
                  style: 'header',
                  id: tab.id,
                  pageBreak: 'before'
                });
                contentPages.push({
                  image: document.querySelector('#'+tab.id+' .paint-canvas-local').toDataURL('image/png', 0.1),
                  width: 800,
                  height: 600,
                  margin: [0,10]
                });
              break;
              case 'content':
                contentPages.push({
                  text: tab.name,
                  style: 'header',
                  id: tab.id,
                  pageBreak: 'before'
                });
                contentPages.push({
                  image: document.querySelector('#'+tab.id+' .paint-canvas-local').toDataURL('image/png', 0.1),
                  width: 800,
                  height: 600,
                  margin: [0,10]
                });
              break;
              case 'code':
                contentPages.push({
                  text: tab.name,
                  style: 'header',
                  id: tab.id,
                  pageBreak: 'before'
                });
                contentPages.push({
                  text: Ace.edit(tab.id).getValue(),
                  style: 'code',
                  margin: [0,10]
                });
              break;
            }
          });
          if(isMediaPresent){
            docIndex.push({
              text: [
                      'Page #',
                      { pageReference: 'media-list' },
                      ': ',
                      { textReference: 'media-list' }
                    ]
            });
          }
          docIndex.push({
            text: [
                    'Page #',
                    { pageReference: 'chat-list' },
                    ': ',
                    { textReference: 'chat-list' }
                  ]
          });
          content.push({
            ul: docIndex
          });
          // add media to second last page
          if(isMediaPresent){
            contentPages.push({
              text: 'Media',
              style: 'header',
              id: 'media-list',
              pageBreak: 'before'
            })
                
            contentPages.push({
              ul: mediaLinks
            })
          }
          // add chat to last page
          let chats=[];
          document.querySelectorAll('.chat-list li').forEach(function(li){  
            chats.push(li.innerText);
          });
          contentPages.push({
            text: 'Chat',
            style: 'header',
            id: 'chat-list',
            pageBreak: 'before'
          })
          contentPages.push({
            ul: chats
          })
          // combine intitial pages and content pages
          content=content.concat(contentPages);

          docDefinition.content = content;
          resolve(docDefinition);
        }).then(doc=>{
          let pdf = PdfMake.createPdf(doc);
          var saveData = (function () {
              var a = document.createElement("a");
              document.body.appendChild(a);
              a.style = "display: none";
              return function (blob, fileName) {
                var url;
                if(window.webkitURL){
                  url=window.webkitURL;
                }else if(window.URL && window.URL.createObjectURL){
                  url=window.URL;
                }else{
                  console.log("Browser doesn't support generating object url");
                  return false;
                }
                let href=url.createObjectURL(blob);
                a.href = href;
                a.download = fileName;
                a.click();
                url.revokeObjectURL(href);
              };
          }());
          return pdf.getBlob(function(blob){
            saveData(blob,'Workspace.pdf');
          });
        }).catch(function(err){
          console.log(err);
          Vue.toasted.error(err,{position: 'bottom-right'}).goAway(3000);
        })
      },
      exportTemplate: function() {
        this.toggleMenu();
        let exportingToast=Vue.toasted.info('Exporting template <div class="d-flex justify-content-center loader-container"><div class="lds-ripple"><div class="border-dark"></div><div class="border-dark"></div></div></div>',{position: 'bottom-right'});
        this.socket.emit('exporttemplate', function (err,fileBuffer) {
          exportingToast.goAway(0);
          if(err){
            Vue.toasted.error('Export failed!',{position: 'bottom-right'}).goAway(1500);
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
      changePermission: function (user, actionFor){
        let that=this;
        that.participants[user.identity].permissions[actionFor]=!that.participants[user.identity].permissions[actionFor]
        that.participants=Object.assign({},that.participants);
        that.socket.emit('changepermission', user.peerId, actionFor, that.participants[user.identity].permissions[actionFor]);
      },
      privateContent: function(isPrivate){
        this.showPrivate=isPrivate;
        this.changeContentPage(1);
      },
      addFolder: function (folderName){
        this.socket.emit('addfolder', folderName, this.showPrivate, this.currentFolder.id ? this.currentFolder.id : 0);
      },
      deleteFolder: function (folder){
        this.socket.emit('deletefolder', folder.id);
      },
      loadFolder: function (folder){
        let that=this;
        that.currentFolder=folder;
        that.changeContentPage(1);
      },
      loadContent: function (content) {
        let that=this;
        let tabId = that.uuidv4()
        let contentPages={};
        content.images.forEach(img=>{
          let pageId=that.uuidv4();
          contentPages[pageId]={id: pageId, image: img, drawings: []}
        })
        let tabItem = { id: tabId, name: 'Content - ' + content.name, type: 'content', content: contentPages, contentType: content.type }
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
      resetRoom: function(){
        document.querySelector('.webcam-container').style="";
        document.querySelector('.chat-container').style="";
        this.layout="classroom-view";
      },
      dragBox: function(className,e){
        if(e.clientY<= 5 || e.clientX <= 5) return;
        let rightWidth=document.querySelector('.right-sidebar').clientWidth -30;
        document.querySelector('.'+className).style="z-index: 99999;position:fixed;top:"+(e.clientY-40)+"px;left:"+(e.clientX - rightWidth + 45)+"px;width: "+rightWidth+"px";
      },
      isInFullScreen: function(){
        return (document.fullscreenElement && document.fullscreenElement !== null) ||
        (document.webkitFullscreenElement && document.webkitFullscreenElement !== null) ||
        (document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
        (document.msFullscreenElement && document.msFullscreenElement !== null);
      },
      toggleFullscreen: function (elemId) {
        if (this.isInFullScreen()) {
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
      },
      openSettings: function(){
        this.toggleModel('videosetting');
        this.changeDevice();
      },
      closeSettings: function(){
        if (window.testStream) {
          window.testStream.getTracks().forEach(function(track) {
            track.stop();
          });
        }
        this.toggleModel('videosetting');
      },
      changeDevice: function(){
        let that= this;
        if (window.testStream) {
          window.testStream.getTracks().forEach(function(track) {
            track.stop();
          });
        }
        if(window.stream){
         window.stream.getTracks().forEach(function(track) {
            track.stop();
          }); 
        }
        this.isVidAvailable=false;
        this.isAudioAvailable=false;


        const constraints = {
          audio: {
            deviceId: {exact: this.selectedMic}
          },
          video: {
            deviceId: {exact: this.selectedCamera}
          }
        };
        navigator.mediaDevices.getUserMedia(constraints).
          then(function(stream){
            
            window.testStream=stream;
            document.getElementById('testVideo').srcObject=stream;

            // check audio
            let audioContext = new AudioContext();
            let analyser = audioContext.createAnalyser();
            let microphone = audioContext.createMediaStreamSource(stream);
            let javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 1024;

            microphone.connect(analyser);
            analyser.connect(javascriptNode);
            javascriptNode.connect(audioContext.destination);
            javascriptNode.onaudioprocess = function() {
                var array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);
                var values = 0;

                var length = array.length;
                for (var i = 0; i < length; i++) {
                  values += (array[i]);
                }
                var average = values / length;
                that.volumePts = Math.round(average/10);
            }
          }).catch(function(error){
            Vue.toasted.error(error, { position: 'bottom-right' }).goAway(1500)
          });
      },
      updateConnectionStatus: function(){
        this.connectivitySettings.internet=navigator.onLine;
      },
      updateNetworkInfo: function(){
        this.connectivitySettings.downlink=navigator.connection.downlink;
        this.connectivitySettings.rtt=navigator.connection.rtt;
      },
      getSpeedInfo: function(){
        let that=this;
        
        let jsBandwidth=new JsBandwidth();
        jsBandwidth.testSpeed({latencyTestUrl: that.serverUrl+'/check',downloadUrl: that.serverUrl+'/check',uploadUrl: that.serverUrl+'/check'}).then(function(result){
          that.connectivitySettings.download=(result.downloadSpeed < 0 || isNaN(result.downloadSpeed) ? result.downloadSpeed : Math.floor((result.downloadSpeed / 1000000) * 100) / 100);
          that.connectivitySettings.upload=(result.uploadSpeed < 0 || isNaN(result.uploadSpeed) ? result.uploadSpeed : Math.floor((result.uploadSpeed / 1000000) * 100) / 100);
          that.connectivitySettings.latency=result.latency;
        });
      }
    },
    computed: {
      orderedNotifications: function(){
        return Object.assign([],this.notifications).reverse();
      }
    },
    watch: {
      course: function (course) {
        document.title = course.title
      },
      isVidAvailable: function(){
        this.showWebCamBox=this.isVidAvailable;
      }
    },
    created: function () {
      let that=this;
      that.course = { title: 'Devil-101 \uD83D\uDE08' }
      // get audio,video devices
      navigator.mediaDevices.enumerateDevices()
      .then(function(devices){
        devices.forEach(function(device){
          if (device.kind === 'audioinput') {
            that.audioDevices.push({
              id: device.deviceId,
              name: device.label || 'microphone ' + (that.audioDevices.length + 1)
            });
          }else if (device.kind === 'videoinput') {
            that.videoDevices.push({
              id: device.deviceId,
              name: device.label || 'camera ' + (that.videoDevices.length + 1)
            });
          }
        });
        if(that.audioDevices.length) that.selectedMic=that.audioDevices[0].id;
        if(that.videoDevices.length) that.selectedCamera=that.videoDevices[0].id;
      }).catch(function(error){
        Vue.toasted.error(error, { position: 'bottom-right' }).goAway(1500)
      });
      window.addEventListener('online', that.updateConnectionStatus);
      window.addEventListener('offline', that.updateConnectionStatus);
      navigator.connection.addEventListener('change', that.updateNetworkInfo);
      
    },
    beforeDestroy: function () {
      window.removeEventListener('resize', this.handleResize)
      window.removeEventListener('click', this.handleClick)
    }
  })
})()
