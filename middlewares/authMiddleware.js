const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
};

const isAdmin = (req, res, next) => {
    // Check if admin is logged in via session
    if (req.session && req.session.admin && req.session.role === 'admin') {
        return next();
    }
    
    // If not logged in, return JSON error
    if (!req.session || !req.session.admin) {
        return res.status(401).json({ message: 'Not authenticated. Please login as admin.' });
    }
    
    // If logged in but not admin, show error
    res.status(403).json({ message: 'Access denied. Admin privileges required.' });
};

const isAdminOrRedirect = (req, res, next) => {
    if (req.session && req.session.admin && req.session.role === 'admin') {
        return next();
    }
    
    if (!req.session || !req.session.admin) {
        return res.redirect('/admin/login');
    }
    
    res.status(403).render('error', { 
        message: 'Access denied. Admin privileges required.' 
    });
};

module.exports = {
    isAuthenticated,
    isAdmin,
    isAdminOrRedirect
}; 