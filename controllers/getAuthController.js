const path = require('path');
const fs = require('fs');

// Helper function to send client build or serve a view
const sendClientOrRedirect = (res, fallbackRoute) => {
  const clientBuildPath = path.join(__dirname, '..', 'client', 'build', 'index.html');
  if (fs.existsSync(clientBuildPath)) {
    res.sendFile(clientBuildPath);
  } else {
    res.redirect(fallbackRoute);
  }
};

module.exports = {
  home: (req, res) => {
    sendClientOrRedirect(res, '/student/login');
  },

  login: (req, res) => {
    sendClientOrRedirect(res, '/login');
  },

  signup: (req, res) => {
    sendClientOrRedirect(res, '/signup');
  },

  loginInstructor: (req, res) => {
    sendClientOrRedirect(res, '/login_i');
  },

  signupInstructor: (req, res) => {
    sendClientOrRedirect(res, '/signup_i');
  },

  studentHome: (req, res) => {
    sendClientOrRedirect(res, '/home');
  },
};
