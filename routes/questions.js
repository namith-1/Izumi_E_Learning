const express = require("express");
const router = express.Router();
const controller = require("../controllers/questionsController");
const checkSession = require("../middlewares/auth").checkSession;

router.get("/questions", controller.showAllQuestions);
router.get("/my-questions", checkSession, controller.showMyQuestions);
router.post("/questions/new", checkSession, controller.postQuestion);
router.get("/questions/:id", controller.showQuestionDetail);
router.post("/answers/new", checkSession, controller.postAnswer);
router.post("/answers/vote", checkSession, controller.voteAnswer);

module.exports = router;
