const express = require("express");
const _ = require("lodash");
const crypto = require("crypto");
const moment = require("moment");
const db = require("../db");
const config = require("../config/config");
const logger = require("../logger");
const { user } = require("../queries");
const { getToken } = require("../lib/jwt");
const jwt = require('jsonwebtoken')

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
router.post("/signup", (req, res, next) => {
  const { userId, password, userName, profile } = req.body;

  if (_.isEmpty(userId) || _.isEmpty(password) || _.isEmpty(userName)) {
    return res.status(400).json({
      message: "Bad request"
    });
  }

  db((err, connection) => {
    const cipher = crypto.createCipher("aes-256-cbc", config.passwordKey);
    let result = cipher.update(password, "utf8", "base64");
    result += cipher.final("base64");

    const data = {
      user_id: userId,
      name: userName,
      password: result,
      profile: profile || '',
      created_time: moment().format("YYYY-MM-DD HH:mm:ss"),
      lastlogin_time: ""
    };

    let query = connection.query(
      user.insertUser(data),
      (err, results, fields) => {
        connection.release();
        if (err) {
          return next(err);
        }

        return res.json({
          status: "Success",
        });
      }
    );

    logger.debug("Execute query.\n\n\t\t" + query.sql + "\n");
  });
});

/**
 * 사용자 로그인
 */
router.post("/signin", (req, res, next) => {
  const { userId, password } = req.body;

  if (_.isEmpty(userId) || _.isEmpty(password)) {
    return res.status(400).json({
      message: "Bad request"
    });
  }

  db((err, connection) => {
    let query = connection.query(
      user.selectUser(userId),
      (err, results, fields) => {
        connection.release();
        if (err) {
          return next(err);
        }

        try {
          if (_.isEmpty(results)) {
            return res.status(401).json({
              message: "Wrong userid"
            });
          }
          const resPass = results[0].password;
          const decipher = crypto.createDecipher(
            "aes-256-cbc",
            config.passwordKey
          );
          let decipherResPass = decipher.update(resPass, "base64", "utf8");
          decipherResPass += decipher.final("utf8");

          if (decipherResPass === password) {
            return res.json({
              status: "Success",
              token: getToken(results[0].user_id)
            });
          } else {
            return res.status(401).json({ message: "Wrong password" });
          }
        } catch (error) {
          return next(error)
        }
      }
    );
  });
});

/**
 * 토큰 체크
 */
router.post("/checkToken", (req, res, next) => {
  try {
    const token = req.header('Authorization');
    if(!token){
      return res.status(401).json({ message: "Empty token"});
    }
  
    const decodedToken = jwt.verify(token, config.jwt.secret);
  
    if(decodedToken){
      return res.json({message: 'Valid token'});
    } else {
      return res.status(401).json({message: "Invalid token"});
    }
  } catch (error) {
    return res.status(401).json({message: error.name});
  }
});

module.exports = router;
