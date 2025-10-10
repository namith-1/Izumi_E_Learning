const mongoose = require("mongoose");
const {
  Student,
  Instructor,
  Course,
  Enrollment,
  Magazine,
  CourseStat,
} = require("./required/db.js");

//  Insert Initial Data (using Mongoose methods)
async function seedData() {
  try {
    console.log("Starting data seeding...");

    // Check if data already exists
    const existingStudents = await Student.countDocuments();
    if (existingStudents > 0) {
      console.log("Data already exists. Skipping seeding.");
      return;
    }

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

    // Insert Magazines
    await Magazine.insertMany([
      {
        title: "Tech Monthly",
        description: "Latest tech trends.",
        image_url:
          "https://c0.wallpaperflare.com/preview/483/913/258/advanced-ai-anatomy-artificial.jpg",
        content_url: "https://tech.example.com",
      },
      {
        title: "Science Today",
        description: "Discoveries in science.",
        image_url:
          "https://wallpapers.com/images/high/futuristic-global-network-with-glowing-connections-6my9d3o2gl8rencj.webp",
        content_url: "https://science.example.com",
      },
    ]);
    console.log("Inserted initial magazines");

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

    console.log("Data seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    mongoose.disconnect(); // Disconnect after seeding
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;
