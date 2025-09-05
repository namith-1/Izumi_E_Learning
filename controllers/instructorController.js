const Instructor = require('../models/instructorModel'); // Import the Mongoose Instructor model
const bcrypt = require('bcrypt');
const path = require('path');

exports.signup = async (req, res) => {
    const { username, email, password, contact, address } = req.body;

    try {
        const user = await Instructor.findByEmail(email);
        if (user) {
            if (user.is_deleted === 0) {
                return res.status(400).send('Email already exists.');
            } else {
                return res.status(400).send('Account exists but is deleted. Please <a href="/restore.html">restore your account</a>.');
            }
        }

        await Instructor.create(username, email, contact, address, password);
        res.redirect('/login_i');
    } catch (error) {
        console.error("Instructor signup error:", error);
        return res.status(500).send('Error signing up: ' + error.message);
    }
};

exports.loginInstructor = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await Instructor.findActiveByEmail(email);
        if (!user) return res.status(400).send('Invalid email or password.');

        const match = await bcrypt.compare(password, user.hashed_password);
        if (match) {
            req.session.instructor = user._id; // Store the Mongoose _id
            res.redirect('/instructor-dashboard');
        } else {
            res.status(400).send('Invalid email or password.');
        }
    } catch (error) {
        console.error("Instructor login error:", error);
        return res.status(500).send('Error logging in: ' + error.message);
    }
};

exports.instructorDashboard = (req, res) => {
    if (!req.session.instructor) return res.status(403).send("Unauthorized.");
    // Serve the instructor's dashboard view
    res.sendFile(path.join(__dirname, "../views/instructor_courses.html"));
};

// controllers/instructorAuthController.js
exports.logoutInstructor = (req, res) => {
    // Destroy the instructor's session (if using sessions)
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying instructor session:', err);
            return res.status(500).send('Instructor logout failed');
        }
        // Clear any instructor-specific authentication tokens (if using cookies)
        res.clearCookie('instructorAuthToken'); // Example cookie name for instructor token
        res.redirect('/login_i'); // Redirect to the instructor login page
    });
};