const express = require('express');
const authMiddleware = require('../middlewares/auth');
const user = require('./user');
const quiz = require('./quiz');

const router = express.Router();

router.use('/user/checkToken', authMiddleware);
router.use('/user/tag', authMiddleware);
router.use('/quiz/create', authMiddleware);

router.use('/user', user);
router.use('/quiz', quiz);

module.exports = router;
