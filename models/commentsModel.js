const db = require('../required/db');

exports.getCommentsByVideoId = (videoId, callback) => {
  db.all(`
    SELECT c.*, u.name,
      (SELECT COALESCE(SUM(vote), 0) FROM comment_votes WHERE comment_id = c.id) as score
    FROM comments c
    JOIN students u ON c.user_id = u.id
    WHERE video_id = ?
    ORDER BY c.created_at ASC
  `, [videoId], callback);
};

exports.insertComment = (userId, videoId, content, parentId, callback) => {
  db.run(`INSERT INTO comments (user_id, video_id, content, parent_id) VALUES (?, ?, ?, ?)`,
    [userId, videoId, content, parentId || null],
    function(err) {
      callback(err, this?.lastID);
    });
};

exports.voteOnComment = (userId, commentId, vote, callback) => {
  db.run(`
    INSERT INTO comment_votes (comment_id, user_id, vote)
    VALUES (?, ?, ?)
    ON CONFLICT(comment_id, user_id)
    DO UPDATE SET vote = excluded.vote
  `, [commentId, userId, vote], callback);
};

