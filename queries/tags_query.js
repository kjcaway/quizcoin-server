function insertTag(data) {
  return `
  INSERT INTO TAGS (user_id, tag_name, created_time)
  VALUES ('${data.user_id}', '${data.tag_name}', '${data.created_time}')
  `;
}

module.exports = {
  insertTag,
};
