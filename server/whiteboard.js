'use strict'
const CONFIG=require('./config');
var Whiteboard = function () {
  function initBoard (redis, socket, io, mapSocketToDiscussion, user) {
    function initWorkPlace(workplace, tabId, typeOfBoard, pageId){
      workplace = JSON.parse(workplace)
      if(typeOfBoard === 'content'){
        if (!workplace['content']) workplace['content'] = {}
        if (!workplace['content'][tabId]) workplace['content'][tabId] = {'currentPage': 1, 'pages': {}}
        if (pageId && !workplace['content'][tabId]['pages'][pageId]) workplace['content'][tabId]['pages'][pageId] = {'drawings': [],'currentPos': {}, 'zoom': {}}
      }else{
        if (!workplace['whiteboard']) workplace['whiteboard'] = {}
        if (!workplace['whiteboard'][tabId]) workplace['whiteboard'][tabId] = {'drawings': [],'currentPos': {},'zoom': {}}
      }
      return workplace;
    }
    socket.on('drawing', function (drawing,tabId, typeOfBoard, pageId) {
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('drawing ' + discussionId + ' ' + drawing) }
      socket.to(discussionId).emit('drawing', drawing, tabId, typeOfBoard, pageId);
      redis.hget('workplace', discussionId, (err, workplace) => {
        if (err && CONFIG.DEBUG) console.warn(err)
        if (workplace) {
          workplace=initWorkPlace(workplace, tabId, typeOfBoard, pageId);
          if(typeOfBoard === 'content'){
            workplace['content'][tabId]['pages'][pageId]['drawings'].push(drawing)  
          }else{
            workplace['whiteboard'][tabId]['drawings'].push(drawing)
          }
          redis.hset('workplace', discussionId, JSON.stringify(workplace))
        }
      })
    });
    socket.on('highlight', function (drawing,tabId, typeOfBoard, pageId) {
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('highlight ' + discussionId + ' ' + drawing) }
      socket.to(discussionId).emit('highlight', drawing, tabId, typeOfBoard, pageId);
    });
    socket.on('changepage', function (tabId,page) {
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('changepage ' + tabId + ' on '+ page) }
      redis.hget('workplace', discussionId, (err, workplace) => {
        if (err && CONFIG.DEBUG) console.warn(err)
        if (workplace) {
          workplace=initWorkPlace(workplace, tabId, 'content');
          workplace['content'][tabId]['currentPage'] = page
          redis.hset('workplace', discussionId, JSON.stringify(workplace))
        }
      })
      socket.to(discussionId).emit('changepage', tabId, page)
    })
    socket.on('move', function (event,tabId, typeOfBoard, pageId) {
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('move ' + discussionId) }
      redis.hget('workplace', discussionId, (err, workplace) => {
        if (err && CONFIG.DEBUG) console.warn(err)
        
        if (workplace) {
          workplace=initWorkPlace(workplace, tabId, typeOfBoard, pageId);
          if(typeOfBoard==='content'){
            workplace[typeOfBoard][tabId]['pages'][pageId]['currentPos'] = event
          }else{
            workplace[typeOfBoard][tabId]['currentPos'] = event
          }
          redis.hset('workplace', discussionId, JSON.stringify(workplace))
        }
      })
      socket.to(discussionId).emit('move', event, tabId, typeOfBoard, pageId);
    });
    socket.on('zoom', function (event,tabId, typeOfBoard, pageId) {
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('zoom ' + discussionId + ' ' + event) }
      redis.hget('workplace', discussionId, (err, workplace) => {
        if (err && CONFIG.DEBUG) console.warn(err)
        
        if (workplace) {
          workplace=initWorkPlace(workplace, tabId, typeOfBoard, pageId);
          if(typeOfBoard==='content'){
            workplace[typeOfBoard][tabId]['pages'][pageId]['zoom'] = event
          }else{
            workplace[typeOfBoard][tabId]['zoom'] = event
          }
          redis.hset('workplace', discussionId, JSON.stringify(workplace))
        }
      })
      socket.to(discussionId).emit('zoom', event, tabId, typeOfBoard, pageId);
    });
    socket.on('undo', function (tabId, typeOfBoard, pageId) {
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('undo ' + discussionId) }
      socket.to(discussionId).emit('undo', tabId, typeOfBoard, pageId);
      redis.hget('workplace', discussionId, (err, workplace) => {
        if (err && CONFIG.DEBUG) console.warn(err)
        if (workplace) {
          workplace=initWorkPlace(workplace, tabId, typeOfBoard, pageId);
          if(typeOfBoard === 'content'){
            workplace['content'][tabId]['pages'][pageId]['drawings'].pop()  
          }else{
            workplace['whiteboard'][tabId]['drawings'].pop()
          }
          redis.hset('workplace', discussionId, JSON.stringify(workplace))
        }
      })
    });
  }
  return {
    init: initBoard
  }
}
module.exports = Whiteboard
