const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Reviewer = require('../models/Reviewer');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const cacheService = require('../services/cacheService');

// --- Hardcoded Admin Credentials and Mock ID ---
const ADMIN_EMAIL = 'admin@izumi.com';
const ADMIN_PASSWORD = 'adminpass';
const MOCK_ADMIN_ID = '60c728362d294d1f88c88888';

// Helper to get the correct model based on role
const getModel = (role) => {
    if (role === 'student') return Student;
    if (role === 'reviewer') return Reviewer;
    if (role === 'teacher' || role === 'admin') return Teacher;
    return null;
};

// Login
exports.login = async (req, res) => {
    const { email, password, role } = req.body;

    if (role === 'admin' && email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        req.session.user = {
            id: MOCK_ADMIN_ID,
            role: 'admin',
            name: 'Izumi Admin',
            email: ADMIN_EMAIL
        };
        return res.json({ message: 'Logged in successfully', user: req.session.user });
    }

    let actualRole = role;
    try {
        const Model = getModel(actualRole);
        if (!Model) return res.status(400).json({ message: 'Invalid role provided.' });

        const user = await Model.findOne({ email }).lean();

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.isLocked) {
            return res.status(403).json({ message: 'Account is locked. Please contact support.' });
        }

        req.session.user = { id: user._id, role: actualRole, name: user.name, email: user.email };
        res.json({ message: 'Logged in successfully', user: req.session.user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 1. Get All Enrollments
exports.getAllEnrollments = async (req, res) => {
    const cacheKey = "admin:enrollments";
    console.time("DB_Admin_AllEnrollments");
    try {
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            console.timeEnd("DB_Admin_AllEnrollments");
            return res.json(cached);
        }
        const enrollments = await Enrollment.find()
            .populate({
                path: 'courseId',
                select: 'title subject teacherId',
                populate: { path: 'teacherId', select: 'name' }
            })
            .populate('studentId', 'name email')
            .lean();
        console.timeEnd("DB_Admin_AllEnrollments");

        const formattedEnrollments = enrollments.map(e => ({
            _id: e._id,
            courseTitle: e.courseId?.title || 'N/A',
            studentName: e.studentId?.name || 'N/A',
            studentEmail: e.studentId?.email || 'N/A',
            completionStatus: e.completionStatus,
            dateEnrolled: e.createdAt,
            modules_status: e.modules_status
        }));
        
        await cacheService.set(cacheKey, formattedEnrollments);
        res.json(formattedEnrollments);
    } catch (err) {
        console.timeEnd("DB_Admin_AllEnrollments");
        res.status(500).json({ error: 'Error fetching enrollments: ' + err.message });
    }
};

const clearUserCache = async () => {
    await cacheService.del("admin:users_analytics");
};

const clearCourseCache = async () => {
    await cacheService.del("admin:courses");
};

// 2. Get All Users (Split by role + Analytics for Teachers)
exports.getAllUsers = async (req, res) => {
    const cacheKey = "admin:users_analytics";
    console.time("DB_Admin_AllUsers");
    try {
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            console.timeEnd("DB_Admin_AllUsers");
            return res.json(cached);
        }
        const students = await Student.find().select('-password').lean();

        // Complex Aggregation for Teachers to get Student Count
        const teachers = await Teacher.aggregate([
            {
                $lookup: {
                    from: 'courses',
                    localField: '_id',
                    foreignField: 'teacherId',
                    as: 'courses'
                }
            },
            {
                $lookup: {
                    from: 'enrollments',
                    localField: 'courses._id',
                    foreignField: 'courseId',
                    as: 'enrollments'
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    specialization: 1,
                    // Count total enrollments associated with this teacher's courses
                    totalStudents: { $size: '$enrollments' },
                    courseCount: { $size: '$courses' },
                    isLocked: { $ifNull: ['$isLocked', false] }
                }
            }
        ]);
        console.timeEnd("DB_Admin_AllUsers");

        const result = { students, teachers };
        await cacheService.set(cacheKey, result);
        res.json(result);
    } catch (err) {
        console.timeEnd("DB_Admin_AllUsers");
        res.status(500).json({ error: err.message });
    }
};

// 2b. Create Reviewer Account (Admin-only)
exports.createReviewer = async (req, res) => {
    try {
        const { name, email, password, specialization } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required.' });
        }
        const existing = await Reviewer.findOne({ email }).lean();
        if (existing) {
            return res.status(400).json({ message: 'A reviewer with this email already exists.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const reviewer = await Reviewer.create({ name, email, password: hashedPassword, specialization: specialization || '' });
        await clearUserCache();
        res.status(201).json({ message: 'Reviewer account created.', reviewer: { _id: reviewer._id, name: reviewer.name, email: reviewer.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2c. Get All Reviewers
exports.getAllReviewers = async (req, res) => {
    try {
        const reviewers = await Reviewer.find().select('-password').lean();
        res.json(reviewers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. User Detail CRUD - Delete (Banning logic)
exports.deleteUser = async (req, res) => {
    const { role, id } = req.params;
    try {
        const Model = getModel(role);
        if (!Model) return res.status(400).json({ message: 'Invalid role' });

        await Model.findByIdAndDelete(id);

        if (role === 'teacher') {
            await Course.deleteMany({ teacherId: id });
        } else if (role === 'student') {
            await Enrollment.deleteMany({ studentId: id });
        }
        await clearUserCache();
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. Update User (Simple)
exports.updateUser = async (req, res) => {
    const { role, id } = req.params;
    const { name, email } = req.body;
    try {
        const Model = getModel(role);
        if (!Model) return res.status(400).json({ message: 'Invalid role' });
        
        const updated = await Model.findByIdAndUpdate(id, { name, email }, { new: true }).select('-password').lean();
        if (!updated) return res.status(404).json({ message: 'User not found' });
        
        res.json(updated);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        res.status(500).json({ error: err.message });
    }
};

// 5. Course CRUD - Delete
exports.deleteCourse = async (req, res) => {
    try {
        await Course.findByIdAndDelete(req.params.id);
        await Enrollment.deleteMany({ courseId: req.params.id });
        await clearCourseCache();
        res.json({ message: 'Course deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 6. Course CRUD - Get All (List for admin)
exports.getAllCoursesAdmin = async (req, res) => {
    const cacheKey = "admin:courses";
    console.time("DB_Admin_AllCourses");
    try {
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            console.timeEnd("DB_Admin_AllCourses");
            return res.json(cached);
        }
        const coursesWithAnalytics = await Course.aggregate([
            {
                $lookup: {
                    from: 'teachers',
                    localField: 'teacherId',
                    foreignField: '_id',
                    as: 'teacherDetails'
                }
            },
            { $unwind: { path: '$teacherDetails', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'reviewers',
                    localField: 'reviewerId',
                    foreignField: '_id',
                    as: 'reviewerDetails'
                }
            },
            { $unwind: { path: '$reviewerDetails', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'enrollments',
                    localField: '_id',
                    foreignField: 'courseId',
                    as: 'enrollments'
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    subject: 1,
                    rating: { $ifNull: ['$rating', 0] },
                    approvalStatus: { $ifNull: ['$approvalStatus', 'draft'] },
                    reviewerName: { $ifNull: ['$reviewerDetails.name', null] },
                    reviewedAt: 1,
                    instructorName: { $ifNull: ['$teacherDetails.name', 'N/A'] },
                    totalStudentsRegistered: { $size: '$enrollments' },
                    studentsCompleted: {
                        $size: {
                            $filter: {
                                input: '$enrollments',
                                as: 'e',
                                cond: { $eq: ['$$e.completionStatus', 'completed'] }
                            }
                        }
                    },
                    allQuizScores: {
                        $reduce: {
                            input: '$enrollments.modules_status',
                            initialValue: [],
                            in: { $concatArrays: ['$$value', '$$this'] }
                        }
                    },
                    isFeatured: { $ifNull: ['$isFeatured', false] }
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    subject: 1,
                    rating: 1,
                    approvalStatus: 1,
                    reviewerName: 1,
                    reviewedAt: 1,
                    instructorName: 1,
                    totalStudentsRegistered: 1,
                    studentsCompleted: 1,
                    averageQuizScore: {
                        $avg: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$allQuizScores',
                                        as: 'status',
                                        cond: { $ne: ['$$status.quizScore', null] }
                                    }
                                },
                                as: 'quizModule',
                                in: '$$quizModule.quizScore'
                            }
                        }
                    },
                    isFeatured: 1
                }
            }
        ]);
        console.timeEnd("DB_Admin_AllCourses");

        await cacheService.set(cacheKey, coursesWithAnalytics);
        res.json(coursesWithAnalytics);
    } catch (err) {
        console.timeEnd("DB_Admin_AllCourses");
        res.status(500).json({ error: err.message });
    }
};

// 7. Course CRUD - Update
exports.updateCourseAdmin = async (req, res) => {
    try {
        const updatedCourse = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
        res.json(updatedCourse);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 8. Lookup: Student Progress by Email
exports.getStudentEnrollmentByEmail = async (req, res) => {
    console.time("DB_Admin_LookupEmail");
    const { email } = req.params;
    try {
        const student = await Student.findOne({ email }).lean();
        if (!student) {
            console.timeEnd("DB_Admin_LookupEmail");
            return res.status(404).json({ message: 'Student not found.' });
        }

        const enrollments = await Enrollment.find({ studentId: student._id })
            .populate({
                path: 'courseId',
                select: 'title description subject teacherId',
                populate: { path: 'teacherId', select: 'name' }
            })
            .lean();
        console.timeEnd("DB_Admin_LookupEmail");

        const formattedEnrollments = enrollments.map(e => ({
            _id: e._id,
            courseTitle: e.courseId?.title || 'N/A',
            subject: e.courseId?.subject || 'N/A',
            instructorName: e.courseId?.teacherId?.name || 'N/A',
            completionStatus: e.completionStatus,
            dateEnrolled: e.createdAt,
            progress: e.modules_status ? Math.round((e.modules_status.filter(m => m.completed).length / (e.modules_status.length || 1)) * 100) : 0
        }));

        res.json({
            student: { name: student.name, email: student.email, _id: student._id },
            enrollments: formattedEnrollments
        });
    } catch (err) {
        console.timeEnd("DB_Admin_LookupEmail");
        res.status(500).json({ error: err.message });
    }
};

// 9. Lookup: Teacher Courses by Email
exports.getTeacherCoursesByEmail = async (req, res) => {
    const { email } = req.params;
    try {
        const teacher = await Teacher.findOne({ email }).lean();
        if (!teacher) return res.status(404).json({ message: 'Teacher not found.' });

        // Get courses and aggregate enrollment counts for them
        const courses = await Course.aggregate([
            { $match: { teacherId: teacher._id } },
            {
                $lookup: {
                    from: 'enrollments',
                    localField: '_id',
                    foreignField: 'courseId',
                    as: 'enrollments'
                }
            },
            {
                $project: {
                    title: 1,
                    subject: 1,
                    rating: 1,
                    studentCount: { $size: '$enrollments' },
                    createdAt: 1
                }
            }
        ]);

        res.json({
            teacher: { name: teacher.name, email: teacher.email, _id: teacher._id, isLocked: teacher.isLocked },
            courses: courses
        });
    } catch (err) {
        console.timeEnd("DB_Admin_LookupEmail");
        res.status(500).json({ error: err.message });
    }
};

// 10. Force Update Course Status
exports.updateCourseStatusAdmin = async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await Course.findByIdAndUpdate(
            req.params.id,
            { approvalStatus: status, reviewedAt: new Date(), reviewerId: req.session.user.id },
            { new: true }
        ).lean();
        await clearCourseCache();
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 11. Toggle Featured Status
exports.toggleCourseFeatured = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });
        course.isFeatured = !course.isFeatured;
        await course.save();
        await clearCourseCache();
        res.json({ isFeatured: course.isFeatured });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 12. Reset User Password
exports.resetUserPassword = async (req, res) => {
    const { role, id } = req.params;
    try {
        const Model = getModel(role);
        if (!Model) return res.status(400).json({ message: 'Invalid role' });
        const temporaryPassword = await bcrypt.hash('Izumi@123', 10);
        await Model.findByIdAndUpdate(id, { password: temporaryPassword });
        await clearUserCache();
        res.json({ message: 'Password reset to default (Izumi@123) successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 13. Toggle User Lock
exports.toggleUserLock = async (req, res) => {
    const { role, id } = req.params;
    try {
        const Model = getModel(role);
        if (!Model) return res.status(400).json({ message: 'Invalid role' });
        const user = await Model.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.isLocked = !user.isLocked;
        await user.save();
        await clearUserCache();
        res.json({ isLocked: user.isLocked });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};