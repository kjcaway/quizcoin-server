function selectUser(userId = "") {
  if (userId) {
    return `
      SELECT * FROM USER WHERE user_id = '${userId}'
    `;
  } else {
    return `
      SELECT user_id, name, profile, created_time, lastlogin_time FROM USER 
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

module.exports = {
  selectUser,
  insertUser
};
