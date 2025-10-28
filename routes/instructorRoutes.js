const express = require('express');
const router = express.Router();
const instructorController = require('../controllers/instructorController');

router.post('/signup_i', instructorController.signup);
router.post('/login_i', instructorController.loginInstructor);
router.get('/instructor-dashboard', instructorController.instructorDashboard);
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

        res.render('ins', { instructor }); // render HTML with data
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;