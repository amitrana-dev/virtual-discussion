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
        that.socket.on('highlight',function (drawing, tabId, typeOfBoard, pageId) {
          if (tabId !== that.item.id) return
          that.paint.effectsCanvas.style.opacity=0.5;
          if(that.paint.clearHighlightTimer) clearTimeout(that.paint.clearHighlightTimer);
          if(typeOfBoard === 'content'){
            let currentPage=that.getCurrentPage();
            if(currentPage.id === pageId){
              that.paint.addHighlight(drawing);
              that.paint.clearHighlightTimer=setTimeout(function(){
                that.paint.effectsCanvasCtx.clearRect(0, 0, that.paint.effectsCanvas.width, that.paint.effectsCanvas.height);  
              },5000);
            }
          }else{
            that.paint.addHighlight(drawing)
            that.paint.clearHighlightTimer=setTimeout(function(){
              that.paint.effectsCanvasCtx.clearRect(0, 0, that.paint.effectsCanvas.width, that.paint.effectsCanvas.height);  
            },5000);
          }
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
          that.paint.setLocalZoom(event.zoom);
          that.paint.zoom(event.zoomFactor, true);  
        });
        that.socket.on('grid',function (event,tabId) {
          if (tabId !== that.item.id) return
          that.paint.showGrid(event.show, true);  
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
      that.paint.addEventListener("highlight", function (event) {
        if(that.item.type==='content'){
          currentPage=that.getCurrentPage();
          that.socket.emit('highlight',event.drawing,that.item.id,'content',currentPage.id);  
        }else{
          that.socket.emit('highlight',event.drawing,that.item.id,'whiteboard');
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
      that.paint.addEventListener("grid", function (event) {
        delete event.target;
        if(that.item.type==='content'){
          currentPage=that.getCurrentPage();
          that.socket.emit('grid',event,that.item.id,'content',currentPage.id);  
        }else{
          that.socket.emit('grid',event,that.item.id, 'whiteboard');
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