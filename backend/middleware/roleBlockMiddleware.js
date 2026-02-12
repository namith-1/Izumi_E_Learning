const attemptStore = require("../services/attemptStore");

/**
 * Middleware to prevent users from performing actions for a specific role
 * when that role/email key is currently blocked due to repeated failed attempts.
 */
module.exports = async function roleBlockMiddleware(req, res, next) {
  try {
    if (
      !req.session ||
      !req.session.user ||
      !req.session.user.email ||
      !req.session.user.role
    ) {
      return next();
    }

    const role = req.session.user.role;
    const email = req.session.user.email;
    const key = `login:${role}:${email}`;
    const status = await attemptStore.isBlocked(key);
    if (status.blocked) {
      const waitMs = new Date(status.rec.blockedUntil).getTime() - Date.now();
      return res
        .status(403)
        .json({
          message: `Access blocked for this role. Try again in ${Math.ceil(waitMs / 1000)} seconds.`,
          blocked: true,
          attempts: status.rec.count,
        });
    }
    return next();
  } catch (err) {
    // on error, allow request to proceed to avoid accidental lockouts
    console.error("roleBlockMiddleware error", err);
    return next();
  }
};
