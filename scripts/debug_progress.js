const mongoose = require('mongoose');
const { Student, Module, StudentModule, Course, Enrollment } = require('../required/db');

// Note: Database connection is already established through db.js

async function debugProgress() {
  try {
    console.log('🔍 DEBUGGING PROGRESS BAR ISSUE');
    console.log('================================');
    
    // Get a sample student and course for debugging
    const student = await Student.findOne();
    if (!student) {
      console.log('❌ No students found in database');
      return;
    }
    console.log(`📚 Found student: ${student.name} (ID: ${student._id})`);
    
    // Get their enrollments
    const enrollments = await Enrollment.find({ student_id: student._id });
    if (!enrollments.length) {
      console.log('❌ Student has no enrollments');
      return;
    }
    
    for (const enrollment of enrollments) {
      console.log(`\n🎯 Course: ${enrollment.course_id}`);
      
      // Get course details
      const course = await Course.findById(enrollment.course_id);
      console.log(`   Title: ${course ? course.title : 'Unknown'}`);
      
      // Count total modules for this course
      const totalModules = await Module.find({ course_id: enrollment.course_id });
      console.log(`   📊 Total modules in course: ${totalModules.length}`);
      
      // Show all modules
      console.log('   📋 All modules:');
      totalModules.forEach((mod, idx) => {
        console.log(`      ${idx + 1}. ${mod.title} (ID: ${mod._id}, Parent: ${mod.parent_id || 'None'})`);
      });
      
      // Count completed modules for this student
      const completedModules = await StudentModule.find({ 
        student_id: student._id,
        module_id: { $in: totalModules.map(m => m._id) },
        is_completed: 1 
      });
      console.log(`   ✅ Completed modules: ${completedModules.length}`);
      
      // Show completed modules
      if (completedModules.length > 0) {
        console.log('   ✅ Completed module details:');
        completedModules.forEach((comp, idx) => {
          const module = totalModules.find(m => m._id.toString() === comp.module_id.toString());
          console.log(`      ${idx + 1}. ${module ? module.title : 'Unknown'} (ID: ${comp.module_id})`);
        });
      }
      
      // Calculate progress
      const progressPercent = totalModules.length > 0 ? 
        ((completedModules.length / totalModules.length) * 100).toFixed(2) : 0;
      console.log(`   📈 Progress: ${progressPercent}%`);
      
      // Now test the actual aggregation query from studentModel
      console.log('\n   🔬 Testing actual aggregation query...');
      const studentObjId = new mongoose.Types.ObjectId(student._id);
      const aggResult = await Enrollment.aggregate([
        { $match: { student_id: studentObjId } },
        {
          $lookup: {
            from: "courses",
            localField: "course_id", 
            foreignField: "_id",
            as: "courseInfo",
          },
        },
        { $unwind: "$courseInfo" },
        {
          $lookup: {
            from: "modules",
            localField: "course_id",
            foreignField: "course_id", 
            as: "modules",
          },
        },
        {
          $lookup: {
            from: "studentmodules",
            localField: "student_id",
            foreignField: "student_id",
            as: "studentModules",
          },
        },
        {
          $project: {
            course_id: "$courseInfo._id",
            title: "$courseInfo.title",
            total_modules: { $size: "$modules" },
            completed_modules: {
              $size: {
                $filter: {
                  input: "$studentModules",
                  as: "sm",
                  cond: {
                    $and: [
                      { $eq: ["$$sm.is_completed", 1] },
                      { $in: ["$$sm.module_id", "$modules._id"] },
                    ],
                  },
                },
              },
            },
            _id: 0,
          },
        },
      ]);
      
      console.log('   🔍 Aggregation result:', JSON.stringify(aggResult, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('✅ Debug completed');
  }
}

debugProgress();