const Student = require('../models/studentModel'); // Import the Mongoose-based StudentModel
const bcrypt = require('bcrypt');

exports.signup = async (req, res) => {
    const { username, email, password, contact, address } = req.body;

    try {
        const user = await Student.findByEmail(email);
        if (user) {
            if (user.is_deleted === 0) {
                return res.status(400).send('Email already exists.');
            } else {
                return res.status(400).send('Account exists but is deleted. Please <a href="/restore.html">restore your account</a>.');
            }
        }

        await Student.create(username, email, contact, address, password);
        res.redirect('/login');
    } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).send('Error signing up: ' + error.message); // Include the error message
    }
};

exports.loginStudent = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await Student.findActiveByEmail(email);
        if (!user) return res.status(400).send('Invalid email or password.');

        const match = await bcrypt.compare(password, user.hashed_password);
        if (match) {
            req.session.student = user._id; // Store the Mongoose _id
            res.redirect('/');
        } else {
            res.status(400).send('Invalid email or password.');
        }
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).send('Error logging in: ' + error.message);
    }
};

exports.loadUserInfo = async (req, res) => {
    if (!req.session.student) {
        return res.status(403).send("Unauthorized.");
    }

    try {
        const userId = req.session.student;
        console.log(userId);
        const user = await Student.findById(userId);
        console.log(user);
        if (!user) return res.status(404).send("User not found.");
        res.json(user);
    } catch (error) {
        console.error("Load user info error:", error);
        return res.status(500).send("Error fetching user: " + error.message);
    }
};
