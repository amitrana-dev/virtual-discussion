module.exports={
    props: ['item','socket'],
    template: '#white-board',
    data: function () {
      return {
        paint: null
      }
    },
    methods: {
      listenToSocket: function () {
        let that=this;
        that.socket.on('drawing',function (drawing,tabId) {
          if (tabId !== that.item.id) return
          that.paint.addDrawing(drawing);
          that.paint.redrawLocals();  
        });
        that.socket.on('undo',function (tabId) {
          if (tabId !== that.item.id) return
          that.paint.undoManually();
        })
      }
    },
    watch: {
      socket: function (newVal,oldVal) {
        this.listenToSocket();
      }
    },
    mounted: function () {
      let that=this;
      that.paint=require('../paint/paint')(document.getElementById(this.item.id))
      that.paint.addEventListener("userdrawing", function (event) {
        that.socket.emit('drawing',event.drawing,that.item.id);
      });
      that.paint.addEventListener("undo", function (event) {
        that.socket.emit('undo',that.item.id);
      });
      if(that.socket){
        that.listenToSocket();
      }
    }
  }