/**
 * Admin Auth Middleware
 * Validates admin session for protected routes
 */

const adminAuthMiddleware = (req, res, next) => {
  console.log('[AdminAuthMiddleware] Checking session for route:', req.path);
  console.log('[AdminAuthMiddleware] Session admin:', req.session.admin);
  
  // Skip auth check for login and signup
  if (req.path === '/login' || req.path === '/signup') {
    return next();
  }

  // For other routes, check if admin is authenticated
  if (!req.session.admin) {
    console.log('[AdminAuthMiddleware] No admin session, returning 401');
    return res.status(401).json({ message: 'Not authenticated' });
  }

  next();
};

module.exports = adminAuthMiddleware;
