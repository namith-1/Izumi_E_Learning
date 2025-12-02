const { Question, Student } = require("../required/db");

exports.getAllQuestions = async (req, res) => {
    try {
        const questions = await Question.find()
            .populate('student_id', 'name')
            .sort({ created_at: -1 });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMyQuestions = async (req, res) => {
    try {
        const studentId = req.session.student;
        if (!studentId) return res.status(401).json({ message: "Unauthorized" });

        const questions = await Question.find({ student_id: studentId })
            .sort({ created_at: -1 });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getQuestionById = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id)
            .populate('student_id', 'name');
        if (!question) return res.status(404).json({ message: "Question not found" });
        res.json(question);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createQuestion = async (req, res) => {
    try {
        const studentId = req.session.student;
        if (!studentId) return res.status(401).json({ message: "Unauthorized" });

        const { title, description, tags } = req.body;
        const newQuestion = new Question({
            student_id: studentId,
            title,
            description,
            tags
        });

        await newQuestion.save();
        res.status(201).json(newQuestion);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addAnswer = async (req, res) => {
    try {
        const studentId = req.session.student;
        // Allow instructors too? For now assume student or check session
        if (!studentId) return res.status(401).json({ message: "Unauthorized" });

        const { content } = req.body;
        const question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ message: "Question not found" });

        question.answers.push({
            user_id: studentId,
            user_type: 'Student',
            content
        });

        await question.save();
        res.json(question);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
