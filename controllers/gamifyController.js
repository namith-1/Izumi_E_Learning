// controllers/gamifyController.js
const path = require("path");

exports.getGamesPage = (req, res) => {
    if (!req.session.student) {
        return res.status(403).send("Unauthorized.");
    }
    res.sendFile(path.join(__dirname, "../views/gamification/test_just.html"));
};

exports.getStudentBadge = (req, res) => {
    res.sendFile(path.join(__dirname, "../views/gamification/badge.html"));
};
