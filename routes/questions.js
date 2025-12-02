const express = require('express');
const router = express.Router();
const questionsController = require('../controllers/questionsController');

// API Routes
router.get('/api/questions', questionsController.getAllQuestions);
router.get('/api/questions/my', questionsController.getMyQuestions);
router.get('/api/questions/:id', questionsController.getQuestionById);
router.post('/api/questions', questionsController.createQuestion);
router.post('/api/questions/:id/answers', questionsController.addAnswer);

// Legacy Routes (if needed, or redirect)
router.get('/questions', (req, res) => res.redirect('/student/questions'));
router.get('/my-questions', (req, res) => res.redirect('/student/questions/my'));

module.exports = router;