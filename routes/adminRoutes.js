const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middlewares/authMiddleware');
const { Student, Instructor, Course, CourseStat, Module, Enrollment } = require('../required/db');
const bcrypt = require('bcrypt');

// Get courses for content forms
router.get('/courses/list', isAdmin, async (req, res) => {
    try {
        const courses = await Course.find()
            .select('_id title')
            .sort('title');
        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Error fetching courses' });
    }
});

// Get instructors for course forms
router.get('/instructors', isAdmin, async (req, res) => {
    try {
        const instructors = await Instructor.find({ is_deleted: 0 })
            .select('_id name')
            .sort('name');
        res.json(instructors);
    } catch (error) {
        console.error('Error fetching instructors:', error);
        res.status(500).json({ error: 'Error fetching instructors' });
    }
});

// Admin login routes
router.get('/login', (req, res) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return res.redirect('/admin/dashboard');
    }
    res.render('admin/login');
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        if (email === 'admin@example.com' && password === 'admin123') {
            req.session.user = {
                id: 1,
                email: email,
                role: 'admin'
            };
            res.redirect('/admin/dashboard');
        } else {
            res.status(401).render('admin/login', { error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).render('admin/login', { error: 'An error occurred during login' });
    }
});

// Admin dashboard
router.get('/dashboard', isAdmin, async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments({ is_deleted: 0 });
        const totalInstructors = await Instructor.countDocuments({ is_deleted: 0 });
        const totalCourses = await Course.countDocuments();
        const totalEnrollments = await Enrollment.countDocuments();

        res.render('admin/dashboard', {
            stats: {
                totalStudents,
                totalInstructors,
                totalCourses,
                totalEnrollments
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).render('error', { message: 'Error loading dashboard' });
    }
});

// User management
router.get('/users', isAdmin, async (req, res) => {
    try {
        const students = await Student.find({ is_deleted: 0 }).select('name email contact address');
        const instructors = await Instructor.find({ is_deleted: 0 }).select('name email contact address');
        
        res.render('admin/users', {
            students,
            instructors
        });
    } catch (error) {
        console.error('Users error:', error);
        res.status(500).render('error', { message: 'Error loading users' });
    }
});

// Course management
router.get('/courses', isAdmin, async (req, res) => {
    try {
        const courses = await Course.aggregate([
            {
                $lookup: {
                    from: 'instructors',
                    localField: 'instructor_id',
                    foreignField: '_id',
                    as: 'instructor'
                }
            },
            {
                $lookup: {
                    from: 'coursestats',
                    localField: '_id',
                    foreignField: 'course_id',
                    as: 'stats'
                }
            },
            {
                $unwind: {
                    path: '$instructor',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: '$stats',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    subject: 1,
                    instructor_name: '$instructor.name',
                    enrolled_count: { $ifNull: ['$stats.enrolled_count', 0] },
                    price: { $ifNull: ['$stats.price', 0] },
                    avg_rating: { $ifNull: ['$stats.avg_rating', 0] }
                }
            }
        ]);

        res.render('admin/courses', { courses });
    } catch (error) {
        console.error('Courses error:', error);
        res.status(500).render('error', { message: 'Error loading courses' });
    }
});

// Content management
router.get('/content', isAdmin, async (req, res) => {
    try {
        const modules = await Module.aggregate([
            {
                $lookup: {
                    from: 'courses',
                    localField: 'course_id',
                    foreignField: '_id',
                    as: 'course'
                }
            },
            {
                $unwind: '$course'
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    text: 1,
                    url: 1,
                    course_title: '$course.title'
                }
            }
        ]);

        res.render('admin/content', { modules });
    } catch (error) {
        console.error('Content error:', error);
        res.status(500).render('error', { message: 'Error loading content' });
    }
});

// Add new user
router.post('/users', isAdmin, async (req, res) => {
    try {
        const { name, email, password, role, contact, address } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        if (role === 'student') {
            await Student.create({
                name,
                email,
                contact,
                address,
                hashed_password: hashedPassword,
                is_deleted: 0
            });
        } else if (role === 'instructor') {
            await Instructor.create({
                name,
                email,
                contact,
                address,
                hashed_password: hashedPassword,
                is_deleted: 0
            });
        }

        res.redirect('/admin/users');
    } catch (error) {
        console.error('Add user error:', error);
        res.status(500).render('error', { message: 'Error adding user' });
    }
});

// Add new course
router.post('/courses', isAdmin, async (req, res) => {
    try {
        const { title, subject, instructor_id, price } = req.body;
        
        const course = await Course.create({
            title,
            subject,
            instructor_id
        });

        await CourseStat.create({
            course_id: course._id,
            price: parseFloat(price),
            enrolled_count: 0,
            avg_rating: 0,
            review_count: 0
        });

        res.redirect('/admin/courses');
    } catch (error) {
        console.error('Add course error:', error);
        res.status(500).render('error', { message: 'Error adding course' });
    }
});

// Add new content
router.post('/content', isAdmin, async (req, res) => {
    try {
        const { title, text, url, course_id } = req.body;
        
        await Module.create({
            course_id,
            title,
            text,
            url
        });

        res.redirect('/admin/content');
    } catch (error) {
        console.error('Add content error:', error);
        res.status(500).render('error', { message: 'Error adding content' });
    }
});

// Delete user
router.delete('/users/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.query;

        if (role === 'student') {
            await Student.findByIdAndUpdate(id, { is_deleted: 1 });
        } else if (role === 'instructor') {
            await Instructor.findByIdAndUpdate(id, { is_deleted: 1 });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, error: 'Error deleting user' });
    }
});

// Edit user
router.put('/users/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, contact, address, role } = req.body;

        if (role === 'student') {
            await Student.findByIdAndUpdate(id, { name, email, contact, address });
        } else if (role === 'instructor') {
            await Instructor.findByIdAndUpdate(id, { name, email, contact, address });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Edit user error:', error);
        res.status(500).json({ success: false, error: 'Error updating user' });
    }
});

// Delete course
router.delete('/courses/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await Course.findByIdAndDelete(id);
        await CourseStat.findOneAndDelete({ course_id: id });
        await Module.deleteMany({ course_id: id });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ success: false, error: 'Error deleting course' });
    }
});

// Edit course
router.put('/courses/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, subject, instructor_id, price } = req.body;

        await Course.findByIdAndUpdate(id, { title, subject, instructor_id });
        await CourseStat.findOneAndUpdate(
            { course_id: id },
            { price: parseFloat(price) }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Edit course error:', error);
        res.status(500).json({ success: false, error: 'Error updating course' });
    }
});

// Delete content
router.delete('/content/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await Module.findByIdAndDelete(id);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete content error:', error);
        res.status(500).json({ success: false, error: 'Error deleting content' });
    }
});

// Edit content
router.put('/content/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, text, url, course_id } = req.body;

        await Module.findByIdAndUpdate(id, {
            title,
            text,
            url,
            course_id
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Edit content error:', error);
        res.status(500).json({ success: false, error: 'Error updating content' });
    }
});

// Admin logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/admin/login');
    });
});

module.exports = router; 