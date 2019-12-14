const express = require('express');
const _ = require('lodash');
const moment = require('moment');
const getConn = require('../db');
const logger = require('../logger');
const { quiz } = require('../queries');

const router = express.Router();

/**
 * 퀴즈 조회
 */
router.post('/list', async (req, res, next) => {
  const queryJson = req.body;
  const connection = await getConn();
  try {
    const [rows] = await connection.query(selectQuiz(queryJson));
    connection.release();
    return res.json(rows);
  } catch (err) {
    connection.release();
    return next(err);
  }
});

/**
 * 퀴즈 생성
 */
router.post('/create', async (req, res, next) => {
  const { question, answer, questionType } = req.body;
  const userId = req.decoded.userId;
  
  const connection = await getConn();
  try {
    const data = {
      user_id: userId,
      question: question,
      answer: answer,
      question_type: questionType,
      del_yn: 'N',
      created_time: moment().format('YYYY-MM-DD HH:mm:ss')
    };
    await connection.beginTransaction();
    await connection.query(quiz.insertQuiz(data));
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

module.exports = router;
