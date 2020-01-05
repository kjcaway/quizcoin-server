const _ = require('lodash');

function selectQuiz(userId) {
  let term = '';
  if (userId) {
    term = ` AND user_id = "${userId}"`;
  }
  return `
  SELECT 
    quiz_id,
    user_id,
    question,
    case question_type when 1 then '객관식' else '주관식' end as question_type_name,
    created_time,
    ifnull((select group_concat(item SEPARATOR ',') from QUIZ_ITEM where quiz_id = Q.quiz_id group by quiz_id), '') as items
  FROM
    QUIZ Q WHERE del_yn = 'N' 
    ${term}
  ORDER BY 
    created_time desc
  `;
}

function selectQuizOne(quizId) {
  let term = '';
  if (quizId) {
    term = ` AND quiz_id = "${quizId}"`;
  }
  return `
  SELECT 
    quiz_id,
    user_id,
    question,
    case question_type when 1 then '객관식' else '주관식' end as question_type_name,
    created_time,
    ifnull((select group_concat(item SEPARATOR ',') from QUIZ_ITEM where quiz_id = Q.quiz_id group by quiz_id), '') as items
  FROM
    QUIZ Q WHERE del_yn = 'N' 
    ${term}
  `;
}

/**
 * 본인 퀴즈 조회
 * @param {*} userId
 */
function selectQuizWithAnswer(userId) {
  // let where = '';
  // _.forIn(whereJson, (value, key) => {
  //   let term = ` AND ${key} = "${value}"`;
  //   where += term;
  // });

  return `
  SELECT 
    quiz_id,
    user_id,
    question,
    answer,
    case question_type when 1 then '객관식' else '주관식' end as question_type_name,
    del_yn,
    created_time,
    ifnull((select group_concat(item SEPARATOR ',') from QUIZ_ITEM where quiz_id = Q.quiz_id group by quiz_id), '') as items
  FROM
    QUIZ Q WHERE 1=1 AND user_id = '${userId}' AND del_yn = 'N'
  ORDER BY 
    created_time desc
  `;
}

function selectQuizOneWithAnswer(quizId) {
  return `
  SELECT 
    quiz_id,
    user_id,
    question,
    answer
  FROM
    QUIZ Q WHERE 
    quiz_id = "${quizId}"
  `;
}

function insertQuiz(data) {
  return `
  INSERT INTO QUIZ (user_id, question, answer, question_type, del_yn, created_time)
  VALUES ('${data.user_id}', '${data.question}', '${data.answer}'
  , '${data.question_type}', '${data.del_yn}', '${data.created_time}')
  `;
}

function insertQuizItem(data) {
  return `
  INSERT INTO QUIZ_ITEM (quiz_id, item)
  VALUES ('${data.quiz_id}', '${data.item}')
  `;
}

function updateToDeleteQuiz(quizId) {
  return `
  UPDATE QUIZ SET del_yn = 'Y' WHERE quiz_id = '${quizId}'
  `;
}

function deleteDeleteQuizItem(quizId) {
  return `
  DELETE FROM QUIZ_ITEM WHERE quiz_id = '${quizId}'
  `;
}

function upsertQuizAnswer(data) {
  return `
  INSERT INTO QUIZ_ANSWER (user_id, quiz_id, answer_sheet, score, created_time)
  VALUES ('${data.user_id}', '${data.quiz_id}', '${data.answer_sheet}', '${data.score}', '${data.created_time}')
  ON DUPLICATE KEY UPDATE
    answer_sheet = '${data.answer_sheet}', 
    score = '${data.score}',
    created_time = '${data.created_time}'
  `;
}

function insertQuizAnswerLog(data) {
  return `
  INSERT INTO QUIZ_ANSWER_LOG (user_id, quiz_id, try_cnt, answer_sheet, created_time)
  VALUES ('${data.user_id}', '${data.quiz_id}', '${data.try_cnt}', '${data.answer_sheet}', '${data.created_time}')
  `;
}

function selectTryCnt(data) {
  return `
  SELECT 
    QAL.answer_sheet AS last_answer_sheet, QAL.try_cnt AS try_cnt
  FROM
      QUIZ_ANSWER_LOG QAL
          INNER JOIN
      (SELECT 
          IFNULL(MAX(try_cnt), 0) AS try_cnt
      FROM
          QUIZ_ANSWER_LOG
      WHERE
          user_id = '${data.user_id}' AND quiz_id = '${data.quiz_id}') TR ON TR.try_cnt = QAL.try_cnt
          AND user_id = '${data.user_id}'
          AND quiz_id = '${data.quiz_id}'
  `
}

function selectQuizAnswer(userId) {
  return `
  SELECT
    user_id, quiz_id, answer_sheet, score
  FROM QUIZ_ANSWER
  WHERE user_id = '${userId}'
  `
}

module.exports = {
  selectQuiz,
  selectQuizOne,
  selectQuizWithAnswer,
  selectQuizOneWithAnswer,
  insertQuiz,
  insertQuizItem,
  updateToDeleteQuiz,
  deleteDeleteQuizItem,
  upsertQuizAnswer,
  insertQuizAnswerLog,
  selectTryCnt,
  selectQuizAnswer
};
