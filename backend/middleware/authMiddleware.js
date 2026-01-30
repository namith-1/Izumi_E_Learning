// v2/backend/middleware/authMiddleware.js
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    return res.status(401).json({ message: 'Unauthorized. Please login.' });
};

const isTeacher = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'teacher') {
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

module.exports = { isAuthenticated, isTeacher, isAdmin };