const Instructor = require("../models/instructorModel"); // Import the Mongoose Instructor model
const { InstituteMail } = require("../models/instructor/commonModel.js");
const bcrypt = require("bcrypt");
const path = require("path");

exports.signup = async (req, res) => {
  const { username, email, password, contact, address } = req.body;

  try {
    const user = await Instructor.findByEmail(email);
    if (user) {
      if (user.is_deleted === 0) {
        return res.status(400).send("Email already exists.");
      } else {
        return res
          .status(400)
          .send(
            'Account exists but is deleted. Please <a href="/restore.html">restore your account</a>.'
          );
      }
    }

    // ✅ Extract domain part (after @)
    const domain = email.split("@")[1];
    if (!domain) {
      return res.status(400).send("Invalid email format.");
    }

    // ✅ Check if that domain exists in InstructorInfo
    const instituteEmail = await InstituteMail.findOne({
      email_id: { $regex: new RegExp(domain + "$", "i") },
    });

    if (!instituteEmail) {
      return res
        .status(400)
        .send("This email domain is not registered under any institute.");
    }

    const newInstructor = await Instructor.create(username, email, contact, address, password);
    // Set session for immediate login
    req.session.instructor = newInstructor._id;
    req.session.role = 'instructor';
    console.log('Instructor signup success, redirecting to dashboard');
    res.redirect("/instructor/dashboard");
  } catch (error) {
    console.error("Instructor signup error:", error);
    return res.status(500).send("Error signing up: " + error.message);
  }
};

exports.loginInstructor = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Instructor.findActiveByEmail(email);
    if (!user) return res.status(400).send("Invalid email or password.");

    const match = await bcrypt.compare(password, user.hashed_password);
    if (match) {
      req.session.instructor = user._id; // Store the Mongoose _id
      req.session.role = 'instructor';
      console.log('Instructor login success, redirecting to dashboard');
      res.redirect("/instructor/dashboard");
    } else {
      res.status(400).send("Invalid email or password.");
    }
  } catch (error) {
    console.error("Instructor login error:", error);
    return res.status(500).send("Error logging in: " + error.message);
  }
};

exports.instructorDashboard = (req, res) => {
  if (!req.session.instructor) return res.status(403).send("Unauthorized.");
  // Serve the instructor's dashboard view
  res.sendFile(path.join(__dirname, "../views/instructor/dashboard.html"));
};

// controllers/instructorAuthController.js
exports.logoutInstructor = (req, res) => {
  // Destroy the instructor's session (if using sessions)
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying instructor session:", err);
      return res.status(500).send("Instructor logout failed");
    }
    // Clear any instructor-specific authentication tokens (if using cookies)
    res.clearCookie("instructorAuthToken"); // Example cookie name for instructor token
    res.redirect("/"); // Redirect to home page after logout
  });
};
