'use strict'
require('dotenv').config()
const CLUSTER = require('cluster')
const STICKY = require('sticky-session')
const HTTP = require('http')
const USER = require('./user')
const DISCUSSION = require('./discussion')()
const CHAT = require('./chat')()
const WHITEBOARD = require('./whiteboard')()
const UTILITY = require('./utility')()
const CONFIG=require('./config')
const FS=require('fs')


const SERVER = HTTP.createServer(function (req, res) {
  res.end('worker: ' + CLUSTER.worker.id)
})

if (!STICKY.listen(SERVER, CONFIG.PORT)) {
  SERVER.once('listening', function () {
    console.log('server started on ' + CONFIG.PORT + ' port')
  })
} else {
  console.log(`Worker ${process.pid} started`)
  const IO = require('socket.io')(SERVER, { origins: CONFIG.HOST+':*' })
  const CLIENT = require('redis').createClient
  const REDIS = require('redis').createClient(CONFIG.REDIS_PORT, CONFIG.REDIS_HOST, { auth_pass: CONFIG.REDIS_PWD })
  const REDIS_ADAPTOR = require('socket.io-redis')
  const PUB = CLIENT(CONFIG.REDIS_PORT, CONFIG.REDIS_HOST, { auth_pass: CONFIG.REDIS_PWD })
  const SUB = CLIENT(CONFIG.REDIS_PORT, CONFIG.REDIS_HOST, { auth_pass: CONFIG.REDIS_PWD })
  REDIS.on('error', function (err) {
    console.log(err)
  })
  REDIS.del(['presenters','mapSocketToDiscussion','participants']);
  function onConnect (socket) {
    let discussionId = socket.handshake.query['discussion_id']
    let userToken = socket.handshake.query['token']
    
    if (CONFIG.DEBUG) { console.log(userToken + ' connected on socket ' + socket.id) }
    
    Promise.all([DISCUSSION.getInfo(discussionId),USER.getUserInfoForDiscussion(userToken,discussionId)])
    .then((result) => {
      let [discussionInfo,user]=result
      user.peerId=socket.id;
      user.permissions={audio: false, video: false, edit: false};
      let loggedInUser=Object.assign({},user);
      delete user.id;
      
      // Join user to discusison
      socket.join(discussionId)
      
      // Peer Signaling for video/audio transmission 
      socket.on('message', function (data,peerId) {
          socket.broadcast.to(peerId).emit('message', data,socket.id);
      });

      socket.on('changepermission',function(peerId, action, value){
        REDIS.get('participants', (err, participants) => {
          if (err && CONFIG.DEBUG) console.warn(err)
          if (participants == null) {
            participants = {}
          } else {
            participants = JSON.parse(participants)
          }
          if (!participants[discussionId]) participants[discussionId] = {}
          participants[discussionId][peerId].permissions[action] = value
          socket.broadcast.to(peerId).emit('changepermission', action, value);
          REDIS.set('participants', JSON.stringify(participants), (err, res) => {
            if (err && CONFIG.DEBUG) console.warn(err)
          })
        })
      }) 
      // send info about connected peers
      socket.to(discussionId).emit('peer-connect',{socketId: socket.id,user: user});
      IO.in(discussionId).clients(function(err,clients){
        if(clients) clients=clients.filter(socketId=> socketId !== socket.id)
        socket.emit('connected',clients);
      });

      // send discussion details
      socket.emit('discussiondetail',discussionInfo);
      // send info that user is valid
      socket.emit('validuser',user);
      
      // Notify the presenter's presence
      if(user.presenter){
        REDIS.hget('presenters', discussionId, (err, presenter) => {
          presenter=Object.assign({},user);
          presenter.peerId=socket.id;
          REDIS.hset('presenters', discussionId, JSON.stringify(presenter) ,_=>{})
        })
      }
      
      // Initialize workspace and participants
      return new Promise((resolve, reject) => {
        REDIS.hget('workplace', discussionId, (err, workplace) => {
          if (err || workplace==null) {
            workplace={tabs: [],settings:{},participants: []}
            REDIS.hset('workplace', discussionId, JSON.stringify(workplace),function(){
              resolve()
            })
          }else{
            resolve()
          }
        })
      }).then(()=>{
        return Promise.all([
          new Promise((resolve, reject) => {
            REDIS.get('mapSocketToDiscussion', (err, mapSocketToDiscussion) => {
              if (err && CONFIG.DEBUG) console.warn(err)
              if (mapSocketToDiscussion == null) {
                mapSocketToDiscussion = {}
              } else {
                mapSocketToDiscussion = JSON.parse(mapSocketToDiscussion)
              }
              mapSocketToDiscussion[socket.id] = discussionId
              REDIS.set('mapSocketToDiscussion', JSON.stringify(mapSocketToDiscussion), (err, res) => {
                if (err && CONFIG.DEBUG) console.warn(err)
                resolve(mapSocketToDiscussion)
              })
            })
          }),
          new Promise((resolve, reject) => {
            REDIS.get('participants', (err, participants) => {
              if (err && CONFIG.DEBUG) console.warn(err)
              if (participants == null) {
                participants = {}
              } else {
                participants = JSON.parse(participants)
              }
              if (!participants[discussionId]) participants[discussionId] = {}
              participants[discussionId][socket.id] = user
              socket.emit('participants',participants[discussionId]);
              REDIS.set('participants', JSON.stringify(participants), (err, res) => {
                if (err && CONFIG.DEBUG) console.warn(err)
                resolve(participants[discussionId])
              })
            })
          })  
        ])
      }).then((mapSocketToDiscussion) => {
        let participants;
        [mapSocketToDiscussion,participants]=mapSocketToDiscussion;

        // Start listening for discussion room events
        DISCUSSION.init(REDIS, socket, mapSocketToDiscussion, user)
        // start listening for chat messages
        CHAT.init(REDIS, socket, IO, mapSocketToDiscussion, user)
        // start listening for drawing messages
        WHITEBOARD.init(REDIS, socket, IO, mapSocketToDiscussion, user)
        // start listening for general events
        UTILITY.init(REDIS, socket, IO, mapSocketToDiscussion, user, loggedInUser)
      })
    }).catch((err) => {
      console.log(err)
      if (CONFIG.DEBUG) { console.log('kicking invalid user out: ' + userToken + ' from : '+socket.id) }
      socket.emit('invaliduser',err.message,function(){
        socket.disconnect()  
      })
    })

    // remove peer from discussion and participants on disconnect
    socket.on('disconnect', () => {
      console.log(socket.id + ' is disconnected')
      socket.to(discussionId).emit('peer-disconnect',{socketId: socket.id});
      return new Promise((resolve, reject) => {
        REDIS.get('mapSocketToDiscussion', (err, mapSocketToDiscussion) => {
          if (err && CONFIG.DEBUG) console.warn(err)
          if (mapSocketToDiscussion == null) {
            mapSocketToDiscussion = {}
          } else {
            mapSocketToDiscussion = JSON.parse(mapSocketToDiscussion)
          }
          let discussionId = mapSocketToDiscussion[socket.id]
          socket.leave(discussionId)
          delete mapSocketToDiscussion[socket.id]
          REDIS.set('mapSocketToDiscussion', JSON.stringify(mapSocketToDiscussion))
          resolve(discussionId)
        })
      }).then((discussionId) => {
        return new Promise((resolve, reject) => {
          REDIS.get('participants', (err, participants) => {
            if (err && CONFIG.DEBUG) console.warn(err)
            if (participants == null) {
              participants = {}
            } else {
              participants = JSON.parse(participants)
            }
            if (!participants[discussionId]) participants[discussionId] = {}
            delete participants[discussionId][socket.id]
            REDIS.set('participants', JSON.stringify(participants))
          })
          REDIS.hget('workplace',discussionId, (err, workplace) => {
            if (err && CONFIG.DEBUG) console.warn(err)
            if(workplace){
              workplace = JSON.parse(workplace)
              let participantIndex = workplace['participants'].indexOf(socket.id)
              if (participantIndex !== -1) workplace['participants'].splice(participantIndex, 1)
              REDIS.hset('workplace', discussionId, JSON.stringify(workplace))  
            }
          })
          resolve()
        })
      })
    })
  }
  IO.adapter(REDIS_ADAPTOR({ pubClient: PUB, subClient: SUB }))
  IO.on('connection', onConnect)
}
