const mysql = require('mysql2/promise'); // async await 사용을 위한 mysql -> mysql2/promise 로 변경 
const config = require('./config/config');
const logger = require('./logger');

const pool = mysql.createPool(config.mysql);
logger.info('Connection pool created.');

pool.on('acquire', function(connection) {
  logger.debug(`Connection ${connection.threadId} acquired`);
});

pool.on('enqueue', function() {
  logger.debug('Waiting for available connection slot');
});

pool.on('release', function(connection) {
  logger.debug(`Connection ${connection.threadId} released`);
});

const getConn = async function() {
  return await pool.getConnection(async conn => conn)
};

module.exports = getConn;
