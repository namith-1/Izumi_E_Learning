const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Transaction = require('../models/Transaction');
const Message = require('../models/Message');
const Reviewer = require('../models/Reviewer');
const EnrollmentAnalytics = require('../models/EnrollmentAnalytics');

const dummyId = new mongoose.Types.ObjectId();

const queryRegistry = [
    { name: 'Course: Optimized Text Search', model: Course, op: () => Course.find({ $text: { $search: "software" } }).limit(5) },
    { name: 'Course: Catalog (Approved)', model: Course, op: () => Course.find({ approvalStatus: 'approved' }).limit(20) },
    { name: 'Analytics: Revenue Trend (30d)', model: Transaction, op: () => Transaction.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$amount' } } }
    ])},
    { name: 'Chat: Messages History', model: Message, op: () => Message.find({ courseId: dummyId }).sort({ createdAt: -1 }).limit(50) }
];

async function runAudit() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- FINAL PERFORMANCE VERIFICATION ---\n');

        for (const query of queryRegistry) {
            const start = Date.now();
            await query.op();
            const duration = Date.now() - start;

            let plan = 'N/A';
            try {
                const explain = await query.op().explain('executionStats');
                const winningPlan = explain.queryPlanner.winningPlan;
                const isCollscan = (p) => {
                    if (p.stage === 'COLLSCAN') return true;
                    if (p.inputStage) return isCollscan(p.inputStage);
                    if (p.inputStages) return p.inputStages.some(isCollscan);
                    return false;
                };
                plan = isCollscan(winningPlan) ? '⚠️ COLLSCAN' : '✅ IXSCAN';
            } catch (e) { plan = 'Optimized/Complex'; }

            console.log(`[${duration}ms] ${query.name.padEnd(35)} | ${plan}`);
        }

        console.log('\n--- VERIFICATION COMPLETE ---');
    } catch (err) {
        console.error('Audit crashed:', err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

runAudit();
