function insertTag(data) {
  return `
  INSERT INTO TAGS (user_id, tag_name, created_time)
  VALUES ('${data.user_id}', '${data.tag_name}', '${data.created_time}')
  `;
}

function deleteTag(data) {
  return `
  DELETE FROM TAGS WHERE user_id = '${data.user_id}' AND tag_name = '${data.tag_name}'
  `;
}

module.exports = {
  insertTag,
  deleteTag
};
