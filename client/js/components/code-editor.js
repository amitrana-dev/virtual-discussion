var Ace = require('../ace/ace')
Ace.config.set('basePath', 'js/ace/')
module.exports={
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
        this.editor.session.setMode('ace/mode/' + this.chosenLang)
        this.$emit('language-changed', this.chosenLang, tabId)
      },
      startSocket: function () {
        let that = this
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
      socket: function () {
        this.startSocket()
      }
    },
    mounted: function () {
      var that = this
      that.editor = Ace.edit(this.item.id)
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
      if (that.socket.connected) {
        that.startSocket()
      }
      setTimeout(function () {
        that.editor.resize()
      }, 100)
    }
  }