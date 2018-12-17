'use strict'
const MYSQL=require('mysql')
const CONFIG=require('./config')
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
        resolve({id: discussionId,title: 'Jesus-101 ' + Math.random().toString(36).substring(4)});
      // CONN.query('SELECT C.id,C.title FROM courses as C WHERE C.id=? LIMIT 1',[discussionId], function (error, results, fields) {
      //  if(error) reject(error)
      //  resolve(results[0]);
      // })
      
    }).then((discussion)=>{
      return {
        id: discussion.id,
        title: discussion.title
      }
    })
  }
  function initDiscussion (redis, socket, mapSocketToDiscussion, user) {
    socket.on('tabadd', function (tabItem) {
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('tabadd ' + discussionId + ' ' + tabItem) }
      redis.hget('workplace', discussionId, (err, workplace) => {
        if (err && CONFIG.DEBUG) console.warn(err)
        if (workplace) {
          socket.to(discussionId).emit('tabadd', tabItem)
          tabItem = JSON.parse(tabItem)
          workplace = JSON.parse(workplace)
          if (!workplace['tabs']) workplace['tabs'] = []
          workplace['tabs'].push(tabItem)
          workplace['settings'][tabItem.id] = { 'ops': [] }
          redis.hset('workplace', discussionId, JSON.stringify(workplace))
        }
      })
    })
    socket.on('tabremove', function (tabId) {
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('tabremove ' + discussionId + ' ' + tabId) }
      redis.hget('workplace', discussionId, (err, workplace) => {
        if (err && CONFIG.DEBUG) console.warn(err)
        
        if (workplace) {
          socket.to(discussionId).emit('tabremove', tabId)
          workplace = JSON.parse(workplace)
          if (!workplace['tabs']) workplace['tabs'] = []
          let tabIndex = -1
          for (let i = 0; i < workplace['tabs'].length; i++) {
            if (workplace['tabs'][i]['id'] === tabId) {
              tabIndex = i
              break
            }
          }
          if (tabIndex !== -1) workplace['tabs'].splice(tabIndex, 1)
          delete workplace['settings'][tabId]
          redis.hset('workplace', discussionId, JSON.stringify(workplace))
        }
      })
    })
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

    socket.on('tabchanged', function (tabId) {
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('tabchanged ' + tabId) }
      socket.to(discussionId).emit('tabchanged', tabId)
    })

    socket.on('editorclear_buffer', function (tabId) {
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('editorclear_buffer ' + discussionId) }
      socket.to(discussionId).emit('editorclear_buffer', tabId)
    })
    socket.on('dumpbuffer', function () {
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('dumpbuffer ' + discussionId) }
      redis.hget('workplace', discussionId, (err, workplace) => {
        if (err || workplace == null) {
          if (CONFIG.DEBUG) console.warn('WARNING: No work done on this workspace')
        }
        if (workplace) {
          workplace = JSON.parse(workplace)
          if (!workplace['tabs']) workplace['tabs'] = []
          if (!workplace['chat']) workplace['chat'] = {}
          if (!workplace['settings']) workplace['settings'] = []
          // dump tabs
          for (let i = 0; i < workplace['tabs'].length; i++) {
            socket.emit('tabadd', JSON.stringify(workplace['tabs'][i]))
          }
          // dump chat
          Object.keys(workplace['chat']).forEach(group=>{
            if(group.indexOf(user.identity) !== -1 || group=='common'){
              socket.emit('chatgroup', JSON.stringify(workplace['chat'][group]));
            }
          })
          
          // give time to create tabs
          setTimeout(function () {
            let tabIds = Object.keys(workplace['settings'])
            for (let i = 0; i < tabIds.length; i++) {
              let tab = workplace['settings'][tabIds[i]]
              for (let j = 0; j < tab['ops'].length; j++) {
                socket.emit(tab['ops'][j][0], tab['ops'][j][1], tabIds[i])
              }
            }
          }, 100)
        }
      })
    })
  }
  return {
    init: initDiscussion,
    getInfo: getInfo
  }
}
module.exports = Discussion
