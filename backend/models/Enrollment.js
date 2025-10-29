const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    
    completionStatus: { 
        type: String, 
        enum: ['in-progress', 'completed'], 
        default: 'in-progress' 
    },
    
    // Tracks individual module progress
    modules_status: [{
        moduleId: { type: String, required: true }, // String because your frontend uses Date.now() + Random
        completed: { type: Boolean, default: false },
        timeSpent: { type: Number, default: 0 }, // In seconds
        quizScore: { type: Number, default: null } // Optional, for quiz modules
    }]
}, { timestamps: true });

// Prevent duplicate enrollments
enrollmentSchema.index({ courseId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);