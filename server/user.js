"use strict"
const MYSQL=require('mysql')
const CONFIG=require('./config')
const MD5 = require('md5');
const CONN = MYSQL.createConnection({
  host     : CONFIG.MYSQL_HOST,
  port     : CONFIG.MYSQL_PORT,
  user     : CONFIG.MYSQL_USER,
  password : CONFIG.MYSQL_PWD,
  database : CONFIG.MYSQL_DB
});
module.exports={
	getUserInfoForDiscussion: (token,discussionId)=>{
		if( CONFIG.DEBUG ) { console.info( 'Checking user by token: ' + token + ' for discussion: '+ discussionId ) ; }
	  return new Promise((resolve,reject)=>{
      /*
        Test Code for now
      */
      if(token > 15 ) reject(new Error('Ooops!!! Stumbled on wrong path?'))
    	resolve({id: token,user_type: token > 10 ? 0 : 1,firstname: Math.random().toString(36).substring(4),lastname: Math.random().toString(36).substring(4),profile_image: 'http://placehold.it/50/55C1E7/fff&text='+Math.random().toString(36).substring(4)[0].toUpperCase()});
			// CONN.query('SELECT U.id,U.token,UD.firstname,UD.lastname,UD.profileimage,UD.user_type FROM user_details as UD INNER JOIN users as U ON U.id=UD.user_id WHERE U.token=? LIMIT 1',[token], function (error, results, fields) {
			// 	if(error) reject(error)
			// 	resolve(results[0]);
			// })
   	}).then((user)=>{
		  // identity should be same for any subsequent request.
      return {
        id: user.id,
        identity: MD5(user.id),
        presenter: user.user_type == 1,
        firstName: user.firstname,
        lastName: user.lastname,
        profileImage: user.profile_image
      }
      
    })
	}
}