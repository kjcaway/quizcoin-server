const _ = require('lodash');

function selectQuiz(whereJson = {}) {
  let where = '';
  _.forIn(whereJson, (value, key) => {
    let term = ` AND ${key} = "${value}"`;
    where += term;
  });

  return `
  SELECT 
    quiz_id,
    user_id,
    question,
    case question_type when 1 then '주관식' else '객관식' end as question_type_name,
    del_yn,
    created_time,
    ifnull((select group_concat(item SEPARATOR ',') from QUIZ_ITEM where quiz_id = Q.quiz_id group by quiz_id), '') as items
  FROM
    QUIZ Q WHERE 1=1 ${where}
  `;
}

function insertQuiz(data) {
  return `
  INSERT INTO QUIZ (user_id, question, answer, question_type, del_yn, created_time)
  VALUES ('${data.user_id}', '${data.question}', '${data.answer}'
  , '${data.question_type}', '${data.del_yn}', '${data.created_time}')
  `;
}

module.exports = {
  selectQuiz,
  insertQuiz
};
