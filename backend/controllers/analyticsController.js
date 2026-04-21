const mongoose = require('mongoose');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Transaction = require('../models/Transaction');
const EnrollmentAnalytics = require('../models/EnrollmentAnalytics'); 
const PLATFORM_FEE_RATE = 0.2;

const getDateMatch = (req) => {
    const { startDate, endDate, days } = req.query;
    const match = {};

    if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) match.createdAt.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            match.createdAt.$lte = end;
        }
        return match;
    }

    const d = parseInt(days, 10) || 30;
    const from = new Date();
    from.setDate(from.getDate() - d);
    match.createdAt = { $gte: from };
    return match;
};

const getGroupDateExpression = (groupBy) => {
    if (groupBy === 'month') return { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    if (groupBy === 'year') return { $dateToString: { format: '%Y', date: '$createdAt' } };
    return { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
};

// ===== ADMIN ANALYTICS =====

exports.getOverallTimeAnalytics = async (req, res) => {
  console.time("DB_Analytics_OverallTime");
  try {
    const overallTimes = await EnrollmentAnalytics.aggregate([
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            courseId: "$courseId",
          },
          dayWisePrice: { $sum: "$price" },
          numberOfEnrollments: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          courseId: "$_id.courseId",
          dayWisePrice: 1,
          numberOfEnrollments: 1,
        },
      },
      {
        $sort: { date: 1 },
      },
    ]);
    console.timeEnd("DB_Analytics_OverallTime");

    if (overallTimes.length === 0) return res.json([]);

    const uniqueCourseIds = [...new Set(overallTimes.map(item => item.courseId.toString()))];
    const courses = await Course.find({ _id: { $in: uniqueCourseIds } }).select("title").lean();

    const courseTitleMap = {};
    courses.forEach(course => {
      courseTitleMap[course._id.toString()] = course.title;
    });

    const enrichedAnalytics = overallTimes.map(record => ({
      date: record.date,
      courseId: record.courseId,
      courseName: courseTitleMap[record.courseId.toString()] || "Unknown Course",
      dayWisePrice: record.dayWisePrice,
      numberOfEnrollments: record.numberOfEnrollments,
    }));

    res.json(enrichedAnalytics);
  } catch (err) {
    console.timeEnd("DB_Analytics_OverallTime");
    console.error("Overall Analytics Error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getCourseTimeAnalytics = async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ message: "courseId is required" });

    const courseTimes = await EnrollmentAnalytics.aggregate([
      {
        $match: { courseId: new mongoose.Types.ObjectId(courseId) },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          dayWisePrice: { $sum: "$price" },
          numberOfEnrollments: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          dayWisePrice: 1,
          numberOfEnrollments: 1,
        },
      },
      {
        $sort: { date: 1 },
      },
    ]);

    res.json(courseTimes);
  } catch (err) {
    console.error("Analytics Aggregation Error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAdminOverview = async (req, res) => {
    console.time("DB_Analytics_Overview");
    try {
        const [totalStudents, totalInstructors, totalCourses, totalEnrollments, completedEnrollments] = await Promise.all([
            Student.countDocuments(),
            Teacher.countDocuments(),
            Course.countDocuments(),
            Enrollment.countDocuments(),
            Enrollment.countDocuments({ completionStatus: 'completed' })
        ]);

        const last30d = new Date();
        last30d.setDate(last30d.getDate() - 30);

        const [newStudents, newInstructors, newCourses, newEnrollments, newCompletedEnrollments] = await Promise.all([
            Student.countDocuments({ createdAt: { $gte: last30d } }),
            Teacher.countDocuments({ createdAt: { $gte: last30d } }),
            Course.countDocuments({ createdAt: { $gte: last30d } }),
            Enrollment.countDocuments({ createdAt: { $gte: last30d } }),
            Enrollment.countDocuments({ completionStatus: 'completed', updatedAt: { $gte: last30d } })
        ]);
        console.timeEnd("DB_Analytics_Overview");

        const completionRate = totalEnrollments > 0 ? parseFloat(((completedEnrollments / totalEnrollments) * 100).toFixed(1)) : 0;
        const prevEnrollments = totalEnrollments - newEnrollments;
        const prevCompleted = completedEnrollments - newCompletedEnrollments;
        const prevCompletionRate = prevEnrollments > 0 ? parseFloat(((prevCompleted / prevEnrollments) * 100).toFixed(1)) : 0;

        res.json({
            totalStudents,
            totalInstructors,
            totalCourses,
            totalEnrollments,
            completedEnrollments,
            completionRate,
            growth: {
                students: newStudents, 
                instructors: newInstructors,
                courses: newCourses,
                enrollments: newEnrollments,
                completionRate: parseFloat((completionRate - prevCompletionRate).toFixed(1))
            }
        });
    } catch (err) {
        console.timeEnd("DB_Analytics_Overview");
        res.status(500).json({ error: err.message });
    }
};

exports.getRevenueOverview = async (req, res) => {
    try {
        const matchStage = getDateMatch(req);
        const overviewArr = await Transaction.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalTransactions: { $sum: 1 },
                    paidTransactions: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
                    refundedTransactions: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] } },
                    failedTransactions: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
                    grossRevenue: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
                    refundedAmount: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, '$amount', 0] } },
                }
            }
        ]);

        const data = overviewArr[0] || {
            totalTransactions: 0, paidTransactions: 0, refundedTransactions: 0, failedTransactions: 0, grossRevenue: 0, refundedAmount: 0
        };

        res.json({
            ...data,
            platformProfit: parseFloat(((data.grossRevenue - data.refundedAmount) * PLATFORM_FEE_RATE).toFixed(2)),
            netRevenue: parseFloat((data.grossRevenue - data.refundedAmount).toFixed(2)),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRevenueTrend = async (req, res) => {
    console.time("DB_Analytics_RevenueTrend");
    try {
        const matchStage = getDateMatch(req);
        const { groupBy = 'day' } = req.query;

        const trend = await Transaction.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: getGroupDateExpression(groupBy),
                    count: { $sum: 1 },
                    grossRevenue: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
                    refundedAmount: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, '$amount', 0] } },
                }
            },
            { $sort: { _id: 1 } }
        ]);
        console.timeEnd("DB_Analytics_RevenueTrend");

        res.json(trend.map((t) => ({
            date: t._id,
            transactions: t.count,
            grossRevenue: parseFloat((t.grossRevenue || 0).toFixed(2)),
            refundedAmount: parseFloat((t.refundedAmount || 0).toFixed(2)),
            netRevenue: parseFloat(((t.grossRevenue || 0) - (t.refundedAmount || 0)).toFixed(2)),
            platformProfit: parseFloat((((t.grossRevenue || 0) - (t.refundedAmount || 0)) * PLATFORM_FEE_RATE).toFixed(2)),
        })));
    } catch (err) {
        console.timeEnd("DB_Analytics_RevenueTrend");
        res.status(500).json({ error: err.message });
    }
};

exports.getTransactionStatusDistribution = async (req, res) => {
    try {
        const stats = await Transaction.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    amount: { $sum: '$amount' },
                }
            },
            { $sort: { count: -1 } }
        ]);
        res.json(stats.map((s) => ({
            status: s._id || 'unknown',
            count: s.count,
            amount: parseFloat((s.amount || 0).toFixed(2)),
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRevenueByTeacher = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const matchStage = getDateMatch(req);
        const leaderboard = await Transaction.aggregate([
            { $match: matchStage },
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
                $group: {
                    _id: '$teacherId',
                    teacherName: { $first: '$teacher.name' },
                    teacherEmail: { $first: '$teacher.email' },
                    totalTransactions: { $sum: 1 },
                    paidRevenue: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
                    refundedAmount: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, '$amount', 0] } },
                }
            },
            {
                $addFields: {
                    netRevenue: { $subtract: ['$paidRevenue', '$refundedAmount'] },
                }
            },
            { $sort: { netRevenue: -1 } },
            { $limit: limit }
        ]);

        res.json(leaderboard.map((t) => ({
            teacherId: t._id,
            teacherName: t.teacherName || 'N/A',
            teacherEmail: t.teacherEmail || 'N/A',
            totalTransactions: t.totalTransactions,
            paidRevenue: parseFloat((t.paidRevenue || 0).toFixed(2)),
            refundedAmount: parseFloat((t.refundedAmount || 0).toFixed(2)),
            netRevenue: parseFloat((t.netRevenue || 0).toFixed(2)),
            platformProfit: parseFloat(((t.netRevenue || 0) * PLATFORM_FEE_RATE).toFixed(2)),
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRevenueByStudent = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const matchStage = getDateMatch(req);
        const data = await Transaction.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: 'students',
                    localField: 'studentId',
                    foreignField: '_id',
                    as: 'student'
                }
            },
            { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$studentId',
                    studentName: { $first: '$student.name' },
                    studentEmail: { $first: '$student.email' },
                    totalTransactions: { $sum: 1 },
                    paidRevenue: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
                    refundedAmount: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, '$amount', 0] } },
                }
            },
            { $addFields: { netRevenue: { $subtract: ['$paidRevenue', '$refundedAmount'] } } },
            { $sort: { netRevenue: -1 } },
            { $limit: limit }
        ]);

        res.json(data.map((s) => ({
            studentId: s._id,
            studentName: s.studentName || 'N/A',
            studentEmail: s.studentEmail || 'N/A',
            totalTransactions: s.totalTransactions,
            paidRevenue: parseFloat((s.paidRevenue || 0).toFixed(2)),
            refundedAmount: parseFloat((s.refundedAmount || 0).toFixed(2)),
            netRevenue: parseFloat((s.netRevenue || 0).toFixed(2)),
            platformProfit: parseFloat(((s.netRevenue || 0) * PLATFORM_FEE_RATE).toFixed(2)),
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRevenueByCourse = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const matchStage = getDateMatch(req);
        const data = await Transaction.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'courseId',
                    foreignField: '_id',
                    as: 'course'
                }
            },
            { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$courseId',
                    courseTitle: { $first: '$course.title' },
                    subject: { $first: '$course.subject' },
                    totalTransactions: { $sum: 1 },
                    paidRevenue: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
                    refundedAmount: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, '$amount', 0] } },
                }
            },
            { $addFields: { netRevenue: { $subtract: ['$paidRevenue', '$refundedAmount'] } } },
            { $sort: { netRevenue: -1 } },
            { $limit: limit }
        ]);

        res.json(data.map((c) => ({
            courseId: c._id,
            courseTitle: c.courseTitle || 'N/A',
            subject: c.subject || 'N/A',
            totalTransactions: c.totalTransactions,
            paidRevenue: parseFloat((c.paidRevenue || 0).toFixed(2)),
            refundedAmount: parseFloat((c.refundedAmount || 0).toFixed(2)),
            netRevenue: parseFloat((c.netRevenue || 0).toFixed(2)),
            platformProfit: parseFloat(((c.netRevenue || 0) * PLATFORM_FEE_RATE).toFixed(2)),
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getGrowthTrends = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const { subject } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        let courseMatch = { createdAt: { $gte: startDate } };
        let enrollmentMatch = { createdAt: { $gte: startDate } };
        let studentTrends = [];
        let instructorTrends = [];

        if (subject) {
            const subjectCourses = await Course.find({ subject }).select('_id').lean();
            const subjectCourseIds = subjectCourses.map(c => c._id);
            courseMatch.subject = subject;
            enrollmentMatch.courseId = { $in: subjectCourseIds };
        } else {
            [studentTrends, instructorTrends] = await Promise.all([
                Student.aggregate([
                    { $match: { createdAt: { $gte: startDate } } },
                    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
                    { $sort: { _id: 1 } }
                ]),
                Teacher.aggregate([
                    { $match: { createdAt: { $gte: startDate } } },
                    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
                    { $sort: { _id: 1 } }
                ])
            ]);
        }

        const [courseTrends, enrollmentTrends] = await Promise.all([
            Course.aggregate([
                { $match: courseMatch },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            Enrollment.aggregate([
                { $match: enrollmentMatch },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ])
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

exports.getTopCourses = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'enrollments'; 
        const { subject } = req.query;
        const pipeline = [];

        if (subject && subject !== 'All') {
            pipeline.push({ $match: { subject: subject } });
        }

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
            }
        );

        const courses = await Course.aggregate(pipeline);

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

exports.getInstructorAnalytics = async (req, res) => {
    try {
        let instructorId = new mongoose.Types.ObjectId(req.session.user.id);
        if (req.session.user.role === 'admin' && req.query.instructorId) {
            instructorId = new mongoose.Types.ObjectId(req.query.instructorId);
        }

        const courses = await Course.find({ teacherId: instructorId }).lean();
        const courseIds = courses.map(c => c._id);
        const totalCourses = courses.length;
        const enrollmentsArr = await Enrollment.find({ courseId: { $in: courseIds } }).lean();
        const totalStudents = enrollmentsArr.length;
        const completedStudents = enrollmentsArr.filter(e => e.completionStatus === 'completed').length;
        const activeStudents = totalStudents - completedStudents;
        const completionRate = totalStudents > 0 ? ((completedStudents / totalStudents) * 100).toFixed(1) : 0;

        const subjects = {};
        courses.forEach(c => { subjects[c.subject] = (subjects[c.subject] || 0) + 1; });
        const subjectDistribution = Object.keys(subjects).map(s => ({ name: s, value: subjects[s] }));

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
                    rating: 1, 
                    totalEnrollments: { $size: '$enrollments' },
                    avgQuizScore: {
                        $avg: {
                            $reduce: {
                                input: '$enrollments.modules_status',
                                initialValue: [],
                                in: { $concatArrays: ['$$value', '$$this'] }
                            }
                        }
                    }
                }
            }
        ]);

        res.json({
            summary: {
                totalCourses,
                totalStudents,
                activeStudents,
                completedStudents,
                completionRate
            },
            subjectDistribution,
            coursePerformance
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getInstructorStudentAnalytics = async (req, res) => {
    try {
        let instructorId = new mongoose.Types.ObjectId(req.session.user.id);
        if (req.session.user.role === 'admin' && req.query.instructorId) {
            instructorId = new mongoose.Types.ObjectId(req.query.instructorId);
        }
        const courses = await Course.find({ teacherId: instructorId }, 'title _id').lean();
        const courseIds = courses.map(c => c._id);
        const courseMap = courses.reduce((acc, c) => { acc[c._id.toString()] = c.title; return acc; }, {});

        const enrollments = await Enrollment.find({ courseId: { $in: courseIds } })
            .populate('studentId', 'name email')
            .sort({ updatedAt: -1 })
            .lean();

        const data = enrollments.map(e => {
            if (!e.studentId) return null;
            const totalModules = e.modules_status ? e.modules_status.length : 0;
            const completedModules = e.modules_status ? e.modules_status.filter(m => m.completed).length : 0;
            const progress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : (e.completionStatus === 'completed' ? 100 : 0);
            const quizScores = e.modules_status ? e.modules_status.filter(m => m.quizScore != null).map(m => m.quizScore) : [];
            const avgQuizScore = quizScores.length > 0 ? (quizScores.reduce((a, b) => a + b, 0) / quizScores.length).toFixed(1) : 'N/A';

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
