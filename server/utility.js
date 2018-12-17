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
    });
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
          // CONN.query('SELECT M.title,M.url FROM media_files as M LIMIT ?,?',[startRec,endRec], function (error, results, fields) {
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
  }
  return {
    init: initUtitlities
  }
}
module.exports = Utility
