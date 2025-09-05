const mongoose = require('mongoose');

// Connection URI (replace with your MongoDB connection string)
const uri = 'mongodb://localhost:27017/izumi3'; // Replace with your actual URI

mongoose.connect(uri)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// Define Schemas (this is where Mongoose comes in)
const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contact: { type: String, required: true },
    address: { type: String, required: true },
    hashed_password: { type: String, required: true },
    is_deleted: { type: Number, default: 0 } //  MongoDB doesn't have direct INTEGER, using Number
});

const instructorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contact: { type: String, required: true },
    address: { type: String, required: true },
    hashed_password: { type: String, required: true },
    is_deleted: { type: Number, default: 0 }
});

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    instructor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Instructor' }, // Reference to Instructor
    subject: { type: String }
});

const enrollmentSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }, // Reference to Student
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, // Reference to Course
    //   No direct UNIQUE constraint in Mongoose schema, handled in code
});

const magazineSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    image_url: { type: String },
    content_url: { type: String }
});

// const magazineSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   image: { type: String, required: true }, // image URL
//   url:   { type: String, required: true }  // external magazine link
// });

const courseStatsSchema = new mongoose.Schema({
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', unique: true }, // One-to-one with Course
    enrolled_count: { type: Number, default: 0 },
    avg_rating: { type: Number, default: 0 },
    avg_completion_time: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    review_count: { type: Number, default: 0 }
});

const moduleSchema = new mongoose.Schema({
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', default: null },
    title: { type: String, required: true },
    text: { type: String, default: '' },
    url: { type: String, default: '' }
});

const studentModuleSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    module_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    is_completed: { type: Number, default: 0 },
    //   No direct composite primary key, handled in code
});

const commentSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // Assuming you'll have a User model
    video_id: { type: String },
    parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    content: { type: String },
    created_at: { type: Date, default: Date.now }
});

const commentVoteSchema = new mongoose.Schema({
    comment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vote: { type: Number },
    //  No direct composite unique key
});

// Create Models
const Student = mongoose.model('Student', studentSchema);
const Instructor = mongoose.model('Instructor', instructorSchema);
const Course = mongoose.model('Course', courseSchema);
const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
const Magazine = mongoose.model('Magazine', magazineSchema);
const CourseStat = mongoose.model('CourseStat', courseStatsSchema);
const Module = mongoose.model('Module', moduleSchema);
const StudentModule = mongoose.model('StudentModule', studentModuleSchema);
const Comment = mongoose.model('Comment', commentSchema);
const CommentVote = mongoose.model('CommentVote', commentVoteSchema);

//  Insert Initial Data (using Mongoose methods)
async function seedData() {
    try {
 
        // Insert Students
        const students = await Student.insertMany([
            { name: 'Alice Johnson', email: 'alice@example.com', contact: '1234567890', address: '123 Maple St', hashed_password: '$2b$10$YJk0aMop./9x.FpyJ47IBerV7nMDJtfTg0NHrDL0gSqG/E5Gce.Ma', is_deleted: 0 },
            { name: 'Bob Smith', email: 'bob@example.com', contact: '0987654321', address: '456 Oak St', hashed_password: 'hashed_pw_2', is_deleted: 0 },
            { name: 'Charlie Brown', email: 'charlie@example.com', contact: '1122334455', address: '789 Pine St', hashed_password: 'hashed_pw_3', is_deleted: 0 }
        ]);
        console.log('Inserted initial students');

        // Insert Instructors
        const instructors = await Instructor.insertMany([
            { name: 'Prof. David White', email: 'david@example.com', contact: '5566778899', address: '654 Cedar St', hashed_password: 'hashed_pw_5', is_deleted: 0 },
            { name: 'Dr. Emily Green', email: 'emily@example.com', contact: '9988776655', address: '321 Elm St', hashed_password: 'hashed_pw_6', is_deleted: 0 }
        ]);
        console.log('Inserted initial instructors');

        // Insert Courses
        const courses = await Course.insertMany([
            { title: 'Introduction to Programming', instructor_id: instructors[0]._id, subject: 'Computer Science' },
            { title: 'Calculus I', instructor_id: instructors[1]._id, subject: 'Mathematics' },
            { title: 'Web Development Basics', instructor_id: instructors[0]._id, subject: 'Computer Science' },
            { title: 'Linear Algebra', instructor_id: instructors[1]._id, subject: 'Mathematics' },
            { title: 'Data Structures and Algorithms', instructor_id: instructors[0]._id, subject: 'Computer Science' }
        ]);
        console.log('Inserted initial courses');

        // Insert Enrollments
        await Enrollment.insertMany([
            { student_id: students[0]._id, course_id: courses[0]._id },
            { student_id: students[1]._id, course_id: courses[0]._id },
            { student_id: students[1]._id, course_id: courses[1]._id },
            { student_id: students[2]._id, course_id: courses[2]._id },
            { student_id: students[0]._id, course_id: courses[3]._id },
            { student_id: students[2]._id, course_id: courses[4]._id }
        ]);
        console.log('Inserted initial enrollments');

        // Insert Magazines
        await Magazine.insertMany([
            { title: 'Tech Monthly', description: 'Latest tech trends.', image_url: 'https://c0.wallpaperflare.com/preview/483/913/258/advanced-ai-anatomy-artificial.jpg', content_url: 'https://tech.example.com' },
            { title: 'Science Today', description: 'Discoveries in science.', image_url: 'https://wallpapers.com/images/high/futuristic-global-network-with-glowing-connections-6my9d3o2gl8rencj.webp', content_url: 'https://science.example.com' }
        ]);
        console.log('Inserted initial magazines');

        // Insert Course Stats
        await CourseStat.insertMany([
            { course_id: courses[0]._id, enrolled_count: 2, avg_rating: 4.5, avg_completion_time: 120, price: 49.99, review_count: 10 },
            { course_id: courses[1]._id, enrolled_count: 1, avg_rating: 4.8, avg_completion_time: 180, price: 59.99, review_count: 5 },
            { course_id: courses[2]._id, enrolled_count: 1, avg_rating: 4.2, avg_completion_time: 90, price: 39.99, review_count: 8 },
            { course_id: courses[3]._id, enrolled_count: 1, avg_rating: 4.9, avg_completion_time: 150, price: 69.99, review_count: 12 },
            { course_id: courses[4]._id, enrolled_count: 1, avg_rating: 4.0, avg_completion_time: 210, price: 79.99, review_count: 7 }
        ]);
        console.log('Inserted initial course stats');


     

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        // mongoose.disconnect(); // Disconnect after seeding if you don't need the connection open
    }
}

seedData(); // Call the function to insert data

module.exports = {
    Student,
    Instructor,
    Course,
    Enrollment,
    Magazine,
    CourseStat,
    Module,
    StudentModule,
    Comment,
    CommentVote
};