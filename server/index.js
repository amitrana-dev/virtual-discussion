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
  // Only for getting upload/download speed etc on client side
  let url=require('url').parse(req.url,true);
  if(url.pathname == '/check'){
     res.setHeader('Access-Control-Allow-Origin','*');
     res.setHeader('Access-Control-Allow-Headers','*');
     res.setHeader('Connection','close');
      if (req.method=='GET'){
        // The response should never be cached or even stored on a hard drive
        res.setHeader('Cache-Control','no-cache, no-store, no-transform');
        res.setHeader('Pragma','no-cache'); // Support for HTTP 1.0
        // Define a content size for the response, defaults to 2MB.
        var contentSize = 2 * 1024 * 1024;
        
        // Provide a base string which will be provided as a response to the client
        var baseString='This text is so uncool, deal with it. ';
        var baseLength=baseString.length;
        // Output the string as much as necessary to reach the required size
        for (var i = 0 ; i < Math.floor(contentSize / baseLength) ; i++) {
              res.write(baseString);
        }
        // If necessary, complete the response to fully reach the required size.
        let lastBytes=contentSize % baseLength;
        if (lastBytes > 0) {
            res.end(baseString.substr(0,lastBytes));
        }
        res.end('The End.');
      }else if(req.method=='POST'){
        req.on('data', function(data) {});
        req.on('end', function() {
          res.end('post received');
        })
      }else{
        res.end('The End.');  
      }
  }else{
    res.end('Hope you find what you are looking for');  
  }
})

if (!STICKY.listen(SERVER, CONFIG.PORT,{workers: 2})) {
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
    let originalDiscussionId=socket.handshake.query['discussion_id']
 
    let discussionId = socket.handshake.query['discussion_id']
    let userToken = socket.handshake.query['token']
    let discussionInfo=null
    let user=null
    let loggedInUser=null
    let myBreakout;
    let myBreakoutIndex;
    let allBreakouts=[];
    if (CONFIG.DEBUG) { console.log(userToken + ' connected on socket ' + socket.id) }
    Promise.all([DISCUSSION.getInfo(discussionId,REDIS),USER.getUserInfoForDiscussion(userToken,discussionId)])
    .then((result) => {
      [discussionInfo,user]=result
      user.peerId=socket.id;
      user.permissions={audio: false, video: false, edit: false};
      loggedInUser=Object.assign({},user);
      delete user.id;
      return new Promise(function(resolve, reject){
        REDIS.hget('breakouts', discussionId, (err,breakouts)=>{
          if(!breakouts){
            resolve();
            return;
          }
          breakouts=JSON.parse(breakouts);
          allBreakouts=Object.assign([],breakouts);
          let isAnyChange=false;
          let existDiscussionId=discussionId;
          breakouts = breakouts.filter(function(breakout, index){
            let timeLimit=new Date(breakout.startTime + breakout.timeOut * 60000 );
            // this breakout is no longer available
            if(timeLimit <= new Date()){
              isAnyChange= true;
              return false;
            }
            console.log(breakout.participants,user.identity);
            if(breakout.participants.indexOf(user.identity) != -1){
              myBreakout=breakout;
              myBreakoutIndex=index;
              discussionId = discussionId+'-'+index.toString();
            }
            return true;
          });
          if(isAnyChange) REDIS.hset('breakouts', existDiscussionId, JSON.stringify(breakouts) ,_=>{});  
          if(user.presenter){
            socket.emit('breakouts',breakouts);
          }
          resolve();
        })
      });
    }).then((result)=>{
      // Join user to discusison
      socket.join(discussionId)
  
      // Peer Signaling for video/audio transmission 
      socket.on('message', function (data,peerId) {
          socket.broadcast.to(peerId).emit('message', data,socket.id);
      });
      socket.on('changeleader', function (index, identity){
        REDIS.hget('breakouts', originalDiscussionId, (err,breakouts)=>{
          if(!breakouts){
            return;
          }
          breakouts=JSON.parse(breakouts);
          breakouts[index].groupLeader=identity;
          REDIS.hset('breakouts', originalDiscussionId, JSON.stringify(breakouts) ,_=>{});
          socket.to(originalDiscussionId + '-'+index.toString()).emit('changeleader',identity);
        });
      });
      socket.on('addparticipant', function (index, identity, socketId){
        REDIS.hget('breakouts', originalDiscussionId, (err,breakouts)=>{
          if(!breakouts){
            return;
          }
          breakouts=JSON.parse(breakouts);
          if(breakouts[index].participants.length == 0) breakouts[index].groupLeader=identity;
          breakouts[index].participants.push(identity);
          REDIS.hset('breakouts', originalDiscussionId, JSON.stringify(breakouts) ,_=>{});
          socket.broadcast.to(socketId).emit('reconnect');  
        });
      });
      socket.on('delparticipant', function (index, identity, socketId){
        REDIS.hget('breakouts', originalDiscussionId, (err,breakouts)=>{
          if(!breakouts){
            return;
          }
          breakouts=JSON.parse(breakouts);
          if(breakouts[index].groupLeader == identity) breakouts[index].groupLeader= breakouts[index].participants.length ? breakouts[index].participants[0] : null;
          breakouts[index].participants.splice(breakouts[index].participants.indexOf(identity),1);
          REDIS.hset('breakouts', originalDiscussionId, JSON.stringify(breakouts) ,_=>{})  
          socket.broadcast.to(socketId).emit('reconnect');  
        });
      });
      socket.on('createbreakout', function (breakouts) {
        REDIS.hset('breakouts', discussionId, JSON.stringify(breakouts) ,_=>{})  
        //REDIS.hset('isBreakoutActive', discussionId, true ,_=>{});
        // socket.to(originalDiscussionId).emit('reconnect');
        // allBreakouts.forEach(function(_,index){
        //   socket.to(discussionId + '-'+index.toString()).emit('reconnect');
        // });
        //socket.emit('reconnect');
      });

      socket.on('enterroom', function (index) {
        if(!user.presenter) return;
        REDIS.hget('breakouts', originalDiscussionId, (err,breakouts)=>{
          breakouts=JSON.parse(breakouts);
          // Get back to common room
          breakouts = breakouts.map(function(breakout,currentIndex){
            let indexOfUser=breakout.participants.indexOf(user.identity);
            if(indexOfUser !== -1){
              breakout.participants.splice(indexOfUser);
            }
            if(index != -1 && currentIndex == index){
              // enter a specific room
              breakout.participants.push(user.identity);
            }
            return breakout;
          });
          REDIS.hset('breakouts', originalDiscussionId, JSON.stringify(breakouts) ,_=>{})    
          socket.emit('reconnect');
        });
      });
      socket.on('exitbreakout',function (index) {
        if(!user.presenter) return;
        REDIS.hget('breakouts', originalDiscussionId, (err,breakouts)=>{
          breakouts=JSON.parse(breakouts);
          breakouts[index].participants= breakouts[index].participants.filter(function(identity){
            return user.identity !== identity;
          })
          REDIS.hset('breakouts', originalDiscussionId, JSON.stringify(breakouts) ,_=>{})    
        });
      });
      socket.on('endbreakout', function (index) {
        if(!user.presenter) return;
        REDIS.hdel('workplace', originalDiscussionId + '-'+index.toString()); 
        REDIS.hdel('presenters', originalDiscussionId + '-'+index.toString()); 
        REDIS.hget('breakouts', originalDiscussionId, (err,breakouts)=>{
          breakouts=JSON.parse(breakouts);
          breakouts.splice(index, 1);
          REDIS.hset('breakouts', originalDiscussionId, JSON.stringify(breakouts) ,_=>{})    
          socket.to(originalDiscussionId + '-'+index.toString()).emit('reconnect');
        });
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
      console.log('connected to ',discussionId, originalDiscussionId);
      socket.to(discussionId).emit('peer-connect',{socketId: socket.id,user: user});
      socket.to(originalDiscussionId).emit('peer-connect-global',{socketId: socket.id,user: user});
      IO.in(discussionId).clients(function(err,clients){
        if(clients) clients=clients.filter(socketId=> socketId !== socket.id)
        socket.emit('connected',clients);
      });

      // send discussion details
      socket.emit('discussiondetail',discussionInfo);
      
      if(myBreakout){
        // send breakout info
        socket.emit('breakoutinfo',{breakout: myBreakout,breakoutIndex: myBreakoutIndex});
      }
      
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
            workplace={tabs: [],settings:{},participants: [], closed: false}
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


              let overAllParticipants=Object.assign({},participants[discussionId]);
              // Send all participants irrerespective of breakout rooms for presenter
              if(user.presenter){
                overAllParticipants=Object.assign({},participants[originalDiscussionId]);
                allBreakouts.forEach(function(breakout,index){
                  let currentDiscussionId=originalDiscussionId+'-'+index.toString();
                  let socketByIdentity={}
                  if(participants[currentDiscussionId]){
                    Object.values(participants[currentDiscussionId]).forEach(function(participant){
                      socketByIdentity[participant.identity]=participant.peerId;
                    })
                  }
                  breakout.participants.forEach(function(identity){
                    if( participants[currentDiscussionId] && socketByIdentity[identity] ){
                      overAllParticipants[socketByIdentity[identity]]=participants[currentDiscussionId][socketByIdentity[identity]];
                    }
                  })
                });
              }
              socket.emit('allparticipants',overAllParticipants);
              
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
      console.log(socket.id + ' is disconnected',discussionId,originalDiscussionId)
      socket.to(discussionId).emit('peer-disconnect',{socketId: socket.id});
      socket.to(originalDiscussionId).emit('peer-disconnect',{socketId: socket.id});
      socket.to(originalDiscussionId).emit('peer-disconnect-global',{socketId: socket.id});
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
            if(discussionId != originalDiscussionId && participants[originalDiscussionId]){
              delete participants[originalDiscussionId][socket.id]
            }
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
