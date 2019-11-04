const express = require("express");
const db = require("../db");
const _ = require('lodash');
const crypto = require('crypto');
const moment = require('moment');
const config = require('../config/config')
const logger = require('../logger');
const { user } = require('../queries')

const router = express.Router();

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

router.post("/", (req, res, next) => {
  db((err, connection) => {
    const {userId, password, name, profile} = req.body;
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

    let query =connection.query(user.insertUser(data), (err, results, fields) => {
      connection.release();
      if (err) {
        return next(err);
      }

      return res.json({ results: results });
    });

    logger.debug('Execute query.\n\n\t\t' + query.sql + '\n');
  });
});


router.post("/signin", (req, res, next) => {
  db((err, connection) => {
    const {userId, password} = req.body;

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
        return res.json({ status: 'Fail' });
        
      }
    });
  })
})

module.exports = router;