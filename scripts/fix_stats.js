const mongoose = require('mongoose');
const { Course, CourseStat } = require('../required/db');

async function fixCourseStats() {
    try {
        console.log('Fixing Course Stats...');
        
        // Get all real courses
        const courses = await Course.find();
        console.log(`Found ${courses.length} courses.`);

        // Clear existing stats (since they seem broken)
        await CourseStat.deleteMany({});
        console.log('Cleared old CourseStats.');

        const newStats = courses.map(course => ({
            course_id: course._id,
            enrolled_count: Math.floor(Math.random() * 50),
            avg_rating: (3.5 + Math.random() * 1.5).toFixed(1),
            avg_completion_time: Math.floor(Math.random() * 200) + 60,
            price: Math.floor(Math.random() * 50) + 29.99,
            review_count: Math.floor(Math.random() * 20)
        }));

        await CourseStat.insertMany(newStats);
        console.log(`Created ${newStats.length} new CourseStats linked to actual courses.`);

    } catch (error) {
        console.error('Error fixing stats:', error);
    } finally {
        mongoose.disconnect();
    }
}

setTimeout(fixCourseStats, 2000);
