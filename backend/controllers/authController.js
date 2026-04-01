// v2/backend/controllers/authController.js
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Reviewer = require("../models/Reviewer");
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
  if (role === "reviewer") return Reviewer;
  // Treat 'teacher' and 'admin' (if not mock) as searching the Teacher model
  if (role === "teacher" || role === "admin") return Teacher;
  return null;
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *               role:
 *                 type: string
 *                 enum: [student, teacher, reviewer]
 *                 example: "student"
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Registration successful"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Email already exists or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email already exists"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
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

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               role:
 *                 type: string
 *                 enum: [student, teacher, reviewer, admin]
 *                 example: "student"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logged in successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid credentials"
 *       429:
 *         description: Too many failed attempts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Too many attempts. Try again in 60 seconds."
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

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

    // Only apply blocking logic for students and teachers (role-scoped)
    if (actualRole === "student" || actualRole === "teacher") {
      const blocked = await attemptStore.isBlocked(key);
      if (blocked.blocked) {
        const blockedUntil =
          blocked.rec && blocked.rec.blockedUntil
            ? new Date(blocked.rec.blockedUntil)
            : null;
        const remainingMs = blockedUntil
          ? Math.max(0, blockedUntil.getTime() - Date.now())
          : 0;
        return res.status(429).json({
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
      // Record failed attempt for students and teachers (role-based)
      try {
        if (actualRole === "student" || actualRole === "teacher") {
          const rec = await attemptStore.recordFailedAttempt(
            `${actualRole}:${email}`,
            req.ip,
          );
          if (res && res.locals)
            res.locals.authAttempt = { key: `${actualRole}:${email}`, rec };
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

    // Successful login — clear any recorded attempts for this user (students/teachers)
    try {
      if (actualRole === "student" || actualRole === "teacher") {
        await attemptStore.clearAttempts(`${actualRole}:${email}`);
        if (res && res.locals)
          res.locals.authAttempt = {
            key: `${actualRole}:${email}`,
            cleared: true,
          };
      }
    } catch (e) {
      console.error("Failed to clear attempts", e && e.message);
    }

    res.json({ message: "Logged in successfully", user: req.session.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logged out"
 *       500:
 *         description: Logout failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logout failed"
 */

// Logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
};

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user session
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Current user session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: null
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: null
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: null
 *                 message:
 *                   type: string
 */

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

/**
 * @swagger
 * /api/auth/teachers:
 *   get:
 *     summary: Get all teachers
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: List of teachers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "60c728362d294d1f88c88888"
 *                   name:
 *                     type: string
 *                     example: "Dr. Smith"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

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
