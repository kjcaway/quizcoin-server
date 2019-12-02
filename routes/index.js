const express = require('express');
const user = require('./user');
const quiz = require('./quiz');

const router = express.Router();

router.get('/', (req, res) => res.json({ message: 'express connected.' }));
router.use('/user', user);
router.use('/quiz', quiz);

module.exports = router;
