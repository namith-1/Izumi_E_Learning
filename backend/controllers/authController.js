// v2/backend/controllers/authController.js
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const bcrypt = require("bcryptjs");
const attemptStore = require("../services/attemptStore");

// --- Hardcoded Admin Credentials and Mock ID ---
const ADMIN_EMAIL = "admin@izumi.com";
const ADMIN_PASSWORD = "adminpass";
// Use a valid MongoDB ObjectId format for the mock user
const MOCK_ADMIN_ID = "60c728362d294d1f88c88888";

// Helper to get the correct model based on role
const getModel = (role) => {
  if (role === "student") return Student;
  // Treat 'teacher' and 'admin' (if not mock) as searching the Teacher model
  if (role === "teacher" || role === "admin") return Teacher;
  return null;
};

// Register
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const Model = getModel(role);

    // Check if user exists
    const existingUser = await Model.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await Model.create({
      name,
      email,
      password: hashedPassword,
    });

    // Auto-login after register
    req.session.user = {
      id: newUser._id,
      role: role,
      name: newUser.name,
      email: newUser.email,
    };

    res
      .status(201)
      .json({ message: "Registration successful", user: req.session.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password, role } = req.body;

  // --- NEW LOGIC: Hardcoded Admin Check (Bypasses DB) ---
  if (
    role === "admin" &&
    email === ADMIN_EMAIL &&
    password === ADMIN_PASSWORD
  ) {
    // Bypass database lookup and create a mock session
    req.session.user = {
      id: MOCK_ADMIN_ID,
      role: "admin",
      name: "Izumi Admin",
      email: ADMIN_EMAIL,
    };
    return res.json({
      message: "Logged in successfully",
      user: req.session.user,
    });
  }
  // --- END Hardcoded Admin Check ---
  let actualRole = role;
  try {
    // Build a key that includes role so locking is role-scoped
    const key = `${actualRole}:${email}`;

    // Only apply blocking logic for students (role-based)
    if (actualRole === "student") {
      const blocked = await attemptStore.isBlocked(key);
      if (blocked.blocked) {
        const blockedUntil =
          blocked.rec && blocked.rec.blockedUntil
            ? new Date(blocked.rec.blockedUntil)
            : null;
        const remainingMs = blockedUntil
          ? Math.max(0, blockedUntil.getTime() - Date.now())
          : 0;
        return res
          .status(429)
          .json({
            message: `Too many attempts. Try again in ${Math.ceil(remainingMs / 1000)} seconds.`,
            blockedUntil,
          });
      }
    }
    const Model = getModel(actualRole);
    if (!Model)
      return res.status(400).json({ message: "Invalid role provided." });

    const user = await Model.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      // Record failed attempt only for students (role-based)
      try {
        if (actualRole === "student") {
          await attemptStore.recordFailedAttempt(
            `${actualRole}:${email}`,
            req.ip,
          );
        }
      } catch (e) {
        console.error("Failed to record attempt", e && e.message);
      }
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Save session (Only for student/teacher here, admin is handled above)
    req.session.user = {
      id: user._id,
      role: actualRole,
      name: user.name,
      email: user.email,
    };

    // Successful login — clear any recorded attempts for this user (students)
    try {
      if (actualRole === "student") {
        await attemptStore.clearAttempts(`${actualRole}:${email}`);
      }
    } catch (e) {
      console.error("Failed to clear attempts", e && e.message);
    }

    res.json({ message: "Logged in successfully", user: req.session.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
};

// Check Current Session (Useful for React useEffect on load)
exports.me = (req, res) => {
  if (req.session.user) {
    // --- NEW LOGIC: Mock Admin Check (Bypasses DB lookup for session restore) ---
    if (
      req.session.user.id === MOCK_ADMIN_ID &&
      req.session.user.role === "admin"
    ) {
      // Return mock user data directly
      return res.json({ user: req.session.user });
    }
    // --- END Mock Admin Check ---

    // Determine model: use 'teacher' model if the session role is 'admin' for lookup
    const role =
      req.session.user.role === "admin" ? "teacher" : req.session.user.role;
    const Model = getModel(role);

    if (!Model) {
      return res
        .status(404)
        .json({ user: null, message: "Invalid session role." });
    }

    Model.findById(req.session.user.id)
      .select("name email")
      .then((userDoc) => {
        if (userDoc) {
          // Ensure the session user object is complete
          req.session.user.email = userDoc.email;
          res.json({ user: req.session.user });
        } else {
          res.status(404).json({ user: null });
        }
      })
      .catch((err) => {
        res
          .status(500)
          .json({ user: null, message: "Database error fetching user." });
      });
  } else {
    res.status(401).json({ user: null });
  }
};

// NEW: Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const userId = req.session.user.id;

    // --- NEW LOGIC: Block profile update for mock Admin account ---
    if (userId === MOCK_ADMIN_ID && req.session.user.role === "admin") {
      return res
        .status(403)
        .json({ message: "Cannot update profile for administrative account." });
    }
    // --- END Block ---

    // Determine model: use 'teacher' model if the session role is 'admin' for lookup
    const role =
      req.session.user.role === "admin" ? "teacher" : req.session.user.role;
    const Model = getModel(role);

    const user = await Model.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Verify current password
    if (
      !currentPassword ||
      !(await bcrypt.compare(currentPassword, user.password))
    ) {
      return res.status(401).json({ message: "Invalid current password." });
    }

    // 2. Update name if provided
    if (name) {
      user.name = name;
      req.session.user.name = name; // Update session
    }

    // 3. Update password if new one is provided
    if (newPassword && newPassword.length >= 6) {
      user.password = await bcrypt.hash(newPassword, 10);
    } else if (newPassword) {
      // New password provided but too short
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters." });
    }

    await user.save();

    // Return updated session data, maintaining the session role.
    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        role: req.session.user.role,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error updating profile." });
  }
};

// Get all teachers (ID and Name)
exports.getAllTeachers = async (req, res) => {
  try {
    // Find all users in the Teacher collection and only return their _id and name
    const teachers = await Teacher.find().select("_id name");
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const userId = req.session.user.id;

    // Block mock admin updates
    if (userId === MOCK_ADMIN_ID && req.session.user.role === "admin") {
      return res.status(403).json({ message: "Cannot update admin profile." });
    }

    const role =
      req.session.user.role === "admin" ? "teacher" : req.session.user.role;
    const Model = getModel(role);

    const user = await Model.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify password
    if (
      !currentPassword ||
      !(await bcrypt.compare(currentPassword, user.password))
    ) {
      return res.status(401).json({ message: "Invalid current password." });
    }

    // Handle File path from Multer
    if (req.file) {
      user.profilePic = `/uploads/profiles/${req.file.filename}`;
      req.session.user.profilePic = user.profilePic;
    }

    if (name) {
      user.name = name;
      req.session.user.name = name;
    }

    if (newPassword && newPassword.length >= 6) {
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    res.json({
      message: "Profile updated successfully",
      user: req.session.user,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
