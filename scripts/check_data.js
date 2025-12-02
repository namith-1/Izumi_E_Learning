const mongoose = require('mongoose');
const { Enrollment, CourseStat, Student, Course } = require('../required/db');

async function checkData() {
    try {
        console.log('Checking database...');
        
        const enrollmentCount = await Enrollment.countDocuments();
        console.log(`Enrollments count: ${enrollmentCount}`);
        
        const enrollments = await Enrollment.find().limit(5).populate('student_id').populate('course_id');
        console.log('Sample Enrollments:', JSON.stringify(enrollments, null, 2));

        const courseStatCount = await CourseStat.countDocuments();
        console.log(`CourseStat count: ${courseStatCount}`);
        
        const courseStats = await CourseStat.find().limit(5);
        console.log('Sample CourseStats:', JSON.stringify(courseStats, null, 2));

    } catch (error) {
        console.error('Error checking data:', error);
    } finally {
        mongoose.disconnect();
    }
}

// Wait for connection
setTimeout(checkData, 2000);
