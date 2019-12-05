const jwt = require('jsonwebtoken');
const config = require('../config/config');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Empty token'
    });
  }

  const p = new Promise((resolve, reject) => {
    jwt.verify(token, config.jwt.secret, (err, decoded) => {
      if (err) reject(err);
      resolve(decoded);
    });
  });

  p.then(decoded => {
    req.decoded = decoded;
    next();
  }).catch(err => {
    res.status(401).json({
      success: false,
      message: err.name
    });
  });
};

module.exports = authMiddleware;
