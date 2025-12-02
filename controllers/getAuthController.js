const path = require('path');

const getAuthController = {
    home: (req, res) => {
        if (req.session.student) {
            res.redirect('/home');
        } else {
            res.sendFile(path.join(__dirname, '../views/landing_page', 'landing.html'));
        }
    },

    login: (req, res) => {
        if (req.session.student) {
            res.redirect('/home');
        } else {
            res.sendFile(path.join(__dirname, '../views/student_auth', 'login.html'));
        }
    },

    signup: (req, res) => {
        if (req.session.student) return res.redirect('/');
        res.sendFile(path.join(__dirname, '../views/student_auth', 'signup.html'));
    },

    loginInstructor: (req, res) => {
        if (req.session.instructor) {
            res.redirect('/dashboard');
        } else {
            res.sendFile(path.join(__dirname, '../views/instructor_auth', 'login_i.html'));
        }
    },

    signupInstructor: (req, res) => {
        if (req.session.instructor) return res.redirect('/dashboard');
        res.sendFile(path.join(__dirname, '../views/instructor_auth', 'signup_i.html'));
    },

    studentHome: (req, res) => {
        if (req.session.student) {
            res.sendFile(path.join(__dirname, '../views/student', 'student_home.html'));
        } else {
            res.status(403).send('Unauthorized.');
        }
    },

 
    
};

module.exports = getAuthController;
