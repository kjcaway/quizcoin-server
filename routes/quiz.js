const express = require('express');
const _ = require('lodash');
const moment = require('moment');
const getConn = require('../db');
const logger = require('../logger');
const { replaceStringToCompare } = require('../lib/utils');
const { SCORE, POPULAR } = require('../lib/constants');
const { quiz, user } = require('../queries');

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

/**
 * 답안 제출
 */
router.post('/answer', async (req, res, next) => {
  const { quizId, answerSheet } = req.body;
  const answerUserId = req.decoded.userId;

  if (!_.isNumber(Number(quizId))) {
    return res.status(400).json({
      message: 'Bad request'
    });
  }

  const connection = await getConn();
  try {
    await connection.beginTransaction();

    const [quizRows] = await connection.query(quiz.selectQuizOneWithAnswer(quizId));
    const { user_id, answer } = quizRows[0];
    const quizUserId = user_id;

    if (quizUserId === answerUserId) {
      // 자신의 문제에 정답입력 불가
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        message: 'Bad request'
      });
    }

    // 몇번째 시도인지 조회
    const tryCntData = {
      user_id: answerUserId,
      quiz_id: quizId
    };
    const [tryCntRows] = await connection.query(quiz.selectTryCnt(tryCntData));
    const last_answer_sheet = tryCntRows[0]?tryCntRows[0].last_answer_sheet:'';
    const try_cnt = tryCntRows[0]?tryCntRows[0].try_cnt:0;
    if (
      replaceStringToCompare(answer) === replaceStringToCompare(last_answer_sheet)
    ) {
      // 이미 정답 제출
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        message: 'Bad request'
      });
    }

    let data = {
      user_id: answerUserId,
      quiz_id: quizId,
      answer_sheet: replaceStringToCompare(answerSheet),
      score: 0,
      created_time: moment().format('YYYY-MM-DD HH:mm:ss')
    };
    let isRight = false;
    if (
      replaceStringToCompare(answer) === replaceStringToCompare(answerSheet)
    ) {
      // 정답
      let computeScore =
        try_cnt === 0
          ? SCORE.RIGHT
          : try_cnt === 1
          ? SCORE.RIGHT_FOR_TWICE
          : SCORE.RIGHT_FOR_THRICE;
      isRight = true;
      data.score = computeScore; // 첫번째 시도만에 10, 두번쨰시도 5, 세번째 시도 2
    }
    await connection.query(quiz.upsertQuizAnswer(data));

    const logData = {
      user_id: answerUserId,
      quiz_id: quizId,
      try_cnt: try_cnt + 1,
      answer_sheet: replaceStringToCompare(answerSheet),
      created_time: data.created_time
    };
    await connection.query(quiz.insertQuizAnswerLog(logData));

    const scoreData = {
      user_id: answerUserId,
      score: data.score,
      update_time: data.created_time
    };
    await connection.query(user.upsertScore(scoreData));

    const popularData = {
      user_id: quizUserId,
      popular: POPULAR,
      update_time: data.created_time
    };
    await connection.query(user.upsertPopular(popularData));
    await connection.commit();
    connection.release();

    return res.json({
      success: true,
      isRight: isRight,
      tryCnt: logData.try_cnt,
      gettingScore: data.score
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
    return next(err);
  }
});

/**
 * 나의 퀴즈답안 리스트 조회
 */
router.post('/myQuizAnswer', async (req, res, next) => {
  const userId = req.decoded.userId;
  
  const connection = await getConn();
  try {
    const [rows] = await connection.query(quiz.selectQuizAnswer(userId));
    connection.release();
    return res.json(rows);
  } catch (err) {
    connection.release();
    return next(err);
  }
});

module.exports = router;
