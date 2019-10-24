var messageList = require('vue').component('message-list', require('./message-list'))
module.exports={
    props: ['socket', 'loggedInUser', 'participants','showChatBox','showWebCamBox'],
    data: function () {
      return {
        chatMessage: '',
        messageGroups: [{ name: 'common', messages: [], newMessage: false, hideMe: false }],
        currentGroup: 'common'
      }
    },
    components: { messageList: messageList },
    methods: {
      addComment: function () {
        let that = this
        let message = Object.freeze(that.chatMessage)
        if (message.trim() !== '') {
          that.socket.emit('chatmessage', message, that.currentGroup)
        }
        that.chatMessage = ''
      },
      initChatWith: function (groupName) {
        var that = this
        let foundGroup = -1
        let chatWith = 'common'
        if (groupName !== 'common') {
          let chatWithIdentity = groupName.split('_')
          let loggedInIndex = chatWithIdentity.indexOf(that.loggedInUser.identity)
          if (loggedInIndex === -1) return
          chatWith = chatWithIdentity[1 - loggedInIndex]
        }

        that.messageGroups.forEach((group, index) => {
          if (groupName === group.name) {
            foundGroup = index
          }
        })
        if (foundGroup === -1) {
          that.messageGroups.push({
            name: groupName,
            messages: [],
            newMessage: false,
            to: Object.assign({}, that.loggedInUser),
            from: Object.assign({}, that.participants[chatWith])
          })
          foundGroup = (that.messageGroups.length - 1)
        }
        that.messageGroups[foundGroup].newMessage = false
        return [foundGroup, groupName]
      },
      chatWith: function (identity) {
        var that = this
        let groupName = [identity, that.loggedInUser.identity].sort().join('_')
        if (identity === 'common') groupName = identity
        let [foundGroup, _] = that.initChatWith(groupName) // eslint-disable-line
        that.messageGroups[foundGroup].hideMe = false
        that.currentGroup = groupName
        this.$emit('chat-group-changed')
        that.scrollToBottom()
      },
      removeChat: function (index, e) {
        var that = this
        that.messageGroups[index]['hideMe'] = true
        setTimeout(function () {
          that.currentGroup = 'common'
          that.messageGroups[0].hideMe = false
          that.scrollToBottom()
        }, 10)
        e.stopPropagation()
      },
      scrollToBottom: function () {
        setTimeout(function () {
          document.querySelectorAll('.chat-list').forEach(listObj => {
            listObj.scrollTop = listObj.scrollHeight + 18
          })
        }, 10)
      }
    },
    watch: {
      showChatBox: function(val){
        if(val){
          this.scrollToBottom();
        }
      },
      showWebCamBox: function(val){
        if(this.showChatBox){
          this.scrollToBottom();
        }
      },
      socket: function () {
        var that = this
        that.socket.on('reconnect', function(){
          that.messageGroups= [{ name: 'common', messages: [], newMessage: false, hideMe: false }];
        });
        that.socket.on('chatmessage', (msg, groupName) => {
          let [foundGroup, _] = that.initChatWith(groupName) // eslint-disable-line
          msg = JSON.parse(msg)
          that.messageGroups[foundGroup].messages.push(msg)
          if (groupName !== that.currentGroup) {
            that.messageGroups[foundGroup].newMessage = true
            that.messageGroups[foundGroup].hideMe = false
          }
          that.scrollToBottom()
        })
        that.socket.on('chatgroup', (group) => {
          group = JSON.parse(group)
          group.newMessage = false
          group.hideMe = true
          if (group.name === 'common') {
            that.messageGroups[0].messages = group.messages
          } else {
            that.messageGroups.push(group)
          }
          that.scrollToBottom()
        })
      }
    },
    template: '#chat-box'
  }