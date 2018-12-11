'use strict'
const CONFIG=require('./config');
var Utility = function () {
  function initUtitlities (redis, socket, io, mapSocketToDiscussion, user) {
    socket.on('raisehand', function () {
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('raisedhand on ' + discussionId + ' by ' + socket.id) }
      redis.hget('presenters', discussionId, (err, presenter) => {
        if (err && CONFIG.DEBUG) console.warn(err)
        if (presenter) {
          presenter=JSON.parse(presenter);
          io.to(presenter.peerId).emit('raisehand', { user: user, timestamp: new Date() })
        }
      })
    })
  }
  return {
    init: initUtitlities
  }
}
module.exports = Utility
