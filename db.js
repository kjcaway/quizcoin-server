const mysql = require('mysql');
const config = require('./config/config');
const logger = require('./logger');

const pool = mysql.createPool(config.mysql);
logger.info('Connection pool created.');

pool.on('acquire', function(connection) {
  logger.info(`Connection ${connection.threadId} acquired`);
});

pool.on('enqueue', function() {
  logger.info('Waiting for available connection slot');
});

pool.on('release', function(connection) {
  logger.info(`Connection ${connection.threadId} released`);
});

const getConn = function(callback) {
  pool.getConnection(function(err, connection) {
    callback(err, connection);
  });
};

module.exports = getConn;
