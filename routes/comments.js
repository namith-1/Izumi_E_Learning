const express = require('express');
const router = express.Router();
const controller = require('../controllers/commentsController');

router.get('/:videoId', controller.getComments);
router.post('/comments', controller.postComment);
router.post('/vote', controller.voteComment);
router.get('/', controller.commentSectionPage);

module.exports = router;
