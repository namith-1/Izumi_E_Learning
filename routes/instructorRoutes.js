const express = require('express');
const router = express.Router();
const instructorController = require('../controllers/instructorController');

router.post('/signup_i', (req, res) => {
  // Handle instructor signup with redirect
  instructorController.signup(req, res);
});
router.post('/login_i', (req, res) => {
  // Handle instructor login with redirect  
  instructorController.loginInstructor(req, res);
});
router.get('/dashboard', instructorController.instructorDashboard);
router.get('/logout-instructor', instructorController.logoutInstructor);

const Instructor = require('../required/db.js').Instructor; // adjust import as needed

router.get('/instructor/details', async (req, res) => {
    if (!req.session.instructor) {
        return res.status(401).send('Unauthorized: No instructor logged in');
    }

    try {
        const instructor = await Instructor.findOne({
            _id: req.session.instructor,
            is_deleted: 0
        });

        if (!instructor) return res.status(404).send('Instructor not found');

        res.render('instructor/profile', { instructor }); // render HTML with data
    } catch (err) {
        res.status(500).send('Server error');
    }
});

router.get('/api/instructor/me', async (req, res) => {
    if (!req.session.instructor) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const instructor = await Instructor.findOne({
            _id: req.session.instructor,
            is_deleted: 0
        }, '-hashed_password'); // Exclude password

        if (!instructor) return res.status(404).json({ message: 'Instructor not found' });

        res.json(instructor);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;