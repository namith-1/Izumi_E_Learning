const mongoose = require('mongoose');
const { Student, Course, Enrollment, Module } = require('../required/db');
const StudentModel = require('../models/studentModel');

require('dotenv').config();

async function verifyFeatures() {
    try {
        // Connect to DB
        const uri = process.env.MONGO_URI || "mongodb://localhost:27017/izumi3";
        await mongoose.connect(uri);
        console.log("Connected to DB");

        // 1. Verify Module Schema Changes
        console.log("\n--- Verifying Module Schema ---");
        const testModule = new Module({
            title: "Test Quiz Module",
            type: "quiz",
            quizData: {
                questions: [
                    { question: "What is 2+2?", options: ["3", "4", "5"], answer: "4" }
                ]
            }
        });
        
        // Check if the fields are accepted by the schema
        // Note: Mongoose 6+ might strip unknown fields if strict is true, so if they persist, the schema is correct.
        if (testModule.type === 'quiz' && testModule.quizData && testModule.quizData.questions) {
            console.log("✅ Module schema supports 'type' and 'quizData'");
        } else {
            console.error("❌ Module schema missing new fields or not accepting them");
        }

        // 2. Verify Enrollment Schema and Update Logic
        console.log("\n--- Verifying Enrollment Logic ---");
        
        // Create temp data
        const student = await Student.create({
            name: "Quiz Tester",
            email: `quiztester_${Date.now()}@test.com`,
            contact: "0000000000",
            address: "Test Address",
            hashed_password: "hash"
        });
        
        const course = await Course.create({
            title: "Quiz Test Course",
            subject: "Testing"
        });

        // Note: The schema uses student_id and course_id
        const enrollment = await Enrollment.create({
            student_id: student._id,
            course_id: course._id
        });

        console.log("Created test student, course, and enrollment");

        // Test updateProgress
        const moduleId = new mongoose.Types.ObjectId();
        const quizScore = 85;
        
        console.log(`Updating progress for module ${moduleId} with score ${quizScore}...`);
        
        // The updateProgress function we added to StudentModel
        await StudentModel.updateProgress(
            student._id, 
            course._id, 
            moduleId, 
            120, // timeSpent
            true, // completed
            quizScore // quizScore
        );

        // Fetch enrollment again to verify
        const updatedEnrollment = await Enrollment.findById(enrollment._id);
        
        // The schema defines modules_status as an array
        const moduleStatus = updatedEnrollment.modules_status.find(m => m.moduleId === moduleId.toString());

        if (moduleStatus && moduleStatus.quizScore === quizScore && moduleStatus.completed === true) {
            console.log("✅ Enrollment progress updated successfully with quiz score!");
            console.log("Module Status:", moduleStatus);
        } else {
            console.error("❌ Failed to update enrollment progress");
            console.log("Updated Enrollment modules_status:", updatedEnrollment.modules_status);
        }

        // Cleanup
        await Student.deleteOne({ _id: student._id });
        await Course.deleteOne({ _id: course._id });
        await Enrollment.deleteOne({ _id: enrollment._id });
        console.log("\nTest data cleaned up.");

    } catch (err) {
        console.error("Verification failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

verifyFeatures();