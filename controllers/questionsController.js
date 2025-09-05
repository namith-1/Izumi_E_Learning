const db = require("../required/db");

exports.showAllQuestions = (req, res) => {
    db.all("SELECT * FROM questions ORDER BY created_at DESC", (err, questions) => {
        if (err) return res.status(500).send(err.message);
        res.render("questions", { questions });
    });
};

exports.showMyQuestions = (req, res) => {
    db.all("SELECT * FROM questions WHERE student_id = ?", [req.session.student], (err, questions) => {
        if (err) return res.status(500).send(err.message);
        res.render("my_questions", { questions });
    });
};

exports.postQuestion = (req, res) => {
    const { title, description } = req.body;
    db.run("INSERT INTO questions (student_id, title, description) VALUES (?, ?, ?)",
        [req.session.student, title, description],
        (err) => {
            if (err) return res.status(500).send(err.message);
            res.redirect("/my-questions");
        }
    );
};

exports.showQuestionDetail = (req, res) => {
    const questionId = req.params.id;
    db.get("SELECT * FROM questions WHERE id = ?", [questionId], (err, question) => {
        if (err || !question) return res.status(404).send("Question not found");
        db.all("SELECT * FROM answers WHERE question_id = ? ORDER BY votes DESC", [questionId], (err, answers) => {
            if (err) return res.status(500).send(err.message);
            res.render("question_detail", { question, answers });
        });
    });
};

exports.postAnswer = (req, res) => {
    const { question_id, content } = req.body;
    db.run("INSERT INTO answers (question_id, student_id, content) VALUES (?, ?, ?)",
        [question_id, req.session.student, content],
        (err) => {
            if (err) return res.status(500).send(err.message);
            res.redirect(`/questions/${question_id}`);
        }
    );
};

exports.voteAnswer = (req, res) => {
    const { answer_id, vote } = req.body;
    const student_id = req.session.student;
    const voteType = vote === "up" ? 1 : -1;

    db.get("SELECT vote_type FROM votes WHERE student_id = ? AND answer_id = ?",
        [student_id, answer_id], (err, row) => {
            if (err) return res.status(500).json({ success: false, error: err.message });

            if (!row) {
                db.run("INSERT INTO votes (student_id, answer_id, vote_type) VALUES (?, ?, ?)",
                    [student_id, answer_id, voteType], (err) => {
                        if (err) return res.status(500).json({ success: false, error: err.message });

                        db.run("UPDATE answers SET votes = votes + ? WHERE id = ?",
                            [voteType, answer_id], (err) => {
                                if (err) return res.status(500).json({ success: false, error: err.message });

                                db.get("SELECT votes FROM answers WHERE id = ?", [answer_id], (err, row) => {
                                    if (err) return res.status(500).json({ success: false, error: err.message });
                                    res.json({ success: true, votes: row.votes });
                                });
                            });
                    });
            } else if (row.vote_type !== voteType) {
                db.run("UPDATE votes SET vote_type = ? WHERE student_id = ? AND answer_id = ?",
                    [voteType, student_id, answer_id], (err) => {
                        if (err) return res.status(500).json({ success: false, error: err.message });

                        db.run("UPDATE answers SET votes = votes + ? WHERE id = ?",
                            [2 * voteType, answer_id], (err) => {
                                if (err) return res.status(500).json({ success: false, error: err.message });

                                db.get("SELECT votes FROM answers WHERE id = ?", [answer_id], (err, row) => {
                                    if (err) return res.status(500).json({ success: false, error: err.message });
                                    res.json({ success: true, votes: row.votes });
                                });
                            });
                    });
            } else {
                res.json({ success: false, message: "You have already voted." });
            }
        });
};
