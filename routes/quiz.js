const express = require('express');
const _ = require('lodash');
const moment = require('moment');
const getConn = require('../db');
const logger = require('../logger');
const { quiz } = require('../queries');

const router = express.Router();

/**
 * 퀴즈 조회 (own)
 */
router.post('/mylist', async (req, res, next) => {
  const userId = req.decoded.userId;
  const connection = await getConn();
  try {
    const [rows] = await connection.query(quiz.selectQuizWithAnswer(userId));
    connection.release();
    return res.json(rows);
  } catch (err) {
    connection.release();
    return next(err);
  }
});

/**
 * 최근 퀴즈 조회
 */
router.post('/list', async (req, res, next) => {
  const { userId, limit, offset } = req.body;

  if (limit < 0 || offset < 0) {
    return res.status(400).json({
      message: 'Bad request'
    });
  }

  const connection = await getConn();
  try {
    const [rows] = await connection.query(quiz.selectQuiz(userId));
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
  const { question, answer, questionType, multiAnswerItems } = req.body;
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
    const [results] = await connection.query(quiz.insertQuiz(data));
    if (questionType === 1) {
      // 객관식
      const quizId = results.insertId;
      multiAnswerItems.forEach(async item => {
        const itemData = {
          quiz_id: quizId,
          item: item
        };
        await connection.query(quiz.insertQuizItem(itemData));
      });
    }
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
 * 퀴즈 삭제
 */
router.post('/remove', async (req, res, next) => {
  const { quizId } = req.body;
  const userId = req.decoded.userId;

  const connection = await getConn();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(quiz.selectQuizOne(quizId));
    const rowsUserId = rows[0].user_id;
    if (rowsUserId !== userId) {
      throw Error('Unauthorized');
    }
    await connection.query(quiz.updateToDeleteQuiz(quizId));
    await connection.query(quiz.deleteDeleteQuizItem(quizId));
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
 * 퀴즈 하나 조회
 */
router.get('/:quizId', async (req, res, next) => {
  const { quizId } = req.params;
  if (!_.isNumber(Number(quizId))) {
    return res.status(400).json({
      message: 'Bad request'
    });
  }

  const connection = await getConn();
  try {
    const [rows] = await connection.query(quiz.selectQuizOne(quizId));
    connection.release();
    return res.json(rows);
  } catch (err) {
    connection.release();
    return next(err);
  }
});

module.exports = router;
