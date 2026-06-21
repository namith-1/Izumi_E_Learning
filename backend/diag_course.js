const mongoose = require('mongoose');
require('dotenv').config();

// Define a minimal Course schema
const CourseSchema = new mongoose.Schema({
    title: String,
    modules: mongoose.Schema.Types.Mixed,
    rootModule: mongoose.Schema.Types.Mixed
}, { collection: 'courses' });

const Course = mongoose.model('Course', CourseSchema);

async function checkCourse(courseId) {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');
        
        const course = await Course.findById(courseId).lean();
        if (!course) {
            console.log('Course not found');
            return;
        }
        
        console.log('Course Title:', course.title);
        console.log('Root Module:', JSON.stringify(course.rootModule, null, 2));
        
        const modules = course.modules || {};
        console.log('Number of modules in Map:', Object.keys(modules).length);
        console.log('Module IDs:', Object.keys(modules));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

const id = '6980aee5a866f36f4a4382aa';
checkCourse(id);
