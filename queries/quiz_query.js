const _ = require('lodash');

function selectQuiz(userId) {
  let term = '';
  if(userId){
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
    QUIZ Q WHERE 1=1 AND user_id = '${userId}'
  ORDER BY 
    created_time desc
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

module.exports = {
  selectQuiz,
  selectQuizWithAnswer,
  insertQuiz,
  insertQuizItem
};
