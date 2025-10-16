const mongoose = require("mongoose");
require("dotenv").config(); // Load .env first

// Use Atlas if available, else fallback to local MongoDB
const uri = process.env.MONGO_URI || "mongodb://localhost:27017/izumi3";

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    // Detect if using Atlas or local
    if (uri.startsWith("mongodb+srv://")) {
      console.log("✅ Connected to MongoDB Atlas cluster successfully");
    } else {
      console.log("✅ Connected to local MongoDB database successfully");
    }
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

// Define Schemas (this is where Mongoose comes in)
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contact: { type: String, required: true },
  address: { type: String, required: true },
  hashed_password: { type: String, required: true },
  is_deleted: { type: Number, default: 0 }, //  MongoDB doesn't have direct INTEGER, using Number
});

const instructorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contact: { type: String, required: true },
  address: { type: String, required: true },
  hashed_password: { type: String, required: true },
  is_deleted: { type: Number, default: 0 },
  bio: { type: String, default: "" },
  avatarUrl: { type: String, default: "/images/default-avatar.png" },
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  instructor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor" }, // Reference to Instructor
  subject: { type: String },
  overview: { type: String, default: "" },
  tagline: { type: String, default: "" },
  whatYouWillLearn: { type: [String], default: [] },
});

//schema

const enrollmentSchema = new mongoose.Schema(
  {
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    date_enrolled: { type: Date, default: Date.now },
  },
  { timestamps: true }
); // added timestamps for createdAt and updatedAt

//
const magazineSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image_url: { type: String },
  content_url: { type: String },
});

// const magazineSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   image: { type: String, required: true }, // image URL
//   url:   { type: String, required: true }  // external magazine link
// });

const courseStatsSchema = new mongoose.Schema({
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    unique: true,
  }, // One-to-one with Course
  enrolled_count: { type: Number, default: 0 },
  avg_rating: { type: Number, default: 0 },
  avg_completion_time: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  review_count: { type: Number, default: 0 },
});

const moduleSchema = new mongoose.Schema({
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Module",
    default: null,
  },
  title: { type: String, required: true },
  text: { type: String, default: "" },
  url: { type: String, default: "" },
});

const studentModuleSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  module_id: { type: mongoose.Schema.Types.ObjectId, ref: "Module" },
  is_completed: { type: Number, default: 0 },
  //   No direct composite primary key, handled in code
});

const commentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Assuming you'll have a User model
  video_id: { type: String },
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    default: null,
  },
  content: { type: String },
  created_at: { type: Date, default: Date.now },
});

const commentVoteSchema = new mongoose.Schema({
  comment_id: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  vote: { type: Number },
  //  No direct composite unique key
});

// Create Models
const Student = mongoose.model("Student", studentSchema);
const Instructor = mongoose.model("Instructor", instructorSchema);
const Course = mongoose.model("Course", courseSchema);
const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
const Magazine = mongoose.model("Magazine", magazineSchema);
const CourseStat = mongoose.model("CourseStat", courseStatsSchema);
const Module = mongoose.model("Module", moduleSchema);
const StudentModule = mongoose.model("StudentModule", studentModuleSchema);
const Comment = mongoose.model("Comment", commentSchema);
const CommentVote = mongoose.model("CommentVote", commentVoteSchema);

//  Insert Initial Data (using Mongoose methods)
async function seedData() {
  try {
    // Insert Students
    const students = await Student.insertMany([
      {
        name: "Alice Johnson",
        email: "alice@example.com",
        contact: "1234567890",
        address: "123 Maple St",
        hashed_password:
          "$2b$10$YJk0aMop./9x.FpyJ47IBerV7nMDJtfTg0NHrDL0gSqG/E5Gce.Ma",
        is_deleted: 0,
      },
      {
        name: "Bob Smith",
        email: "bob@example.com",
        contact: "0987654321",
        address: "456 Oak St",
        hashed_password: "hashed_pw_2",
        is_deleted: 0,
      },
      {
        name: "Charlie Brown",
        email: "charlie@example.com",
        contact: "1122334455",
        address: "789 Pine St",
        hashed_password: "hashed_pw_3",
        is_deleted: 0,
      },
    ]);
    console.log("Inserted initial students");

    // Insert Instructors
    const instructors = await Instructor.insertMany([
      {
        name: "Prof. David White",
        email: "david@example.com",
        contact: "5566778899",
        address: "654 Cedar St",
        hashed_password: "hashed_pw_5",
        is_deleted: 0,
      },
      {
        name: "Dr. Emily Green",
        email: "emily@example.com",
        contact: "9988776655",
        address: "321 Elm St",
        hashed_password: "hashed_pw_6",
        is_deleted: 0,
      },
    ]);
    console.log("Inserted initial instructors");

    // Insert Courses
    const courses = await Course.insertMany([
      {
        title: "Introduction to Programming",
        instructor_id: instructors[0]._id,
        subject: "Computer Science",
      },
      {
        title: "Calculus I",
        instructor_id: instructors[1]._id,
        subject: "Mathematics",
      },
      {
        title: "Web Development Basics",
        instructor_id: instructors[0]._id,
        subject: "Computer Science",
      },
      {
        title: "Linear Algebra",
        instructor_id: instructors[1]._id,
        subject: "Mathematics",
      },
      {
        title: "Data Structures and Algorithms",
        instructor_id: instructors[0]._id,
        subject: "Computer Science",
      },
    ]);
    console.log("Inserted initial courses");

    // Insert Enrollments
    await Enrollment.insertMany([
      { student_id: students[0]._id, course_id: courses[0]._id },
      { student_id: students[1]._id, course_id: courses[0]._id },
      { student_id: students[1]._id, course_id: courses[1]._id },
      { student_id: students[2]._id, course_id: courses[2]._id },
      { student_id: students[0]._id, course_id: courses[3]._id },
      { student_id: students[2]._id, course_id: courses[4]._id },
    ]);
    console.log("Inserted initial enrollments");

    // Insert Tech Magazines - Updated with ML, NLP, Bash Scripting, and CI/CD topics
    await Magazine.insertMany([
      {
        title: "AI Magazine - Machine Learning & Deep Learning",
        description: "The world's leading bi-monthly AI magazine covering ML, deep learning, neural networks, and AI applications. Features insights on AI strategy, emerging trends, and real-world implementations.",
        image_url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
        content_url: "https://aimagazine.com/",
      },
      {
        title: "Quanta Magazine - Machine Learning Research",
        description: "Explore cutting-edge machine learning research, from cellular automata to world models. Covers AI experiments, emergent behaviors, and the future of artificial intelligence.",
        image_url: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80",
        content_url: "https://www.quantamagazine.org/tag/machine-learning/",
      },
      {
        title: "Natural Language Processing Journal",
        description: "Open access journal advancing trustworthy, interpretable NLP and hybrid AI. Covers language understanding, large language models, sentiment analysis, and text generation.",
        image_url: "https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=800&q=80",
        content_url: "https://www.sciencedirect.com/journal/natural-language-processing-journal",
      },
      {
        title: "Frontiers in AI - Natural Language Processing",
        description: "Latest research in NLP including transformer models, chatbots, question answering, and language generation. Features cutting-edge applications and methodologies.",
        image_url: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
        content_url: "https://www.frontiersin.org/journals/artificial-intelligence/sections/natural-language-processing",
      },
      {
        title: "DevOps Cube - Shell Scripting for DevOps",
        description: "Master Linux shell scripting and Bash automation for DevOps. Comprehensive guides, real-world examples, and best practices for system administration and automation.",
        image_url: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&q=80",
        content_url: "https://devopscube.com/linux-shell-scripting-for-devops/",
      },
      {
        title: "Medium - 25 Essential Bash Scripts for DevOps",
        description: "Practical Bash scripts for automating monitoring, backups, deployments, and security checks. Perfect for beginner to intermediate DevOps engineers.",
        image_url: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&q=80",
        content_url: "https://medium.com/@akhandsinghofficial/25-essential-bash-scripts-for-beginner-devops-engineers-c37d0cc45a1a",
      },
      {
        title: "Codemotion - Top 10 CI/CD Tools in 2025",
        description: "Comprehensive guide to the best CI/CD tools including Jenkins, GitLab CI/CD, GitHub Actions, and more. Covers automation, orchestration, and DevOps best practices.",
        image_url: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&q=80",
        content_url: "https://www.codemotion.com/magazine/devops/top-10-ci-cd-tools-in-2025/",
      },
      {
        title: "The New Stack - CI/CD Environment & DevOps",
        description: "Breaking news and analysis on CI/CD pipelines, Kubernetes, GitOps, and cloud-native practices. The backbone of modern DevOps and software delivery.",
        image_url: "https://images.unsplash.com/photo-1667372393086-9d4001d51cf1?w=800&q=80",
        content_url: "https://thenewstack.io/ci-cd/",
      },
      {
        title: "DevOps Magazine - Continuous Integration & Delivery",
        description: "Expert insights on CI/CD best practices, platform engineering, and the future of DevOps. Features from industry leaders on automation and deployment strategies.",
        image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
        content_url: "https://devopscon.io/whitepaper/devops-magazine-1-20/",
      },
      {
        title: "Technology Magazine - AI & Machine Learning",
        description: "Latest AI and machine learning articles covering robotics, computational intelligence, deep learning, and enterprise AI solutions from global tech leaders.",
        image_url: "https://images.unsplash.com/photo-1655635643532-fa9ba2648cbe?w=800&q=80",
        content_url: "https://technologymagazine.com/ai-and-machine-learning",
      },
    ]);
    console.log("Inserted tech magazines");

    // Insert Course Stats
    await CourseStat.insertMany([
      {
        course_id: courses[0]._id,
        enrolled_count: 2,
        avg_rating: 4.5,
        avg_completion_time: 120,
        price: 49.99,
        review_count: 10,
      },
      {
        course_id: courses[1]._id,
        enrolled_count: 1,
        avg_rating: 4.8,
        avg_completion_time: 180,
        price: 59.99,
        review_count: 5,
      },
      {
        course_id: courses[2]._id,
        enrolled_count: 1,
        avg_rating: 4.2,
        avg_completion_time: 90,
        price: 39.99,
        review_count: 8,
      },
      {
        course_id: courses[3]._id,
        enrolled_count: 1,
        avg_rating: 4.9,
        avg_completion_time: 150,
        price: 69.99,
        review_count: 12,
      },
      {
        course_id: courses[4]._id,
        enrolled_count: 1,
        avg_rating: 4.0,
        avg_completion_time: 210,
        price: 79.99,
        review_count: 7,
      },
    ]);
    console.log("Inserted initial course stats");
  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    // mongoose.disconnect(); // Disconnect after seeding if you don't need the connection open
  }
}

// seedData(); // Call the function to insert data - commented out to prevent duplicate data
// Uncomment the line above only when you need to seed initial data

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
  CommentVote,
};