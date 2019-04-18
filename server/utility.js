'use strict'
const CONFIG=require('./config');
const MYSQL=require('mysql')
const CONN = MYSQL.createConnection({
  host     : CONFIG.MYSQL_HOST,
  port     : CONFIG.MYSQL_PORT,
  user     : CONFIG.MYSQL_USER,
  password : CONFIG.MYSQL_PWD,
  database : CONFIG.MYSQL_DB
});
const FS= require('fs');
const PDFImage = require("pdf-image").PDFImage;
const path = require("path");
var Utility = function () {
  function initUtilities (redis, socket, io, mapSocketToDiscussion, user, loggedInUser) {
    function loadWorkspace(workplace, withOutChat){
      if (!workplace['tabs']) workplace['tabs'] = []
      if (!workplace['chat']) workplace['chat'] = {}
      if (!workplace['whiteboard']) workplace['whiteboard'] = {}
      if (!workplace['settings']) workplace['settings'] = []
      // dump tabs
      for (let i = 0; i < workplace['tabs'].length; i++) {
        socket.emit('tabadd', JSON.stringify(workplace['tabs'][i]))
      }

      // making chat optional for template
      if(!withOutChat){
        // dump chat
        Object.keys(workplace['chat']).forEach(group=>{
          if(group.indexOf(user.identity) !== -1 || group=='common'){
            socket.emit('chatgroup', JSON.stringify(workplace['chat'][group]));
          }
        })
      }
      
      // give time to create tabs
      setTimeout(function () {
        socket.emit('tabchanged',workplace['currentTab']);
        // dump whiteboard drawings
        if(workplace['whiteboard']) Object.keys(workplace['whiteboard']).forEach(tabId=>{
          if(workplace['whiteboard'][tabId]){
            workplace['whiteboard'][tabId]['drawings'].forEach(drawing=>{
              socket.emit('drawing', drawing, tabId, 'whiteboard');
            });
            socket.emit('move', workplace['whiteboard'][tabId]['currentPos'], tabId);
            socket.emit('zoom', workplace['whiteboard'][tabId]['zoom'], tabId);
            socket.emit('grid', workplace['whiteboard'][tabId]['grid'], tabId);
          }
        })
        // dump content drawings
        if(workplace['content']) Object.keys(workplace['content']).forEach(tabId=>{
          if(workplace['content'][tabId]){
            Object.keys(workplace['content'][tabId]['pages']).forEach(pageId=>{
              if(workplace['content'][tabId]['pages'][pageId]){
                workplace['content'][tabId]['pages'][pageId]['drawings'].forEach(drawing=>{
                  socket.emit('drawing', drawing, tabId, 'content' , pageId);
                });
                socket.emit('changepage', tabId, workplace['content'][tabId]['currentPage']);
                socket.emit('move', workplace['content'][tabId]['pages'][pageId]['currentPos'], tabId);
                socket.emit('zoom', workplace['content'][tabId]['pages'][pageId]['zoom'], tabId);
                socket.emit('grid', workplace['content'][tabId]['pages'][pageId]['grid'], tabId);
              }
            });
          }
        })
        
        let tabIds = Object.keys(workplace['settings'])
        for (let i = 0; i < tabIds.length; i++) {
          let tab = workplace['settings'][tabIds[i]]
          for (let j = 0; j < tab['ops'].length; j++) {
            socket.emit(tab['ops'][j][0], tab['ops'][j][1], tabIds[i])
          }
        }
      }, 100)
    }
    socket.on('dumpbuffer', function (withOutChat) {
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('dumpbuffer ' + discussionId) }
      redis.hget('workplace', discussionId, (err, workplace) => {
        if (err || workplace == null) {
          if (CONFIG.DEBUG) console.warn('WARNING: No work done on this workspace')
        }
        if (workplace) {
          workplace= JSON.parse(workplace);
          loadWorkspace(workplace, withOutChat)
        }
      })
    })
    socket.on('endsession', function(){
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('endsession ' + discussionId) }
      redis.hget('workplace', discussionId, (err, workplace) => {
        if (err && CONFIG.DEBUG) console.warn(err)
        if (workplace) {
          socket.to(discussionId).emit('endsession')
          workplace = JSON.parse(workplace)
          workplace['closed']=true;
          redis.hset('workplace', discussionId, JSON.stringify(workplace))
        }
      });
    });
    socket.on('clearworkspace', function(){
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('clearworkspace ' + discussionId) }
      redis.hget('workplace', discussionId, (err, workplace) => {
        if (err && CONFIG.DEBUG) console.warn(err)
        if (workplace) {
          socket.to(discussionId).emit('clearworkspace')
          workplace = JSON.parse(workplace)
          workplace['tabs'] = []
          redis.hset('workplace', discussionId, JSON.stringify(workplace))
        }
      });
    });
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
    socket.on('tabrename', function (tabId,name) {
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('tabrename ' + discussionId + ' ' + tabId + ' ' + name) }
      redis.hget('workplace', discussionId, (err, workplace) => {
        if (err && CONFIG.DEBUG) console.warn(err)
        if (workplace) {
          socket.to(discussionId).emit('tabrename', tabId, name)
          workplace = JSON.parse(workplace)
          if (!workplace['tabs']) workplace['tabs'] = []
          for (let i = 0; i < workplace['tabs'].length; i++) {
            if (workplace['tabs'][i]['id'] === tabId) {
              workplace['tabs'][i]['name']=name;
              break
            }
          }
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
          if(workplace['whiteboard']) delete workplace['whiteboard'][tabId]
          if(workplace['content']) delete workplace['content'][tabId]
          delete workplace['settings'][tabId]
          redis.hset('workplace', discussionId, JSON.stringify(workplace))
        }
      })
    })
    socket.on('tabchanged', function (tabId) {
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('tabchanged ' + tabId) }
      redis.hget('workplace', discussionId, (err, workplace) => {
        if (err && CONFIG.DEBUG) console.warn(err)
        
        if (workplace) {
          workplace = JSON.parse(workplace)
          workplace['currentTab']=tabId;
          redis.hset('workplace', discussionId, JSON.stringify(workplace))
        }
      })
      socket.to(discussionId).emit('tabchanged', tabId)
    })
    
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
    });
    socket.on('exporttemplate', function (cb) {
      let discussionId = mapSocketToDiscussion[socket.id]
      if (CONFIG.DEBUG) { console.log('exportingtemplate ' + discussionId) }
      redis.hget('workplace', discussionId, (err, workplace) => {
        if (err || workplace == null) {
          cb(true);
          if (CONFIG.DEBUG) console.warn('WARNING: No work done on this workspace')
        }else{
          workplace = JSON.parse(workplace)
          if(workplace['chat']) delete workplace['chat'];
          cb(null,JSON.stringify(workplace));
        }
      });
    });
    socket.on('importtemplate', function (fileContent, cb) {
      let discussionId = mapSocketToDiscussion[socket.id]
      try{
        fileContent = JSON.parse(fileContent);
      }catch(ex){
        cb(true);
        return;
      }
      //loadWorkspace(fileContent);
      redis.hget('workplace', discussionId, (err, workplace) => {
        if (err && CONFIG.DEBUG) console.warn(err)
        if (workplace) {
          workplace = JSON.parse(workplace)
          if(workplace['chat']) fileContent['chat']=workplace['chat'];
          redis.hset('workplace', discussionId, JSON.stringify(fileContent));
          io.sockets.in(discussionId).emit('dumpbuffer');
        }
        cb(null);
      })
    });
    // save the recording of classroom 
    socket.on('recordingData', function (data,fileName) {
        let pathExist=FS.existsSync(CONFIG.FILE_STORAGE+ loggedInUser.id);
        FS.mkdir(CONFIG.FILE_STORAGE+loggedInUser.id,{recursive: true},function(err){
          if(err && !pathExist){ 
            console.log(err);
          }
          let file=fileName+'.webm';
          FS.appendFile(CONFIG.FILE_STORAGE+ loggedInUser.id +'/' + file, data, function (err) {
              if(err){ 
                console.log(err);
              }
              let images=JSON.stringify([file]);
              let url=file;
              CONN.query('SELECT  count(1) as file_exist from media_files where name=? ',[file], function (error, results, fields) {
                if(error){
                  console.log(error); 
                }
                if(results[0].file_exist == 0){
                  CONN.query('INSERT INTO media_files SET name=?,type=?,user_id=?,is_private=0, url =?, images=? ',[file, 'video', loggedInUser.id, url, images], function (error, results, fields) {
                    if(error){
                      console.log(error); 
                    }
                  })    
                }
              })
          }); 
        })
    });
    socket.on('add-file', function (folder_id, isPrivate, fileMeta, fileContent) {
      try{
        let pathExist=FS.existsSync(CONFIG.FILE_STORAGE+loggedInUser.id);
        FS.mkdir(CONFIG.FILE_STORAGE+loggedInUser.id,{recursive: true},function(err){
          if(err && !pathExist){ 
            console.log(err);
            return socket.emit('fileaddfailed');
          }
          let fileName=new Date().getTime() + fileMeta.name;
          FS.writeFile(CONFIG.FILE_STORAGE+loggedInUser.id + '/'+fileName, fileContent, function(err) {
              if(err){ 
                console.log(err);
                return socket.emit('fileaddfailed');
              }
              let url=fileName;
              new Promise(function(resolve,reject){
                console.log(fileMeta.type.indexOf('/pdf'))  ;
                if(fileMeta.type.indexOf('/pdf') == -1){
                  return resolve([url]);
                }
                var pdfImage = new PDFImage(CONFIG.FILE_STORAGE+loggedInUser.id + '/'+fileName);
                pdfImage.convertFile().then(images=>{
                  images=images.map(image=>{ 
                    return path.basename(image) 
                  }); 
                  resolve(images)
                }).catch(err=>{reject(err)});
              }).then(function(images){
                console.log(images);
                CONN.query('INSERT INTO media_files SET media_category_id=?, name=?,type=?,user_id=?,is_private=?, url =?, images=? ',[folder_id, fileMeta.name, (fileMeta.type.indexOf('/pdf') != -1 ? 'pdf' : 'image'), loggedInUser.id, isPrivate, url, JSON.stringify(images)], function (error, results, fields) {
                  if(error){
                    console.log(error); 
                    return socket.emit('fileaddfailed');
                  }
                  socket.emit('fileadded');
                })
              }).catch(function(err){
                console.log(err);
                return socket.emit('fileaddfailed');
              });
          }); 
            
        })
        
      }catch(ex){
        console.log(ex);
        return;
      }
    });
    socket.on('addfolder', function(folderName, isPrivate, folderId){
      CONN.query('INSERT INTO media_categories SET name=?,parent_id=?,user_id=?,is_private=?',[folderName, folderId, loggedInUser.id, isPrivate], function (error, results, fields) {
        socket.emit('folderadded');
      })
    })
    socket.on('loadmedia',function(pageNum){
      let startRec=(pageNum-1)*20;
      let endRec=pageNum*20;
      if (CONFIG.DEBUG) { console.log('loadmedia by ' + socket.id) }
      Promise.all([
        new Promise((resolve,reject)=>{
          /*
            Test Code for now
          */
          resolve([
            {type: 'audio',title: Math.random().toString(36).substring(4),url: 'https://sampleswap.org/samples-ghost/INSTRUMENTS%20single%20samples/guitars/102[kb]bendy-thick-guitarchord.aif.mp3'},
            {type: 'audio',title: Math.random().toString(36).substring(4),url: 'https://sampleswap.org/samples-ghost/INSTRUMENTS%20single%20samples/guitars/258[kb]flangenoisestrumthing.wav.mp3'},
            {type: 'audio',title: Math.random().toString(36).substring(4),url: 'https://sampleswap.org/samples-ghost/INSTRUMENTS%20single%20samples/guitars/98[kb]gitar.aif.mp3'},
            {type: 'audio',title: Math.random().toString(36).substring(4),url: 'https://sampleswap.org/samples-ghost/INSTRUMENTS%20single%20samples/guitars/175[kb]gtrbend.aif.mp3'},
            {type: 'audio',title: Math.random().toString(36).substring(4),url: 'https://sampleswap.org/samples-ghost/INSTRUMENTS%20single%20samples/guitars/247[kb]guitar-onenote-fuzzy.wav.mp3'},
            {type: 'audio',title: Math.random().toString(36).substring(4),url: 'https://sampleswap.org/samples-ghost/INSTRUMENTS%20single%20samples/guitars/102[kb]bendy-thick-guitarchord.aif.mp3'},
            {type: 'audio',title: Math.random().toString(36).substring(4),url: 'https://sampleswap.org/samples-ghost/INSTRUMENTS%20single%20samples/guitars/258[kb]flangenoisestrumthing.wav.mp3'},
            {type: 'audio',title: Math.random().toString(36).substring(4),url: 'https://sampleswap.org/samples-ghost/INSTRUMENTS%20single%20samples/guitars/98[kb]gitar.aif.mp3'},
            {type: 'audio',title: Math.random().toString(36).substring(4),url: 'https://sampleswap.org/samples-ghost/INSTRUMENTS%20single%20samples/guitars/175[kb]gtrbend.aif.mp3'},
            {type: 'audio',title: Math.random().toString(36).substring(4),url: 'https://sampleswap.org/samples-ghost/INSTRUMENTS%20single%20samples/guitars/247[kb]guitar-onenote-fuzzy.wav.mp3'},

            {type: 'video',title: Math.random().toString(36).substring(4),url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4'},
            {type: 'video',title: Math.random().toString(36).substring(4),url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_2mb.mp4'},
            {type: 'video',title: Math.random().toString(36).substring(4),url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_5mb.mp4'},
            {type: 'video',title: Math.random().toString(36).substring(4),url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_10mb.mp4'},
            {type: 'video',title: Math.random().toString(36).substring(4),url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_20mb.mp4'},
            {type: 'video',title: Math.random().toString(36).substring(4),url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4'},
            {type: 'video',title: Math.random().toString(36).substring(4),url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_2mb.mp4'},
            {type: 'video',title: Math.random().toString(36).substring(4),url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_5mb.mp4'},
            {type: 'video',title: Math.random().toString(36).substring(4),url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_10mb.mp4'},
            {type: 'video',title: Math.random().toString(36).substring(4),url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_20mb.mp4'}
          ]);
          // CONN.query('SELECT M.type,M.title,M.url FROM media_files as M where type in ('audio','video') LIMIT ?,?',[startRec,endRec], function (error, results, fields) {
          //  if(error) reject(error)
          //  resolve(results[0]);
          // })
        }),
        new Promise((resolve,reject)=>{
          /*
            Test Code for now
          */
          resolve(10);
          // CONN.query('SELECT count(*) as total_files FROM media_files where type in ('audio','video') LIMIT 1', function (error, results, fields) {
          //  if(error) reject(error)
          //  let total_files=results[0].total_files;
          //  resolve(Math.ceil(total_files/20));
          // })
        })
      ]).then((results)=>{
        // identity should be same for any subsequent request.
        socket.emit('loadmedia', JSON.stringify({
          page: pageNum,
          total_pages: results[1],
          mediaList: results[0]
        }));
      });
    });
    socket.on('loadcontent',function(pageNum, isPrivate, folderId){
      let startRec=(pageNum-1)*20;
      let endRec=pageNum*20;
      if (CONFIG.DEBUG) { console.log('loadcontent by ' + socket.id) }
      Promise.all([
        new Promise((resolve,reject)=>{
          let query='';
          let replacements=[];
          if(isPrivate){
            query='SELECT C.id, C.name, C.parent_id FROM media_categories as C where C.is_private=1 and C.parent_id=? and C.user_id=?';
            replacements=[folderId, loggedInUser.id]
          }else{
            query='SELECT C.id, C.name, C.parent_id FROM media_categories as C where C.is_private=0 and C.parent_id=?';
            replacements=[folderId]
          }
          CONN.query(query, replacements, function (error, results, fields) {
           if(error) reject(error)
           resolve(results);
          })
        }),
        new Promise((resolve,reject)=>{
          let query='';
          let replacements=[];
          if(isPrivate){
            query='SELECT M.id, M.name,M.user_id, M.type, M.url, M.images FROM media_files as M where M.type IN ("image","pdf") and M.is_private=? and M.media_category_id=? and M.user_id=?';
            replacements=[isPrivate, folderId, loggedInUser.id]
          }else{
            query='SELECT M.id, M.name,M.user_id, M.type, M.url, M.images FROM media_files as M where M.type IN ("image","pdf") and M.is_private=? and M.media_category_id=?';
            replacements=[isPrivate, folderId]
          }
          CONN.query(query, replacements, function (error, results, fields) {
           if(error) reject(error)
           results=results.map(function(file){
            file.url=CONFIG.FILE_URL+file.user_id+'/'+file.url;
            file.images=JSON.parse(file.images);
            file.images=file.images.map(function(image){
              return CONFIG.FILE_URL+file.user_id+'/'+image;
            });
            delete file.user_id;
            return file;
           })
           resolve(results);
          })
        }),
        new Promise((resolve,reject)=>{
          let query='';
          let replacements=[];
          if(isPrivate){
            query='SELECT count(*) as total_files FROM media_files as M where M.type IN ("image","pdf") and M.is_private=? and M.media_category_id=? and M.user_id=?';
            replacements=[isPrivate, folderId, loggedInUser.id]
          }else{
            query='SELECT count(*) as total_files FROM media_files as M where M.type IN ("image","pdf") and M.is_private=? and M.media_category_id=?';
            replacements=[isPrivate, folderId]
          }
          CONN.query(query, replacements, function (error, results, fields) {
            if(error) reject(error)
            let total_files=results[0].total_files;
            resolve(Math.ceil(total_files/20));
          })
        }),
        new Promise((resolve,reject)=>{
          if(folderId == 0) {
            resolve({});
          }else{
            CONN.query('SELECT C.id, C.name, C.parent_id FROM media_categories as C where C.id=?', [folderId], function (error, results, fields) {
             if(error) reject(error)
             resolve(results[0]);
            })  
          }
        })
      ]).then((results)=>{
        // identity should be same for any subsequent request.
        socket.emit('loadcontent', JSON.stringify({
          page: pageNum,
          total_pages: results[2],
          contentList: results[1],
          folderList: results[0],
          currentFolder: results[3]
        }));
      });
    });
  }
  return {
    init: initUtilities
  }
}
module.exports = Utility
