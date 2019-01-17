module.exports={
    props: ['item','socket'],
    template: '#white-board',
    data: function () {
      return {
        paint: null
      }
    },
    methods: {
      goNext: function () {
        if(this.item.currentPage < Object.keys(this.item.content).length){
          this.item.currentPage +=1;
          this.switchPage();
        }
      },
      goPrev: function () {
        if(this.item.currentPage > 1){
          this.item.currentPage -=1;
          this.switchPage();
        }
      },
      getCurrentPage: function () {
        let that=this;
        that.item.currentPage=that.item.currentPage || 1
        return that.item.content[Object.keys(that.item.content)[that.item.currentPage - 1]];
      },
      switchPage: function (dontEmit) {
        let that=this;
        if(that.item.type==='content'){
          let currentPage=that.getCurrentPage();
          let image=currentPage.image;
          that.paint.clear();
          that.paint.addBackgroundImage(image);
          currentPage.drawings.forEach(drawing=>{
            that.paint.addDrawing(drawing);
          });
          that.paint.goto(0,0,true);
          that.paint.redrawLocals();
          if(!dontEmit) that.socket.emit('changepage',that.item.id,that.item.currentPage);
        }
      },
      listenToSocket: function () {
        let that=this;
        that.socket.on('drawing',function (drawing, tabId, typeOfBoard, pageId) {
          if (tabId !== that.item.id) return
          if(typeOfBoard === 'content'){
            that.item.content[pageId].drawings.push(drawing);
            let currentPage=that.getCurrentPage();
            if(currentPage.id === pageId) that.paint.addDrawing(drawing);
          }else{
            that.paint.addDrawing(drawing)
          }
          that.paint.redrawLocals();
        });
        that.socket.on('changepage',function (tabId,page) {
          if (tabId !== that.item.id) return
          that.item.currentPage=page
          that.switchPage(true);
        });
        that.socket.on('move',function (event,tabId) {
          if (!event.leftTopX || tabId !== that.item.id) return
          that.paint.goto(event.leftTopX,event.leftTopY, true);  
        });
        that.socket.on('zoom',function (event,tabId) {
          if (!event.zoomFactor || tabId !== that.item.id) return
          that.paint.zoom(event.zoomFactor, true);  
        });
        that.socket.on('undo',function (tabId, typeOfBoard, pageId) {
          if (tabId !== that.item.id) return
          if(typeOfBoard === 'content'){
            that.item.content[pageId].drawings.pop();
          }
          that.paint.undo(true);
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
      let currentPage;
      that.paint=require('../paint/paint')(document.getElementById(that.item.id))
      if(that.item.type==='content'){
        let currentPage=that.getCurrentPage();
        that.paint.addBackgroundImage(currentPage.image);
      }
      that.paint.addEventListener("userdrawing", function (event) {
        if(that.item.type==='content'){
          currentPage=that.getCurrentPage();
          currentPage.drawings.push(event.drawing);
          that.socket.emit('drawing',event.drawing,that.item.id,'content',currentPage.id);  
        }else{
          that.socket.emit('drawing',event.drawing,that.item.id,'whiteboard');
        }
      });
      that.paint.addEventListener("move", function (event) {
        delete event.target;
        if(that.item.type==='content'){
          currentPage=that.getCurrentPage();
          that.socket.emit('move',event,that.item.id,'content',currentPage.id);  
        }else{
          that.socket.emit('move',event,that.item.id, 'whiteboard');
        }
      });
      that.paint.addEventListener("zoom", function (event) {
        delete event.target;
        if(that.item.type==='content'){
          currentPage=that.getCurrentPage();
          that.socket.emit('zoom',event,that.item.id,'content',currentPage.id);  
        }else{
          that.socket.emit('zoom',event,that.item.id, 'whiteboard');
        }
      });
      that.paint.addEventListener("undo", function (event) {
        if(that.item.type==='content'){
          currentPage=that.getCurrentPage();
          currentPage.drawings.pop();
          that.socket.emit('undo',that.item.id,'content',currentPage.id);  
        }else{
          that.socket.emit('undo',that.item.id, 'whiteboard');
        }
      });
      window.addEventListener('resize', function (event){
        that.switchPage(true);
      });
      if(that.socket){
        that.listenToSocket();
      }
    }
  }