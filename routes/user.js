const express = require('express');
const _ = require('lodash');
const crypto = require('crypto');
const moment = require('moment');
const getConn = require('../db');
const config = require('../config/config');
const { user, tags } = require('../queries');
const { getToken } = require('../lib/jwt');
const upload = require('../lib/fileupload');
const multer = require('multer');
const logger = require('../logger');

const router = express.Router();

/**
 * 사용자 조회
 */
router.post('/', async (req, res, next) => {
  const { userId } = req.body;

  if (_.isEmpty(userId)) {
    return res.status(400).json({
      message: 'Bad request'
    });
  }

  const connection = await getConn();
  try {
    const [rows] = await connection.query(user.selectUser(userId));
    connection.release();
    return res.json(rows);
  } catch (err) {
    connection.release();
    return next(err);
  }
});

/**
 * 사용자 입력
 */
router.post('/signup', async (req, res, next) => {
  const { userId, password, userName, profile } = req.body;

  if (_.isEmpty(userId) || _.isEmpty(password) || _.isEmpty(userName)) {
    return res.status(400).json({
      message: 'Bad request'
    });
  }

  const connection = await getConn();
  try {
    const cipher = crypto.createCipher('aes-256-cbc', config.passwordKey);
    let result = cipher.update(password, 'utf8', 'base64');
    result += cipher.final('base64');

    const data = {
      user_id: userId,
      name: userName,
      password: result,
      profile: profile || '',
      created_time: moment().format('YYYY-MM-DD HH:mm:ss'),
      lastlogin_time: ''
    };

    const [rows] = await connection.query(user.selectUser(userId));
    if(_.get(rows[0], 'user_id', '') === userId){
      return res.status(409).json({
        message: 'Conflict'
      });
    }

    await connection.beginTransaction(); // START TRANSACTION
    await connection.query(user.insertUser(data));
    await connection.commit(); // COMMIT
    connection.release();

    return res.json({
      success: true
    });
  } catch (err) {
    await connection.rollback(); // ROLLBACK
    connection.release();
    return next(err);
  }
});

/**
 * 사용자 로그인
 */
router.post('/signin', async (req, res, next) => {
  const { userId, password } = req.body;

  if (_.isEmpty(userId) || _.isEmpty(password)) {
    return res.status(400).json({
      message: 'Bad request'
    });
  }

  const connection = await getConn();
  try {
    const [rows] = await connection.query(user.selectUser(userId));
    connection.release();
    if (_.isEmpty(rows)) {
      return res.status(404).json({
        message: 'Wrong userid'
      });
    }
    const resPass = rows[0].password;
    const decipher = crypto.createDecipher('aes-256-cbc', config.passwordKey);
    let decipherResPass = decipher.update(resPass, 'base64', 'utf8');
    decipherResPass += decipher.final('utf8');

    if (decipherResPass === password) {
      return res.json({
        status: 'Success',
        token: getToken(rows[0].user_id),
        userId: userId
      });
    } else {
      return res.status(401).json({ message: 'Wrong password' });
    }
  } catch (err) {
    connection.release();
    return next(err);
  }
});

/**
 * 토큰 체크
 */
router.post('/checkToken', (req, res, next) => {
  return res.json({
    success: true,
    tokenInfo: req.decoded
  });
});

/**
 * 태그입력
 */
router.post('/tag', async (req, res, next) => {
  const { tagName } = req.body;
  const userId = req.decoded.userId;
  if (_.isEmpty(tagName)) {
    return res.status(400).json({
      message: 'Bad request'
    });
  }
  if (_.isEmpty(userId)) {
    return res.status(401).json({
      message: 'Not logged'
    });
  }

  const connection = await getConn();
  try {
    const data = {
      user_id: userId,
      tag_name: _.trim(tagName),
      created_time: moment().format('YYYY-MM-DD HH:mm:ss')
    };
    await connection.beginTransaction();
    await connection.query(tags.insertTag(data));
    await connection.commit(); 
    connection.release();

    return res.json({
      success: true
    });
  } catch (err) {
    await connection.rollback(); 
    connection.release();
    return next(err);
  }
});

/**
 * 태그 삭제
 */
router.post('/removeTag', async (req, res, next) => {
  const { tagName } = req.body;
  const userId = req.decoded.userId;
  if (_.isEmpty(tagName)) {
    return res.status(400).json({
      message: 'Bad request'
    });
  }
  if (_.isEmpty(userId)) {
    return res.status(401).json({
      message: 'Not logged'
    });
  }

  const connection = await getConn();
  try {
    const data = {
      user_id: userId,
      tag_name: _.trim(tagName),
    };
    await connection.beginTransaction();
    await connection.query(tags.deleteTag(data));
    await connection.commit(); 
    connection.release();

    return res.json({
      success: true
    });
  } catch (err) {
    await connection.rollback(); 
    connection.release();
    return next(err);
  }
});

/**
 * 사용자 리스트 조회
 */
router.post('/list', async (req, res, next) => {
  const { limit, offset } = req.body;

  if (limit < 0 || offset < 0) {
    return res.status(400).json({
      message: 'Bad request'
    });
  }
  const connection = await getConn();
  try {
    const [rows] = await connection.query(user.selectUser());
    connection.release();
    return res.json(rows);
  } catch (err) {
    connection.release();
    return next(err);
  }
});

/**
 * 사용자 프로필 이미지 변경
 */
router.post('/profile', async (req, res, next) => {
  const connection = await getConn();
  try {
    await connection.beginTransaction();
    upload(req, res, async function(err) {
      const userId = req.decoded.userId;
      if (err instanceof multer.MulterError) {
        return next(err);
      } else if (err) {
        return next(err);
      }
      const file_path = _.get(req, 'file.location', null);
      logger.info(`${userId} update profile.`)
      await connection.query(user.updateProfile(file_path, userId));
    });
    await connection.commit(); 
    connection.release();

    return res.json({
      success: true
    });
  } catch (err) {
    await connection.rollback(); 
    connection.release();
    return next(err);
  }
})

module.exports = router;
