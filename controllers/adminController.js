const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// --- Hardcoded Admin Credentials and Mock ID ---
const ADMIN_EMAIL = 'admin@izumi.com';
const ADMIN_PASSWORD = 'adminpass';
const MOCK_ADMIN_ID = '60c728362d294d1f88c88888'; 

// Helper to get the correct model based on role
const getModel = (role) => {
    if (role === 'student') return Student;
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
        
        const user = await Model.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (actualRole === 'admin') {
            actualRole = 'admin'; 
        }

        req.session.user = { id: user._id, role: actualRole, name: user.name, email: user.email };
        res.json({ message: 'Logged in successfully', user: req.session.user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 1. Get All Enrollments
exports.getAllEnrollments = async (req, res) => {
    try {
        const enrollments = await Enrollment.find()
            .populate({
                path: 'courseId',
                select: 'title subject teacherId',
                populate: { path: 'teacherId', select: 'name' }
            })
            .populate('studentId', 'name email'); 
        
        const formattedEnrollments = enrollments.map(e => ({
            _id: e._id,
            courseTitle: e.courseId?.title || 'N/A',
            studentName: e.studentId?.name || 'N/A',
            studentEmail: e.studentId?.email || 'N/A',
            completionStatus: e.completionStatus,
            dateEnrolled: e.createdAt,
            modules_status: e.modules_status
        }));

        res.json(formattedEnrollments);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching enrollments: ' + err.message });
    }
};

// 2. Get All Users (Split by role + Analytics for Teachers)
exports.getAllUsers = async (req, res) => {
    try {
        const students = await Student.find().select('-password');
        
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
                    courseCount: { $size: '$courses' }
                }
            }
        ]);

        res.json({ students, teachers });
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
        
        // Cascade delete logic (simplified)
        if (role === 'teacher') {
            await Course.deleteMany({ teacherId: id });
            // Note: Enrollments linked to those courses should technically be deleted too
        } else if (role === 'student') {
            await Enrollment.deleteMany({ studentId: id });
        }

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
        const updated = await Model.findByIdAndUpdate(id, { name, email }, { new: true }).select('-password');
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 5. Course CRUD - Delete
exports.deleteCourse = async (req, res) => {
    try {
        await Course.findByIdAndDelete(req.params.id);
        await Enrollment.deleteMany({ courseId: req.params.id });
        res.json({ message: 'Course deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 6. Course CRUD - Get All (List for admin)
exports.getAllCoursesAdmin = async (req, res) => {
    try {
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
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    subject: 1,
                    rating: 1,
                    instructorName: 1,
                    totalStudentsRegistered: 1,
                    studentsCompleted: 1,
                    averageQuizScore: {
                        $avg: {
                            $map: {
                                input: { $filter: {
                                    input: '$allQuizScores',
                                    as: 'status',
                                    cond: { $ne: ['$$status.quizScore', null] }
                                } },
                                as: 'quizModule',
                                in: '$$quizModule.quizScore'
                            }
                        }
                    }
                }
            }
        ]);

        res.json(coursesWithAnalytics);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 7. Course CRUD - Update
exports.updateCourseAdmin = async (req, res) => {
    try {
        const updatedCourse = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedCourse);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 8. Lookup: Student Progress by Email
exports.getStudentEnrollmentByEmail = async (req, res) => {
    const { email } = req.params;
    try {
        const student = await Student.findOne({ email });
        if (!student) return res.status(404).json({ message: 'Student not found.' });

        const enrollments = await Enrollment.find({ studentId: student._id })
            .populate({
                path: 'courseId',
                select: 'title description subject teacherId',
                populate: { path: 'teacherId', select: 'name' }
            });

        const formattedEnrollments = enrollments.map(e => ({
            _id: e._id,
            courseTitle: e.courseId?.title || 'N/A',
            subject: e.courseId?.subject || 'N/A',
            instructorName: e.courseId?.teacherId?.name || 'N/A',
            completionStatus: e.completionStatus,
            dateEnrolled: e.createdAt,
            // Calculate simple progress %
            progress: e.modules_status ? Math.round((e.modules_status.filter(m=>m.completed).length / (e.modules_status.length || 1)) * 100) : 0
        }));

        res.json({ 
            student: { name: student.name, email: student.email, _id: student._id }, 
            enrollments: formattedEnrollments 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 9. Lookup: Teacher Courses by Email
exports.getTeacherCoursesByEmail = async (req, res) => {
    const { email } = req.params;
    try {
        const teacher = await Teacher.findOne({ email });
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
            teacher: { name: teacher.name, email: teacher.email, _id: teacher._id },
            courses: courses
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};