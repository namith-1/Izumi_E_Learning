const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect("/login");
};

const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === "admin") {
    return next();
  }

  // If not logged in, redirect to login
  if (!req.session || !req.session.user) {
    return res.redirect("/-nsstn123-admin/login");
  }

  // If logged in but not admin, show error
  res.status(403).render("error", {
    message: "Access denied. Admin privileges required.",
  });
};

module.exports = {
  isAuthenticated,
  isAdmin,
};
