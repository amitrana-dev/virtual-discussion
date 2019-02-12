'use strict'
const MYSQL=require('mysql')
const CONFIG=require('./config')
const MOMENT=require('moment')
const CONN = MYSQL.createConnection({
  host     : CONFIG.MYSQL_HOST,
  port     : CONFIG.MYSQL_PORT,
  user     : CONFIG.MYSQL_USER,
  password : CONFIG.MYSQL_PWD,
  database : CONFIG.MYSQL_DB
});
var Discussion = function () {
  function getInfo (discussionId) {
    if( CONFIG.DEBUG ) { console.info( 'Checking discussion by id: ' + discussionId ) ; }
    return new Promise((resolve,reject)=>{
        /*
          Test Code for now
        */
        if(discussionId > 20 ) reject(new Error('Ooops!!! Wrong discussion maybe?'))
        resolve({id: discussionId,title: 'Learning-101 ' + Math.random().toString(36).substring(4),startTime: new Date(),duration: 60});
      // CONN.query('SELECT C.id,C.title FROM courses as C WHERE C.id=? LIMIT 1',[discussionId], function (error, results, fields) {
      //  if(error) reject(error)
      //  resolve(results[0]);
      // })
      
    }).then((discussion)=>{
      return {
        id: discussion.id,
        title: discussion.title,
        startTime: discussion.startTime,
        duration: discussion.duration 
      }
    })
  }
  function initDiscussion (redis, socket, mapSocketToDiscussion, user) {
    socket.on('editorchange', function (delta, tabId) {
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('editorchange ' + discussionId + ' ' + delta) }
      redis.hget('workplace', discussionId, (err, workplace) => {
        if (err && CONFIG.DEBUG) console.warn(err)
        if (workplace) {
          socket.to(discussionId).emit('editorchange', delta, tabId)
          workplace = JSON.parse(workplace)
          if (!workplace['settings'][tabId]) workplace['settings'][tabId] = { 'ops': [] }
          workplace['settings'][tabId]['ops'].push(['editorchange', delta, Date.now()])
          redis.hset('workplace', discussionId, JSON.stringify(workplace))
        }
      })
    })
    socket.on('editorchange_language', function (lang, tabId) {
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('editorchange_language ' + discussionId) }
      redis.hget('workplace', discussionId, (err, workplace) => {
        if (err && CONFIG.DEBUG) console.warn(err)
        if (workplace) {
          socket.to(discussionId).emit('editorchange_language', lang, tabId)
          workplace = JSON.parse(workplace)
          if (!workplace['tabs']) workplace['tabs'] = []
          for (let i = 0; i < workplace['tabs'].length; i++) {
            if (workplace['tabs'][i]['id'] === tabId) {
              workplace['tabs'][i]['language'] = lang
              break
            }
          }
          redis.hset('workplace', discussionId, JSON.stringify(workplace))
        }
      })
    })

    socket.on('editorchange_selection', function (selPos, tabId) {
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('editorchange_selection ' + discussionId + '  : ' + selPos) }
      socket.to(discussionId).emit('editorchange_selection', selPos, tabId)
    })

    socket.on('editorchange_cursor', function (curPos, tabId) {
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('editorchange_cursor ' + discussionId + '  : ' + curPos) }
      socket.to(discussionId).emit('editorchange_cursor', curPos, tabId)
    })

    socket.on('editorclear_buffer', function (tabId) {
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('editorclear_buffer ' + discussionId) }
      socket.to(discussionId).emit('editorclear_buffer', tabId)
    })
  }
  return {
    init: initDiscussion,
    getInfo: getInfo
  }
}
module.exports = Discussion
