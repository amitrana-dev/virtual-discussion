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
  MYSQL_USER  :   process.env.VD_MYSQL_USER || 'virt_dis',
  MYSQL_PWD   :   process.env.VD_MYSQL_PWD || '',
  MYSQL_DB    :   process.env.VD_MYSQL_DB || 'virt_dis'
}