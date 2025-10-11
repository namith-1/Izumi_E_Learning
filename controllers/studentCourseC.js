const StudentCourse = require('../models/studentModel'); // Import the Mongoose model
const Course = require('../models/courseModel'); // Use the Mongoose model

const mongoose = require('mongoose');

const {CourseStat} = require("../required/db")



exports.checkEnrollment = async (req, res) => {
    if (!req.session.student) return res.redirect('/');

    const courseId = req.query.courseId;
    const studentId = req.session.student;

    if (!courseId) return res.status(400).send("Missing course ID.");

    try {
        const enrolled = await StudentCourse.isEnrolled(studentId, courseId);
        if (enrolled) {
            res.redirect(`/view_course?courseID=${courseId}&studentID=${studentId}`);
        } else {
            res.redirect(`/course/about/${courseId}`);
        }
    } catch (error) {
        console.error("Database error:", error);
        return res.status(500).send('Database error: ' + error.message);
    }
};

exports.enrollStudent = async (req, res) => {
    if (!req.session.student) return res.redirect('/login');

    const studentId = req.session.student;
    const courseId = req.query.courseId;


    if (!studentId || !courseId) {
        return res.status(400).json({ message: 'Student ID and Course ID are required' });
    }

    try {
        await StudentCourse.enroll(studentId, courseId);
         await Course.updateCourseEnrollment(studentId, courseId);
        
        
        res.redirect(`/view_course?courseID=${courseId}&studentID=${studentId}`);
    } catch (error) {
        console.error("Enrollment error:", error);
        return res.status(500).json({ message: 'Error enrolling student: ' + error.message });
    }
};

exports.fetchStudentProgress = async (req, res) => {
    const studentId = req.params.studentId;
    console.log("Fetching progress for student:", studentId);

    try {
        const rows = await StudentCourse.getStudentCourseProgress(studentId);
        const progressRows = rows.map(row => ({
            ...row,
            progress: row.total_modules > 0
                ? ((row.completed_modules / row.total_modules) * 100).toFixed(2)
                : "0"
        }));
        res.json(progressRows);
    } catch (error) {
        console.error("Error fetching student progress:", error);
        return res.status(500).json({ error: 'Error fetching student progress: ' + error.message });
    }
};

exports.getCompletedModules = async (req, res) => {
    const { studentId, courseId } = req.query;

    if (!studentId || !courseId) {
        return res.status(400).send('Student ID and Course ID are required.');
    }

    try {
        const rows = await StudentCourse.getCompletedModules(studentId, courseId);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching completed modules:", error);
        return res.status(500).send('Error fetching completed modules: ' + error.message);
    }
};

exports.redirectToProgressView = (req, res) => {
    if (!req.session.student) {
        return res.redirect('/login');
    }

    const studentId = req.session.student;
    res.redirect(`/views/studentProgress.html?studentId=${studentId}`);
};


exports.markModuleComplete = async (req, res) => {
    const moduleId = req.query.moduleId;
    const studentId = req.session.student;

    if (!moduleId) {
        return res.status(400).send('Module ID is required.');
    }

    try {
        const result = await StudentCourse.markModuleAsComplete(studentId, moduleId);
        if (result.changes > 0) {
            res.status(200).send('done');
        } else {
            res.status(404).send('Module not found or student does not exist.');
        }
    } catch (error) {
        console.error("Error marking module as complete:", error);
        return res.status(500).send('Error updating module completion: ' + error.message);
    }
};
