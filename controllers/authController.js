const Student = require("../models/studentModel"); // Import the Mongoose-based StudentModel
const InstructorModel = require("../models/instructorModel");
const bcrypt = require("bcrypt");

// API endpoint for signup - returns JSON
exports.signup = async (req, res) => {
  const { username, name, email, password, contact, address, role } = req.body;
  
  // Use name if provided, otherwise fallback to username (frontend sends 'name')
  const fullName = name || username;

  try {
    // Determine if student or instructor based on role
    const isInstructor = role === 'instructor';
    
    // Check if email already exists in appropriate collection
    if (isInstructor) {
      const existingInstructor = await InstructorModel.findByEmail(email);
      if (existingInstructor) {
        if (existingInstructor.is_deleted === 0) {
          return res.status(400).json({ message: "Email already exists." });
        } else {
          // Reactivate deleted instructor
          const reactivatedInstructor = await InstructorModel.reactivate(fullName, email, contact, address, password);
          req.session.instructor = reactivatedInstructor._id;
          req.session.role = 'instructor';
          
          return res.status(201).json({ 
            message: "Account reactivated successfully",
            user: {
              _id: reactivatedInstructor._id,
              username: reactivatedInstructor.name,
              email: reactivatedInstructor.email,
              role: 'instructor'
            }
          });
        }
      }
      
      const newInstructor = await InstructorModel.create(fullName, email, contact, address, password);
      req.session.instructor = newInstructor._id;
      req.session.role = 'instructor';
      
      res.status(201).json({ 
        message: "Signup successful",
        user: {
          _id: newInstructor._id,
          username: newInstructor.name,
          email: newInstructor.email,
          role: 'instructor'
        }
      });
    } else {
      // Student signup
      const existingStudent = await Student.findByEmail(email);
      if (existingStudent) {
        if (existingStudent.is_deleted === 0) {
          return res.status(400).json({ message: "Email already exists." });
        } else {
          // Reactivate deleted student
          const reactivatedStudent = await Student.reactivate(fullName, email, contact, address, password);
          req.session.student = reactivatedStudent._id;
          req.session.role = 'student';
          
          return res.status(201).json({ 
            message: "Account reactivated successfully",
            user: {
              _id: reactivatedStudent._id,
              username: reactivatedStudent.name,
              email: reactivatedStudent.email,
              role: 'student'
            }
          });
        }
      }

      const newStudent = await Student.create(fullName, email, contact, address, password);
      req.session.student = newStudent._id;
      req.session.role = 'student';
      
      res.status(201).json({ 
        message: "Signup successful",
        user: {
          _id: newStudent._id,
          username: newStudent.name,
          email: newStudent.email,
          role: 'student'
        }
      });
    }
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Error signing up: " + error.message });
  }
};

// API endpoint for login - returns JSON
exports.login = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const isInstructor = role === 'instructor';
    
    if (isInstructor) {
      const instructor = await InstructorModel.findActiveByEmail(email);
      if (!instructor) return res.status(400).json({ message: "Invalid email or password." });

      const match = await bcrypt.compare(password, instructor.hashed_password);
      if (match) {
        req.session.instructor = instructor._id;
        req.session.role = 'instructor';
        res.json({ 
          message: "Login successful",
          user: {
            _id: instructor._id,
            username: instructor.name,
            email: instructor.email,
            role: 'instructor'
          }
        });
      } else {
        res.status(400).json({ message: "Invalid email or password." });
      }
    } else {
      // Student login
      const student = await Student.findActiveByEmail(email);
      if (!student) return res.status(400).json({ message: "Invalid email or password." });

      const match = await bcrypt.compare(password, student.hashed_password);
      if (match) {
        req.session.student = student._id;
        req.session.role = 'student';
        res.json({ 
          message: "Login successful",
          user: {
            _id: student._id,
            username: student.name,
            email: student.email,
            role: 'student'
          }
        });
      } else {
        res.status(400).json({ message: "Invalid email or password." });
      }
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Error logging in: " + error.message });
  }
};

// Legacy endpoint - assumes student login
exports.loginStudent = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Student.findActiveByEmail(email);
    if (!user) return res.status(400).json({ message: "Invalid email or password." });

    const match = await bcrypt.compare(password, user.hashed_password);
    if (match) {
      req.session.student = user._id; // Store the Mongoose _id
      req.session.role = 'student';
      res.json({ 
        message: "Login successful",
        user: {
          _id: user._id,
          username: user.name,
          email: user.email,
          role: 'student'
        }
      });
    } else {
      res.status(400).json({ message: "Invalid email or password." });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Error logging in: " + error.message });
  }
};

// API endpoint to get current user info
exports.getCurrentUser = async (req, res) => {
  try {
    // Check if student or instructor is logged in
    if (req.session.student) {
      const userId = req.session.student;
      const user = await Student.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found." });
      return res.json({
        _id: user._id,
        username: user.name,
        email: user.email,
        role: 'student'
      });
    } else if (req.session.instructor) {
      const userId = req.session.instructor;
      const instructor = await InstructorModel.findById(userId);
      if (!instructor) return res.status(404).json({ message: "Instructor not found." });
      return res.json({
        _id: instructor._id,
        username: instructor.name,
        email: instructor.email,
        role: 'instructor'
      });
    } else {
      return res.status(401).json({ message: "Unauthorized." });
    }
  } catch (error) {
    console.error("Load user info error:", error);
    return res.status(500).json({ message: "Error fetching user: " + error.message });
  }
};

// API endpoint for logout
exports.logout = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }
    res.clearCookie('connect.sid');
    res.json({ message: "Logout successful" });
  });
};

// Backward compatibility - original loadUserInfo
exports.loadUserInfo = async (req, res) => {
  if (!req.session.student) {
    return res.status(403).send("Unauthorized.");
  }

  try {
    const userId = req.session.student;
    const user = await Student.findById(userId);
    if (!user) return res.status(404).send("User not found.");
    res.json(user);
  } catch (error) {
    console.error("Load user info error:", error);
    return res.status(500).send("Error fetching user: " + error.message);
  }
};
