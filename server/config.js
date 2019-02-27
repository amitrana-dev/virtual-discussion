"use strict"
module.exports={
  HOST        :   process.env.VD_HOST || 'localhost',
  PORT        :   process.env.VD_PORT || 3000,
  DEBUG       :   process.env.VD_DEBUG || true,
  REDIS_HOST  :   process.env.VD_REDIS_HOST || '127.0.0.1',
  REDIS_PORT  :   process.env.VD_REDIS_PORT || 6379,
  REDIS_PWD   :   process.env.VD_REDIS_PWD || '',
  MYSQL_HOST  :   process.env.VD_MYSQL_HOST || 'localhost',
  MYSQL_PORT  :   process.env.VD_MYSQL_PORT || 3306,
  MYSQL_USER  :   process.env.VD_MYSQL_USER || 'root',
  MYSQL_PWD   :   process.env.VD_MYSQL_PWD || 'sosweet',
  MYSQL_DB    :   process.env.VD_MYSQL_DB || 'test',
  FILE_STORAGE:   process.env.VD_FILE_STORAGE || '/var/www/html/virtual_discussion/client/uploads/',
  FILE_URL    :   process.env.VD_FILE_URL || 'http://localhost/virtual_discussion/client/uploads/',
}