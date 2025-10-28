// routes/gamifyRoutes.js
const express = require("express");
const router = express.Router();
const gamifyController = require("../controllers/gamifyController");

router.get("/games", gamifyController.getGamesPage);
router.get("/student_badge", gamifyController.getStudentBadge);

module.exports = router;
