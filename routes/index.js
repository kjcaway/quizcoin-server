const express = require("express");
const user = require('./user');

const router = express.Router();

router.get("/", (req, res) => res.json({ message: "express connected." }));
router.use("/user", user);

module.exports = router;
