const mongoose = require("mongoose");
require("dotenv").config(); // Load .env first

// Use Atlas if available, else fallback to local MongoDB
const uri = process.env.MONGO_URI || "mongodb://localhost:27017/izumi3";

mongoose
  .connect(uri)
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
   completion_credits: { type: Number, default: 100 }, // Credits awarded on completion
  module_credits: { type: Number, default: 10 }, 
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


// Add these new schemas to your db.js file

// Credits/Points Schema
const studentCreditsSchema = new mongoose.Schema({
  student_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Student", 
    unique: true 
  },
  total_credits: { type: Number, default: 0 },
  lifetime_credits: { type: Number, default: 0 }, // Total earned ever
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Credit Transactions Schema (History)
const creditTransactionSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  amount: { type: Number, required: true }, // Positive for earning, negative for spending
  type: { 
    type: String, 
    enum: ['course_completion', 'module_completion', 'purchase', 'bonus', 'achievement'],
    required: true 
  },
  reference_id: { type: mongoose.Schema.Types.ObjectId }, // Course/Item ID
  description: { type: String },
  created_at: { type: Date, default: Date.now }
});

// Store Items Schema (Profile Customizations)
const storeItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { 
    type: String, 
    enum: ['banner', 'avatar_frame', 'badge', 'theme', 'title'],
    required: true 
  },
  price: { type: Number, required: true },
  rarity: { 
    type: String, 
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common' 
  },
  image_url: { type: String },
  preview_url: { type: String },
  is_active: { type: Boolean, default: true },
  unlock_level: { type: Number, default: 1 }, // Level required to purchase
  limited_edition: { type: Boolean, default: false },
  available_until: { type: Date }, // For limited time items
  created_at: { type: Date, default: Date.now }
});

// Student Inventory Schema (Owned Items)
const studentInventorySchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  item_id: { type: mongoose.Schema.Types.ObjectId, ref: "StoreItem" },
  is_equipped: { type: Boolean, default: false },
  purchased_at: { type: Date, default: Date.now }
});

// Student Profile Customization Schema
const studentProfileSchema = new mongoose.Schema({
  student_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Student", 
    unique: true 
  },
  banner_id: { type: mongoose.Schema.Types.ObjectId, ref: "StoreItem" },
  avatar_frame_id: { type: mongoose.Schema.Types.ObjectId, ref: "StoreItem" },
  equipped_badge_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "StoreItem" }], // Max 3-5 badges
  theme_id: { type: mongoose.Schema.Types.ObjectId, ref: "StoreItem" },
  custom_title: { type: String, maxlength: 50 },
  profile_color: { type: String, default: "#8A2BE2" },
  bio: { type: String, maxlength: 200 },
  updated_at: { type: Date, default: Date.now }
});

// Achievements Schema
const achievementSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  icon_url: { type: String },
  category: { 
    type: String, 
    enum: ['courses', 'social', 'special', 'seasonal'],
    default: 'courses'
  },
  criteria: { type: Object }, // Flexible criteria object
  reward_credits: { type: Number, default: 0 },
  reward_item_id: { type: mongoose.Schema.Types.ObjectId, ref: "StoreItem" },
  is_hidden: { type: Boolean, default: false }, // Secret achievements
  created_at: { type: Date, default: Date.now }
});

// Student Achievements Schema
const studentAchievementSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  achievement_id: { type: mongoose.Schema.Types.ObjectId, ref: "Achievement" },
  progress: { type: Number, default: 0 }, // For progressive achievements
  completed: { type: Boolean, default: false },
  completed_at: { type: Date },
  created_at: { type: Date, default: Date.now }
});


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

// Create Models
const StudentCredits = mongoose.model("StudentCredits", studentCreditsSchema);
const CreditTransaction = mongoose.model("CreditTransaction", creditTransactionSchema);
const StoreItem = mongoose.model("StoreItem", storeItemSchema);
const StudentInventory = mongoose.model("StudentInventory", studentInventorySchema);
const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);
const Achievement = mongoose.model("Achievement", achievementSchema);
const StudentAchievement = mongoose.model("StudentAchievement", studentAchievementSchema);

// Add seed data for store items
async function seedStoreItems() {
  try {
    // Banners
    await StoreItem.insertMany([
      // ========== BANNERS ==========
      {
        name: "Cosmic Purple Banner",
        description: "A stunning purple cosmic background with nebula effects",
        type: "banner",
        price: 500,
        rarity: "epic",
        image_url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80",
        unlock_level: 5
      },
      {
        name: "Gradient Wave Banner",
        description: "Smooth gradient waves in purple and blue",
        type: "banner",
        price: 250,
        rarity: "rare",
        image_url: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800&q=80",
        unlock_level: 1
      },
      {
        name: "Northern Lights Banner",
        description: "Beautiful aurora borealis effect",
        type: "banner",
        price: 750,
        rarity: "epic",
        image_url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        unlock_level: 10
      },
      {
        name: "Legendary Dragon Banner",
        description: "Exclusive dragon-themed banner with animated effects",
        type: "banner",
        price: 1500,
        rarity: "legendary",
        image_url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
        unlock_level: 20
      },
      {
        name: "Cyberpunk City Banner",
        description: "Futuristic neon cityscape",
        type: "banner",
        price: 600,
        rarity: "epic",
        image_url: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&q=80",
        unlock_level: 8
      },
      
      // ========== AVATAR FRAMES ==========
      {
        name: "Gold Crown Frame",
        description: "Prestigious golden crown frame",
        type: "avatar_frame",
        price: 400,
        rarity: "epic",
        image_url: "/images/frames/gold-crown.png",
        unlock_level: 15
      },
      {
        name: "Neon Glow Frame",
        description: "Pulsating neon outline",
        type: "avatar_frame",
        price: 200,
        rarity: "rare",
        image_url: "/images/frames/neon-glow.png",
        unlock_level: 5
      },
      {
        name: "Diamond Elite Frame",
        description: "Sparkling diamond border - ultimate prestige",
        type: "avatar_frame",
        price: 1000,
        rarity: "legendary",
        image_url: "/images/frames/diamond.png",
        unlock_level: 25
      },
      {
        name: "Fire Ring Frame",
        description: "Blazing fire effect around avatar",
        type: "avatar_frame",
        price: 350,
        rarity: "rare",
        image_url: "/images/frames/fire-ring.png",
        unlock_level: 7
      },
      
      // ========== BADGES ==========
      {
        name: "First Course Badge",
        description: "Completed your first course!",
        type: "badge",
        price: 50,
        rarity: "common",
        image_url: "/images/badges/first-course.png",
        unlock_level: 1
      },
      {
        name: "Speed Learner Badge",
        description: "Complete 3 courses in a month",
        type: "badge",
        price: 300,
        rarity: "rare",
        image_url: "/images/badges/speed-learner.png",
        unlock_level: 5
      },
      {
        name: "Master Scholar Badge",
        description: "Complete 10 courses",
        type: "badge",
        price: 800,
        rarity: "epic",
        image_url: "/images/badges/master-scholar.png",
        unlock_level: 15
      },
      {
        name: "Perfect Score Badge",
        description: "Achieve 100% in any course",
        type: "badge",
        price: 500,
        rarity: "epic",
        image_url: "/images/badges/perfect-score.png",
        unlock_level: 10
      },
      {
        name: "Community Helper Badge",
        description: "Help 50 other students",
        type: "badge",
        price: 600,
        rarity: "epic",
        image_url: "/images/badges/helper.png",
        unlock_level: 12
      },
      
      // ========== THEMES ==========
      {
        name: "Dark Mode Pro",
        description: "Enhanced dark theme with custom accents",
        type: "theme",
        price: 150,
        rarity: "common",
        image_url: "/images/themes/dark-pro.png",
        unlock_level: 1
      },
      {
        name: "Midnight Purple Theme",
        description: "Deep purple and black theme",
        type: "theme",
        price: 400,
        rarity: "rare",
        image_url: "/images/themes/midnight-purple.png",
        unlock_level: 8
      },
      {
        name: "Ocean Breeze Theme",
        description: "Calming blue and teal colors",
        type: "theme",
        price: 300,
        rarity: "rare",
        image_url: "/images/themes/ocean-breeze.png",
        unlock_level: 5
      },
      {
        name: "Legendary Holographic",
        description: "Premium holographic theme with animations",
        type: "theme",
        price: 1200,
        rarity: "legendary",
        image_url: "/images/themes/holographic.png",
        unlock_level: 20
      },
      
      // ========== CUSTOM TITLES ==========
      {
        name: "Scholar Title",
        description: "Display 'Scholar' before your name",
        type: "title",
        price: 100,
        rarity: "common",
        unlock_level: 1
      },
      {
        name: "Master Title",
        description: "Display 'Master' before your name",
        type: "title",
        price: 400,
        rarity: "rare",
        unlock_level: 10
      },
      {
        name: "Legend Title",
        description: "Display 'Legend' before your name",
        type: "title",
        price: 1000,
        rarity: "legendary",
        unlock_level: 25
      },
      {
        name: "Professor Title",
        description: "Display 'Professor' before your name",
        type: "title",
        price: 800,
        rarity: "epic",
        unlock_level: 18
      }
    ]);
    
    console.log("✅ Store items seeded successfully!");
  } catch (error) {
    console.error("Error seeding store items:", error);
  }
}
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
   StudentCredits,
  CreditTransaction,
  StoreItem,
  StudentInventory,
  StudentProfile,
  Achievement,
  StudentAchievement,
  seedStoreItems
};