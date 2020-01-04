function selectUser(userId = '') {
  if (userId) {
    return `
      SELECT 
          US.user_id, 
          US.password,
          US.name, 
          US.profile, 
          US.created_time, 
          US.lastlogin_time,
          ifnull(SC.score, 0) as score,
          ifnull(SC.popular, 0) as popular,
          (select count(*) from QUIZ where user_id = US.user_id AND del_yn = 'N') as quizcnt,
          ifnull((select group_concat(tag_name SEPARATOR ',') from TAGS where user_id = US.user_id group by user_id), '') as tags
      FROM
          USER US LEFT OUTER JOIN SCORE SC ON SC.user_id = US.user_id
      WHERE US.user_id = '${userId}'
    `;
  } else {
    return `
      SELECT 
          US.user_id, 
          US.name, 
          US.profile, 
          US.created_time, 
          US.lastlogin_time,
          ifnull(SC.score, 0) as score,
          ifnull(SC.popular, 0) as popular,
          (select count(*) from QUIZ where user_id = US.user_id AND del_yn = 'N') as quizcnt,
          ifnull((select group_concat(tag_name SEPARATOR ',') from TAGS where user_id = US.user_id group by user_id), '') as tags
      FROM
          USER US LEFT OUTER JOIN SCORE SC ON SC.user_id = US.user_id
    `;
  }
}

function insertUser(data) {
  return `
    INSERT INTO USER (user_id, name, password, profile, created_time, lastlogin_time)
    VALUES ('${data.user_id}', '${data.name}', '${data.password}'
      , '${data.profile}', '${data.created_time}', '${data.lastlogin_time}')
  `;
}

function updateProfile(file_path, user_id) {
  return `
    UPDATE USER SET profile = '${file_path}' WHERE user_id = '${user_id}'
  `
}

function upsertScore(data) {
  return `
    INSERT INTO SCORE (user_id, score, update_time)
    VALUES ('${data.user_id}', '${data.score}', '${data.update_time}')
    ON DUPLICATE KEY UPDATE
    score = score + '${data.score}', update_time = '${data.update_time}'
  `
}

function upsertPopular(data) {
  return `
    INSERT INTO SCORE (user_id, popular, update_time)
    VALUES ('${data.user_id}', '${data.popular}', '${data.update_time}')
    ON DUPLICATE KEY UPDATE
    popular = popular + '${data.popular}', update_time = '${data.update_time}'
  `
}

module.exports = {
  selectUser,
  insertUser,
  updateProfile,
  upsertScore,
  upsertPopular
};
