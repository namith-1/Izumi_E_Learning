const db = require('../required/db');

exports.getAllQuestions = cb => {
  db.all("SELECT * FROM questions ORDER BY created_at DESC", cb);
};

exports.getQuestionsByStudent = (studentId, cb) => {
  db.all("SELECT * FROM questions WHERE student_id = ?", [studentId], cb);
};

exports.insertQuestion = (studentId, title, desc, cb) => {
  db.run("INSERT INTO questions (student_id, title, description) VALUES (?, ?, ?)", [studentId, title, desc], cb);
};

exports.getQuestionById = (id, cb) => {
  db.get("SELECT * FROM questions WHERE id = ?", [id], cb);
};

exports.getAnswersForQuestion = (id, cb) => {
  db.all("SELECT * FROM answers WHERE question_id = ? ORDER BY votes DESC", [id], cb);
};

exports.insertAnswer = (qid, sid, content, cb) => {
  db.run("INSERT INTO answers (question_id, student_id, content) VALUES (?, ?, ?)", [qid, sid, content], cb);
};

exports.getVote = (sid, aid, cb) => {
  db.get("SELECT vote_type FROM votes WHERE student_id = ? AND answer_id = ?", [sid, aid], cb);
};

exports.insertVote = (sid, aid, type, cb) => {
  db.run("INSERT INTO votes (student_id, answer_id, vote_type) VALUES (?, ?, ?)", [sid, aid, type], cb);
};

exports.updateVote = (sid, aid, type, cb) => {
  db.run("UPDATE votes SET vote_type = ? WHERE student_id = ? AND answer_id = ?", [type, sid, aid], cb);
};

exports.updateAnswerVotes = (aid, delta, cb) => {
  db.run("UPDATE answers SET votes = votes + ? WHERE id = ?", [delta, aid], cb);
};

exports.getAnswerVotes = (aid, cb) => {
  db.get("SELECT votes FROM answers WHERE id = ?", [aid], cb);
};
