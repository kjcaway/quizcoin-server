const express = require("express");
const _ = require('lodash');
const crypto = require('crypto');
const moment = require('moment');
const db = require("../db");
const config = require('../config/config')
const logger = require('../logger');
const { user } = require('../queries');

const router = express.Router();

/**
 * 사용자 조회
 */
router.get("/", (req, res, next) => {
  db((err, connection) => {
    connection.query(user.selectUser(), (err, rows) => {
      connection.release();
      if (err) {
        return next(err);
      }

      return res.json({ data: rows });
    });
  });
});

/**
 * 사용자 입력
 */
router.post("/", (req, res, next) => {
  const {userId, password, name, profile} = req.body;

  if(userId === undefined || password === undefined || name === undefined){
    return res.status(400).json({
      message : 'Bad request'
    });
  }

  db((err, connection) => {
    const cipher = crypto.createCipher('aes-256-cbc', config.passwordKey);
    let result = cipher.update(password, 'utf8', 'base64')
    result += cipher.final('base64');

    const data = {
      user_id : userId,
      name: name,
      password: result,
      profile: profile,
      created_time: moment().format('YYYY-MM-DD HH:mm:ss'),
      lastlogin_time: ''
    }

    let query = connection.query(user.insertUser(data), (err, results, fields) => {
      connection.release();
      if (err) {
        return next(err);
      }

      return res.json({ results });
    });

    logger.debug('Execute query.\n\n\t\t' + query.sql + '\n');
  });
});

/**
 * 사용자 로그인
 */
router.post("/signin", (req, res, next) => {
  const {userId, password} = req.body;

  if(_.isEmpty(userId) || _.isEmpty(password)){
    return res.status(400).json({
      message : 'Bad request'
    });
  } else{
    db((err, connection) => {
  
      let query = connection.query(user.selectUser(userId), (err, results, fields) => {
        connection.release();
        if (err) {
          return next(err);
        }
        const resPass = results[0].password
        const decipher = crypto.createDecipher('aes-256-cbc', config.passwordKey);
        let result = decipher.update(resPass, 'base64', 'utf8');
        result += decipher.final('utf8');
  
        if(result === password){
          return res.json({ status: 'Success' });
        }else {
          return res.status(401).json({ status: 'Fail' });
          
        }
      });
    })

  }

})

module.exports = router;