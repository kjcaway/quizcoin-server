const _ = require('lodash');

function selectQuiz(whereJson = {}) {
  let where = '';
  _.forIn(whereJson, (value, key) => {
    let term = ` AND ${key} = "${value}"`;
    where += term;
  });

  return `
  SELECT quiz_id, user_id, question, answer, question_type, del_yn, created_time
  FROM QUIZ WHERE 1=1 ${where}
  `;
}

function insertQuiz(data) {
  return `
  INSERT INTO QUIZ (user_id, question, answer, question_type, del_yn, created_time)
  VALUES ('${data.user_id}', '${data.question}', '${data.answer}'
  , '${data.question_type}', '${data.del_yn}', '${data.create_time}')
  `;
}

module.exports = {
  selectQuiz,
  insertQuiz
};
