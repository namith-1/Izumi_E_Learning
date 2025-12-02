const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course'); // Needed for deep population

// Enroll in a course
exports.enroll = async (req, res) => {
    try {
        const { courseId } = req.body;
        const enrollment = await Enrollment.create({
            courseId,
            studentId: req.session.user.id
        });
        console.log('New enrollment created:', enrollment); 
        res.status(201).json(enrollment);

    } catch (err) {
        // Use consistent error handling for unique constraint violation (Error code 11000)
        if(err.code === 11000) return res.status(400).json({ message: 'Already enrolled' });
        res.status(500).json({ error: err.message });
    }
};

// Get enrollment status (Load progress for CourseViewer)
exports.getEnrollment = async (req, res) => {
    try {
        const enrollment = await Enrollment.findOne({
            courseId: req.params.courseId,
            studentId: req.session.user.id
        });
        
        // Ensure 404 message matches frontend rejection handler in store.js
        if (!enrollment) return res.status(404).json({ message: 'Not enrolled' });
        
        res.json(enrollment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// NEW: Get all enrolled courses with details for the My Learning page
exports.getMyEnrolledCourses = async (req, res) => {
    try {
        // Find all enrollments for the current student
        const enrolledCourses = await Enrollment.find({ studentId: req.session.user.id })
            // Deeply populate the Course details and then the Teacher name within the Course
            .populate({
                path: 'courseId',
                select: 'title description subject teacherId rating', 
                populate: {
                    path: 'teacherId',
                    select: 'name' 
                }
            });

        // Map and flatten the results for a clean frontend response
        const enrolledCoursesData = enrolledCourses.map(enrollment => {
            const course = enrollment.courseId;
            // Handle case where course might have been deleted but enrollment remains
            if (!course || !course.teacherId) return null;
            
            return {
                _id: course._id, // Course ID is essential for navigation
                courseTitle: course.title,
                description: course.description,
                subject: course.subject,
                rating: course.rating,
                instructorName: course.teacherId.name, // Populated teacher name
                completionStatus: enrollment.completionStatus,
                modules_status: enrollment.modules_status
            };
        }).filter(item => item !== null); 

        res.json(enrolledCoursesData);
    } catch (err) {
        console.error("Error fetching enrolled courses:", err);
        res.status(500).json({ error: err.message });
    }
};

// Update Progress (Called when video completes or time updates/quiz submission)
exports.updateProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { moduleId, timeSpent, completed, quizScore } = req.body;
        
        const enrollment = await Enrollment.findOne({
            courseId, 
            studentId: req.session.user.id
        });

        if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

        // Check if module exists in progress array
        const moduleIndex = enrollment.modules_status.findIndex(m => m.moduleId === moduleId.toString());

        if (moduleIndex > -1) {
            // Update existing
            // Only update timeSpent if provided
            if (timeSpent !== undefined) enrollment.modules_status[moduleIndex].timeSpent = timeSpent;
            // Update completion status
            if (completed !== undefined) enrollment.modules_status[moduleIndex].completed = completed;
            // FIX: Update quizScore ONLY if explicitly provided (can be 0)
            if (quizScore !== undefined && quizScore !== null) {
                 enrollment.modules_status[moduleIndex].quizScore = quizScore;
            }
        } else {
            // Add new
            enrollment.modules_status.push({ moduleId, timeSpent, completed, quizScore });
        }
        
        // After updating the specific module, check if the entire course is complete
        // (This complex logic is omitted, relying on module updates for now)

        await enrollment.save();
        res.json(enrollment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};