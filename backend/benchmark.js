const mongoose = require('mongoose');
const dotenv = require('dotenv');

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');
const Teacher = require('./models/Teacher');
const Student = require('./models/Student');
const Transaction = require('./models/Transaction');
const EnrollmentAnalytics = require('./models/EnrollmentAnalytics');

async function benchmark() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas...');

    const queries = [
      {
        name: 'getAllCourses (Catalog)',
        op: () => Course.aggregate([
          { $match: { $or: [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false } }] } },
          { $lookup: { from: "teachers", localField: "teacherId", foreignField: "_id", as: "teacherDetails" } },
          { $unwind: "$teacherDetails" },
          { $project: { _id: 1, title: 1, instructorName: "$teacherDetails.name" } }
        ])
      },
      {
        name: 'getAdminOverview (Counts)',
        op: () => Promise.all([
          Student.countDocuments(),
          Teacher.countDocuments(),
          Course.countDocuments(),
          Enrollment.countDocuments()
        ])
      },
      {
        name: 'getInstructorLeaderboard',
        op: () => Teacher.aggregate([
          { $lookup: { from: 'courses', localField: '_id', foreignField: 'teacherId', as: 'courses' } },
          { $lookup: { from: 'enrollments', localField: 'courses._id', foreignField: 'courseId', as: 'enrollments' } },
          { $project: { name: 1, totalStudents: { $size: '$enrollments' } } },
          { $sort: { totalStudents: -1 } }
        ])
      },
      {
        name: 'getRevenueTrend (Last 30 Days)',
        op: () => Transaction.find({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }).sort({ createdAt: 1 })
      },
      {
        name: 'getUserSearch (Text Index)',
        op: () => Course.find({ $text: { $search: "programming" } }).limit(5)
      }
    ];

    console.log('\n==========================================');
    console.log('   IZUMI DATABASE PERFORMANCE REPORT      ');
    console.log('==========================================\n');

    for (const query of queries) {
      const start = Date.now();
      const result = await query.op();
      const duration = Date.now() - start;
      
      let indexStatus = 'Unknown';
      try {
        const queryObj = query.op();
        if (queryObj && typeof queryObj.explain === 'function') {
          const explain = await queryObj.explain('executionStats');
          const winningPlan = explain.queryPlanner.winningPlan;
          
          const checkCollscan = (plan) => {
            if (plan.stage === 'COLLSCAN') return true;
            if (plan.inputStage) return checkCollscan(plan.inputStage);
            if (plan.inputStages) return plan.inputStages.some(checkCollscan);
            return false;
          };
          
          indexStatus = checkCollscan(winningPlan) ? '⚠️ COLLSCAN' : '✅ IXSCAN';
        } else {
          indexStatus = 'ℹ️ Simple Op';
        }
      } catch (e) {
        indexStatus = 'ℹ️ Parallel Op';
      }

      console.log(`Endpoint: ${query.name.padEnd(30)} | Time: ${String(duration).padStart(4)}ms | Plan: ${indexStatus}`);
    }

    console.log('\n==========================================');
  } catch (err) {
    console.error('Benchmark error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

benchmark();
