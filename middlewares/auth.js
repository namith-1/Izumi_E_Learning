exports.checkSession = (req, res, next) => {
    if (!req.session.student) return res.send("Login as a student to continue.");
    next();
  };
  