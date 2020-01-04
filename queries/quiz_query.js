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

function createAnswerSheet(data) {
  return `
  INSERT INTO QUIZ_ANSWER (user_id, quiz_id, answer_sheet, score, created_time)
  VALUES ('${data.user_id}', '${data.quiz_id}', '${data.answer_sheet}', '${data.score}', '${data.created_time}')
  `;
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
  createAnswerSheet
};
