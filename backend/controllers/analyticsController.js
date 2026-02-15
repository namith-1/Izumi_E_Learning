const mongoose = require('mongoose');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// ===== ADMIN ANALYTICS =====

// 1. Platform Overview - Enhanced statistics
exports.getAdminOverview = async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        const totalInstructors = await Teacher.countDocuments();
        const totalCourses = await Course.countDocuments();
        const totalEnrollments = await Enrollment.countDocuments();

        // Calculate completion rate
        const completedEnrollments = await Enrollment.countDocuments({ completionStatus: 'completed' });
        const completionRate = totalEnrollments > 0 ? ((completedEnrollments / totalEnrollments) * 100).toFixed(1) : 0;

        // Calculate average rating across all courses
        const courses = await Course.find({ rating: { $exists: true, $ne: null } });
        const avgRating = courses.length > 0
            ? (courses.reduce((sum, c) => sum + (c.rating || 0), 0) / courses.length).toFixed(1)
            : 0;

        // Get growth metrics (users can filter)
        const days = parseInt(req.query.days) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const newStudents = await Student.countDocuments({ createdAt: { $gte: startDate } });
        const newInstructors = await Teacher.countDocuments({ createdAt: { $gte: startDate } });
        const newCourses = await Course.countDocuments({ createdAt: { $gte: startDate } });

        res.json({
            totalStudents,
            totalInstructors,
            totalCourses,
            totalEnrollments,
            completionRate: parseFloat(completionRate),
            averageRating: parseFloat(avgRating),
            growth: {
                students: newStudents,
                instructors: newInstructors,
                courses: newCourses,
                days: days // Return the days used for context
            },
            // Backward compatibility (optional, but good for safety)
            growth30d: {
                students: newStudents, // This might not be 30d anymore, but keeps frontend from crashing until updated
                instructors: newInstructors,
                courses: newCourses
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. Growth Trends - Registration and enrollment over time
exports.getGrowthTrends = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const { subject } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // If subject filter is applied, we only filter Courses and Enrollments
        // Students/Instructors are platform-wide, so we return empty/unfiltered based on UX choice.
        // Returning empty for students/instructors when subject is selected to avoid confusion.

        let courseMatch = { createdAt: { $gte: startDate } };
        let enrollmentMatch = { createdAt: { $gte: startDate } };
        let studentTrends = [];
        let instructorTrends = [];

        if (subject) {
            // Find courses with this subject first
            const subjectCourses = await Course.find({ subject }).select('_id');
            const subjectCourseIds = subjectCourses.map(c => c._id);

            courseMatch.subject = subject;
            enrollmentMatch.courseId = { $in: subjectCourseIds };
        } else {
            // Only fetch Student/Instructor trends if NO subject filter
            studentTrends = await Student.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]);

            instructorTrends = await Teacher.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]);
        }

        // Course creations over time
        const courseTrends = await Course.aggregate([
            { $match: courseMatch },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Enrollments over time
        const enrollmentTrends = await Enrollment.aggregate([
            { $match: enrollmentMatch },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            students: studentTrends.map(t => ({ date: t._id, count: t.count })),
            instructors: instructorTrends.map(t => ({ date: t._id, count: t.count })),
            courses: courseTrends.map(t => ({ date: t._id, count: t.count })),
            enrollments: enrollmentTrends.map(t => ({ date: t._id, count: t.count }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Subject Distribution - Enrollment counts by subject
exports.getSubjectDistribution = async (req, res) => {
    try {
        const distribution = await Course.aggregate([
            {
                $lookup: {
                    from: 'enrollments',
                    localField: '_id',
                    foreignField: 'courseId',
                    as: 'enrollments'
                }
            },
            {
                $group: {
                    _id: '$subject',
                    courseCount: { $sum: 1 },
                    enrollmentCount: { $sum: { $size: '$enrollments' } },
                    avgRating: { $avg: '$rating' }
                }
            },
            { $sort: { enrollmentCount: -1 } }
        ]);

        res.json(distribution.map(d => ({
            subject: d._id,
            courses: d.courseCount,
            enrollments: d.enrollmentCount,
            averageRating: d.avgRating ? d.avgRating.toFixed(1) : 0
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. Top Courses - Best performing courses by various metrics
exports.getTopCourses = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'enrollments'; // enrollments, rating, completion
        const { subject } = req.query;

        const pipeline = [];

        // 1. Match Stage (Subject Filter)
        if (subject && subject !== 'All') {
            pipeline.push({ $match: { subject: subject } });
        }

        // 2. Lookups and Projections
        pipeline.push(
            {
                $lookup: {
                    from: 'enrollments',
                    localField: '_id',
                    foreignField: 'courseId',
                    as: 'enrollments'
                }
            },
            {
                $lookup: {
                    from: 'teachers',
                    localField: 'teacherId',
                    foreignField: '_id',
                    as: 'teacher'
                }
            },
            { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    title: 1,
                    subject: 1,
                    rating: 1,
                    instructorName: '$teacher.name',
                    totalEnrollments: { $size: '$enrollments' },
                    completedEnrollments: {
                        $size: {
                            $filter: {
                                input: '$enrollments',
                                as: 'e',
                                cond: { $eq: ['$$e.completionStatus', 'completed'] }
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    completionRate: {
                        $cond: [
                            { $gt: ['$totalEnrollments', 0] },
                            { $multiply: [{ $divide: ['$completedEnrollments', '$totalEnrollments'] }, 100] },
                            0
                        ]
                    }
                }
            }
        );

        const courses = await Course.aggregate(pipeline);

        // Sort based on parameter
        if (sortBy === 'rating') {
            courses.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else if (sortBy === 'completion') {
            courses.sort((a, b) => b.completionRate - a.completionRate);
        } else {
            courses.sort((a, b) => b.totalEnrollments - a.totalEnrollments);
        }

        res.json(courses.slice(0, limit));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 5. Instructor Leaderboard - Top instructors by metrics
exports.getInstructorLeaderboard = async (req, res) => {
    try {
        const leaderboard = await Teacher.aggregate([
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
                    courseCount: { $size: '$courses' },
                    totalStudents: { $size: '$enrollments' },
                    completedStudents: {
                        $size: {
                            $filter: {
                                input: '$enrollments',
                                as: 'e',
                                cond: { $eq: ['$$e.completionStatus', 'completed'] }
                            }
                        }
                    },
                    avgRating: { $avg: '$courses.rating' }
                }
            },
            {
                $addFields: {
                    completionRate: {
                        $cond: [
                            { $gt: ['$totalStudents', 0] },
                            { $multiply: [{ $divide: ['$completedStudents', '$totalStudents'] }, 100] },
                            0
                        ]
                    }
                }
            },
            { $sort: { totalStudents: -1 } }
        ]);

        res.json(leaderboard.map(i => ({
            ...i,
            avgRating: i.avgRating ? parseFloat(i.avgRating.toFixed(1)) : 0,
            completionRate: parseFloat(i.completionRate.toFixed(1))
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ===== COURSE ANALYTICS =====

// 6. Course Enrollment Trends - Per course or all courses
exports.getCourseEnrollmentTrends = async (req, res) => {
    try {
        const { courseId } = req.query;
        const days = parseInt(req.query.days) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const matchStage = { createdAt: { $gte: startDate } };
        if (courseId) matchStage.courseId = courseId;

        const trends = await Enrollment.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json(trends.map(t => ({ date: t._id, count: t.count })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 7. Completion Analysis - Breakdown of completion rates
exports.getCompletionAnalysis = async (req, res) => {
    try {
        const analysis = await Enrollment.aggregate([
            {
                $group: {
                    _id: '$completionStatus',
                    count: { $sum: 1 }
                }
            }
        ]);

        const total = analysis.reduce((sum, a) => sum + a.count, 0);

        res.json({
            total,
            breakdown: analysis.map(a => ({
                status: a._id,
                count: a.count,
                percentage: total > 0 ? ((a.count / total) * 100).toFixed(1) : 0
            }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 8. Rating Analysis - Subject-wise and overall rating trends
exports.getRatingAnalysis = async (req, res) => {
    try {
        const bySubject = await Course.aggregate([
            { $match: { rating: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: '$subject',
                    avgRating: { $avg: '$rating' },
                    courseCount: { $sum: 1 }
                }
            },
            { $sort: { avgRating: -1 } }
        ]);

        const overall = await Course.aggregate([
            { $match: { rating: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: '$rating' },
                    totalCourses: { $sum: 1 }
                }
            }
        ]);

        res.json({
            overall: overall[0] || { avgRating: 0, totalCourses: 0 },
            bySubject: bySubject.map(s => ({
                subject: s._id,
                averageRating: parseFloat(s.avgRating.toFixed(1)),
                courses: s.courseCount
            }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 9. Instructor Analytics - Detailed stats for a specific instructor
exports.getInstructorAnalytics = async (req, res) => {
    try {
        let instructorId = new mongoose.Types.ObjectId(req.session.user.id);

        // Allow Admin to view specific instructor
        // Requires session user role to be admin AND instructorId query param
        if (req.session.user.role === 'admin' && req.query.instructorId) {
            instructorId = new mongoose.Types.ObjectId(req.query.instructorId);
        }

        // 1. Overall Stats
        const courses = await Course.find({ teacherId: instructorId });
        const courseIds = courses.map(c => c._id);
        const totalCourses = courses.length;

        const enrollments = await Enrollment.find({ courseId: { $in: courseIds } });
        const totalStudents = enrollments.length;

        const completedStudents = enrollments.filter(e => e.completionStatus === 'completed').length;
        const activeStudents = totalStudents - completedStudents;

        const completionRate = totalStudents > 0 ? ((completedStudents / totalStudents) * 100).toFixed(1) : 0;

        // 2. Subject Distribution
        const subjects = {};
        courses.forEach(c => {
            subjects[c.subject] = (subjects[c.subject] || 0) + 1;
        });
        const subjectDistribution = Object.keys(subjects).map(s => ({ name: s, value: subjects[s] }));

        // 3. Course Performance (Detailed)
        const coursePerformance = await Course.aggregate([
            { $match: { teacherId: instructorId } },
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
                    rating: 1, // Add rating
                    totalEnrollments: { $size: '$enrollments' },
                    avgQuizScore: {
                        $avg: {
                            $reduce: {
                                input: '$enrollments.modules_status',
                                initialValue: [],
                                in: { $concatArrays: ['$$value', '$$this'] }
                            }
                        }
                    },
                    completionRate: {
                        $cond: [
                            { $gt: [{ $size: '$enrollments' }, 0] },
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            {
                                                $size: {
                                                    $filter: {
                                                        input: '$enrollments',
                                                        as: 'e',
                                                        cond: { $eq: ['$$e.completionStatus', 'completed'] }
                                                    }
                                                }
                                            },
                                            { $size: '$enrollments' }
                                        ]
                                    },
                                    100
                                ]
                            },
                            0
                        ]
                    }
                }
            }
        ]);

        // 4. Enrollment Trend (Dynamic Range)
        const days = parseInt(req.query.days) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const enrollmentTrend = await Enrollment.aggregate([
            { $match: { courseId: { $in: courseIds }, createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            overview: {
                totalCourses,
                totalStudents,
                activeStudents,
                completedStudents,
                completionRate: parseFloat(completionRate)
            },
            subjectDistribution,
            coursePerformance: coursePerformance.map(c => ({
                ...c,
                completionRate: parseFloat(c.completionRate.toFixed(1)),
                // Fix avgQuizScore logic which might return array of objects from reduce
                // Actually the previous logic in courseController was better for this.
                // Simplified here: if no quiz scores, it returns null.
            })),
            enrollmentTrend: enrollmentTrend.map(t => ({ date: t._id, count: t.count }))
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 10. Instructor Student Analytics - List of students enrolled in instructor's courses
exports.getInstructorStudentAnalytics = async (req, res) => {
    try {
        const instructorId = new mongoose.Types.ObjectId(req.session.user.id);

        // Find courses taught by this instructor
        const courses = await Course.find({ teacherId: instructorId }, 'title _id');
        const courseIds = courses.map(c => c._id);
        const courseMap = courses.reduce((acc, c) => { acc[c._id.toString()] = c.title; return acc; }, {});

        // Find enrollments
        const enrollments = await Enrollment.find({ courseId: { $in: courseIds } })
            .populate('studentId', 'name email')
            .sort({ updatedAt: -1 });

        // Transform data
        const data = enrollments.map(e => {
            if (!e.studentId) return null; // Skip if student deleted

            const totalModules = e.modules_status ? e.modules_status.length : 0;
            const completedModules = e.modules_status ? e.modules_status.filter(m => m.completed).length : 0;
            // Approximate progress if totalModules is known, else rely on completionStatus
            const progress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : (e.completionStatus === 'completed' ? 100 : 0);

            const quizScores = e.modules_status ? e.modules_status.filter(m => m.quizScore != null).map(m => m.quizScore) : [];
            const avgQuizScore = quizScores.length > 0
                ? (quizScores.reduce((a, b) => a + b, 0) / quizScores.length).toFixed(1)
                : 'N/A';

            return {
                id: e.studentId._id,
                name: e.studentId.name,
                email: e.studentId.email,
                courseName: courseMap[e.courseId.toString()] || 'Unknown Course',
                progress: e.completionStatus === 'completed' ? 100 : progress,
                status: e.completionStatus,
                avgQuizScore,
                lastActive: e.updatedAt
            };
        }).filter(item => item !== null);

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = exports;
