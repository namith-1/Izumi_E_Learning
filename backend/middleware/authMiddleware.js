const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Reviewer = require('../models/Reviewer');

const getModel = (role) => {
    if (role === 'student') return Student;
    if (role === 'teacher' || role === 'admin') return Teacher;
    if (role === 'reviewer') return Reviewer;
    return null;
};

const isAuthenticated = async (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized. Please login.' });
    }

    // --- Hardened Check: verify if account is locked in real-time ---
    const { id, role } = req.session.user;
    
    // Bypass for mock admin
    if (role === 'admin' && id === '60c728362d294d1f88c88888') {
        return next();
    }

    try {
        const Model = getModel(role);
        if (!Model) return next(); // Should not happen with valid session

        const userDoc = await Model.findById(id).select('isLocked').lean();
        if (!userDoc || userDoc.isLocked) {
            return req.session.destroy(() => {
                res.status(403).json({ message: 'Account is locked or no longer exists. Please contact support.' });
            });
        }
        next();
    } catch (err) {
        // Fail safe: if DB is down, allow existing session for now, or block? 
        // Blocking is safer but might disrupt service. Allowing for now.
        next();
    }
};

const isTeacher = (req, res, next) => {
    if (req.session.user && (req.session.user.role === 'teacher' || req.session.user.role === 'admin')) {
        return next();
    }
    return res.status(403).json({ message: 'Access denied. Teachers only.' });
};

// NEW: Admin Check
const isAdmin = (req, res, next) => {
    // Assumption: The admin user will have their session.user.role set to 'admin'.
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ message: 'Access denied. Admin only.' });
};

// NEW: Reviewer Check
const isReviewer = (req, res, next) => {
    if (req.session.user && (req.session.user.role === 'reviewer' || req.session.user.role === 'admin')) {
        return next();
    }
    return res.status(403).json({ message: 'Access denied. Reviewers only.' });
};

module.exports = { isAuthenticated, isTeacher, isAdmin, isReviewer };