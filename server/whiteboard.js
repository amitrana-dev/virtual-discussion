'use strict'
const CONFIG=require('./config');
var Whiteboard = function () {
  function initBoard (redis, socket, io, mapSocketToDiscussion, user) {
    socket.on('drawing', function (drawing,tabId) {
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('drawing ' + discussionId + ' ' + drawing) }
      socket.to(discussionId).emit('drawing', drawing, tabId);
      redis.hget('workplace', discussionId, (err, workplace) => {
        if (err && CONFIG.DEBUG) console.warn(err)
        if (workplace) {
          workplace = JSON.parse(workplace)
          if (!workplace['whiteboard']) workplace['whiteboard'] = {}
          if (!workplace['whiteboard'][tabId]) workplace['whiteboard'][tabId] = []
          workplace['whiteboard'][tabId].push(drawing)
          redis.hset('workplace', discussionId, JSON.stringify(workplace))
        }
      })
    });
    socket.on('undo', function (tabId) {
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('undo ' + discussionId) }
      socket.to(discussionId).emit('undo', tabId);
      redis.hget('workplace', discussionId, (err, workplace) => {
        if (err && CONFIG.DEBUG) console.warn(err)
        if (workplace) {
          workplace = JSON.parse(workplace)
          if (!workplace['whiteboard']) workplace['whiteboard'] = {}
          if (!workplace['whiteboard'][tabId]) workplace['whiteboard'][tabId] = []
          workplace['whiteboard'][tabId].pop()
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
