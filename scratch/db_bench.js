const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const Course = require('../backend/models/Course');
const Enrollment = require('../backend/models/Enrollment');
const Teacher = require('../backend/models/Teacher');
const Student = require('../backend/models/Student');
const Transaction = require('../backend/models/Transaction');
const EnrollmentAnalytics = require('../backend/models/EnrollmentAnalytics');

async function benchmark() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas...');

    const queries = [
      {
        name: 'getAllCourses (Student Catalog)',
        op: () => Course.aggregate([
          { $match: { $or: [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false } }] } },
          { $lookup: { from: "teachers", localField: "teacherId", foreignField: "_id", as: "teacherDetails" } },
          { $unwind: "$teacherDetails" },
          { $project: { _id: 1, title: 1, instructorName: "$teacherDetails.name" } }
        ])
      },
      {
        name: 'getAdminOverview (Dashboard)',
        op: () => Promise.all([
          Student.countDocuments(),
          Teacher.countDocuments(),
          Course.countDocuments(),
          Enrollment.countDocuments()
        ])
      },
      {
        name: 'getRevenueOverview (Financials)',
        op: () => Transaction.aggregate([
          { $group: { _id: null, gross: { $sum: '$amount' }, count: { $sum: 1 } } }
        ])
      },
      {
        name: 'getTopCourses (Analytics)',
        op: () => Course.aggregate([
          { $lookup: { from: 'enrollments', localField: '_id', foreignField: 'courseId', as: 'enrollments' } },
          { $project: { title: 1, totalEnrollments: { $size: '$enrollments' } } },
          { $sort: { totalEnrollments: -1 } },
          { $limit: 10 }
        ])
      }
    ];

    console.log('\n--- REAL-TIME QUERY PERFORMANCE REPORT ---\n');

    for (const query of queries) {
      const start = Date.now();
      const result = await query.op();
      const duration = Date.now() - start;
      
      // Attempt to get explain plan for aggregations/finds
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
          
          indexStatus = checkCollscan(winningPlan) ? '⚠️ COLLSCAN (Slow)' : '✅ IXSCAN (Optimized)';
        } else {
          indexStatus = 'ℹ️ Simple Count/Op (Fast)';
        }
      } catch (e) {
        // Not a query object that supports explain (like Promise.all)
        indexStatus = 'ℹ️ Multi-Query Op';
      }

      console.log(`Endpoint Type: ${query.name}`);
      console.log(`Response Time: ${duration}ms`);
      console.log(`Database Plan: ${indexStatus}`);
      console.log('------------------------------------------');
    }

    console.log('\nBenchmarking complete.');
  } catch (err) {
    console.error('Benchmark error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

benchmark();
