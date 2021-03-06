const jwt = require('jsonwebtoken');
const config = require('../config/config');

function getToken(userId) {
  let token = jwt.sign(
    {
      userId: userId
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expire,
      subject: 'userInfo'
    }
  );
  return token;
}

module.exports = {
  getToken
};
