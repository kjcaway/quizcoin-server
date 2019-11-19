const jwt = require("jsonwebtoken");
const config = require("../config/config");

function getToken(userId) {
  let token = jwt.sign(
    {
      userId: userId
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expire,
      subject: "userInfo"
    }
  );
  // res.cookie("token", token);
  return token;
}

module.exports = {
  getToken
}