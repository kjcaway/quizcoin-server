const express = require('express');
const _ = require('lodash');
const crypto = require('crypto');
const moment = require('moment');
const db = require('../db');
const config = require('../config/config');
const logger = require('../logger');
const { quiz } = require('../queries');

const router = express.Router();

/**
 * 퀴즈 조회
 */
router.post('/list', (req, res, next) => {
  const queryJson = req.body;

  db((err, connection) => {
    let query = connection.query(quiz.selectQuiz(queryJson), (err, rows) => {
      connection.release();
      if (err) {
        return next(err);
      }

      return res.json(rows);
    });

    logger.debug('Execute query.\n\n\t\t' + query.sql + '\n');
  });
});

/**
 * 퀴즈 생성
 */
router.post('/create', (req, res, next) => {
  const { question, answer, questionType } = req.body;
  const userId = req.decoded.userId;
  
  db((err, connection) => {
    const data = {
      user_id: userId,
      question: question,
      answer: answer,
      question_type: questionType,
      del_yn: 'N',
      created_time: moment().format('YYYY-MM-DD HH:mm:ss')
    };

    let query = connection.query(quiz.insertQuiz(data), (err, results) => {
      connection.release();
      if (err) {
        return next(err);
      }

      return res.json({ results });
    });

    logger.debug('Execute query.\n\n\t\t' + query.sql + '\n');
  });
});

module.exports = router;
