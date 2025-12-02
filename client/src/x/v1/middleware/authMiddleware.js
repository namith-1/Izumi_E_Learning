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

module.exports = { isAuthenticated, isTeacher };