'use strict'
const CONFIG=require('./config');
var Chat = function () {
  function initChat (redis, socket, io, mapSocketToDiscussion, user) {
    socket.on('chatmessage', function (msg,group) {
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('chatmessage ' + discussionId + ' ' + msg) }
       let message={ message: msg, user: user, timestamp: new Date() };
       redis.get('participants', (err, participants) => {
        if (err && CONFIG.DEBUG) console.warn(err)
        if (participants) participants=JSON.parse(participants);
        let sendTo;
        if (participants && participants[mapSocketToDiscussion[socket.id]]) {
          if(group) {
            let groupMembers=group.split('_');
            let loggedInIndex=groupMembers.indexOf(user.identity);
            Object.keys(participants[mapSocketToDiscussion[socket.id]]).forEach(peerId=>{
              let myIndex=groupMembers.indexOf(participants[mapSocketToDiscussion[socket.id]][peerId].identity);
              if(groupMembers[1-loggedInIndex]===participants[mapSocketToDiscussion[socket.id]][peerId].identity){
                sendTo=peerId;
                return;
              }
            });
          }
        }
        if(sendTo){
          // send to user
          socket.broadcast.to(sendTo).emit('chatmessage', JSON.stringify(message), group)
          // send to self
          socket.emit('chatmessage', JSON.stringify(message), group)
        }
        if(group=='common') io.sockets.in(discussionId).emit('chatmessage', JSON.stringify(message), group);
        redis.hget('workplace', discussionId, (err, workplace) => {
          if (err && CONFIG.DEBUG) console.warn(err)
          if (workplace) {
            workplace = JSON.parse(workplace)
            if (!workplace['chat']) workplace['chat'] = {'common': {name: 'common',messages: [],to: user}}
            if(!workplace['chat'].hasOwnProperty(group)){
              workplace['chat'][group]={name: group,messages: []};
            }
            if(sendTo){
              workplace['chat'][group]['to']=participants[mapSocketToDiscussion[socket.id]][sendTo];
              workplace['chat'][group]['from']=user;
            }
            workplace['chat'][group]['messages'].push(message);
            redis.hset('workplace', discussionId, JSON.stringify(workplace));
          }
        })
      })
    });
  }
  return {
    init: initChat
  }
}
module.exports = Chat
