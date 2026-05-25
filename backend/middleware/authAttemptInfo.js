const attemptStore = require("../services/attemptStore");

// Middleware to attach auth attempt info (role-scoped) to the request
module.exports = async function authAttemptInfo(req, res, next) {
  try {
    // Only care about login POSTs
    if (req.method === "POST" && req.path === "/api/auth/login" && req.body) {
      const { email, role } = req.body;
      if (email && role) {
        const key = `${role}:${email}`;
        const blocked = await attemptStore.isBlocked(key);
        req.authAttemptInfo = {
          key,
          blocked: blocked.blocked,
          rec: blocked.rec,
        };
      }
    }
  } catch (e) {
    // don't block the request on logging failures
    console.error("authAttemptInfo middleware failed", e && e.message);
  }
  return next();
};
