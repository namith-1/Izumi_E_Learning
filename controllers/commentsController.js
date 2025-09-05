const model = require('../models/commentsModel');
const path = require('path');

exports.getComments = (req, res) => {
  model.getCommentsByVideoId(req.params.videoId, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.postComment = (req, res) => {
  const { userId, videoId, content, parentId } = req.body;
  model.insertComment(userId, videoId, content, parentId, (err, id) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id });
  });
};

exports.voteComment = (req, res) => {
  const { userId, commentId, vote } = req.body;
  model.voteOnComment(userId, commentId, vote, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
};

exports.commentSectionPage = (req, res) => {
  if (!req.session.student) return res.status(403).send("Unauthorized.");
  res.sendFile(path.join(__dirname, '../views/comments.html'));
};
