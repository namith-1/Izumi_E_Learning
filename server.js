const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const path = require("path");
const cors = require("cors");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 4000;
const adminLoginPath = process.env.ADMIN_LOGIN_PATH || "/-nsstn123-admin/login";

// CORS configuration with credentials support
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4000',
  'http://localhost:4000/', // Add trailing slash versions just in case
  'http://127.0.0.1:4000/'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin requests, Postman, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin) || process.env.CORS_ORIGIN === '*') {
      callback(null, true);
    } else {
      console.warn(`[CORS] Rejected origin: ${origin}`);
      callback(null, true); // Allow anyway for development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve React static files from the client build directory (for production)
const clientBuildPath = path.join(__dirname, "client", "build");
const fs = require("fs");

// Only serve static files if build directory exists (production mode)
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
}

// For development, also serve static assets from other locations if needed
app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/updateStudent",
  express.static(path.join(__dirname, "views", "updateStudent"))
);
 
// Also expose the updateStudent views directory so callers can request
// /updateStudent/restore.html directly (some pages/linking expect direct file access).
app.use(
  "/updateStudent",
  express.static(path.join(__dirname, "views", "updateStudent"))
);
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "change-this-in-production-secure-key-123456789",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

const db = require(__dirname + "/required/db");

const authRoutes = require("./routes/authRoutes");
const instructorRoutes = require("./routes/instructorRoutes");
const updateStudentRoutes = require("./routes/updateStudentRoutes");
const studentRoutes = require("./routes/student/studentRoutes");
const CourseView = require("./routes/courseRoutes");
const Comments = require("./routes/comments");
const qna = require("./routes/questions.js");
const gamifyRoutes = require("./routes/gamifyRoutes");
const instructorCourseRoutes = require("./routes/instructorCourseRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const commonInstructor = require("./routes/instructor/commonRoutes.js");
const magazineController = require("./controllers/magazineController");
const courseInfoInstructor = require("./routes/instructor/courseInfoRoutes");
const contactAdminRoutes = require("./routes/instructor/contactRoutes.js");
const goalRoutes = require("./routes/goalRoutes");
const consistencyRoutes = require("./routes/consistencyRoutes");

app.get("/magazines", magazineController.index);

app.use("/", authRoutes); // post(login,signup) , get(/,home,login,signup)
app.use("/", instructorRoutes); // All instructor routes
app.use("/", updateStudentRoutes); // No change in URLs, handled as-is
app.use("/", studentRoutes);
app.use("/", CourseView);
app.use("/coms", Comments);
app.use("/", qna); // All question routes
app.use("/", gamifyRoutes);
app.use("/", instructorCourseRoutes);
app.use("/admin/auth", adminAuthRoutes); // Admin authentication routes
app.use("/admin", adminRoutes); // Admin routes
app.use("/api", commonInstructor);
app.use("/", courseInfoInstructor);
app.use("/contact-admin", contactAdminRoutes);
// Goals API
app.use("/api/goals", goalRoutes);
// Consistency API (student consistency calendar dates)
app.use("/api/consistency", consistencyRoutes);
// Load course and modules
//course/id gets the course and modules as json to build the tree for both view_course and coure_edit
//included instructorCourseRoutes.js

// Serve React app for all non-API routes (production mode only)
app.get("*", (req, res) => {
  // If it's an API route that wasn't matched, return 404
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  
  // In production, serve React index.html
  const indexPath = path.join(clientBuildPath, "index.html");
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  
  // In development (no build), provide helpful message
  res.status(404).json({
    error: "React app not built. Run 'npm run dev:full' to start development server with React dev server.",
    message: "For development: npm run dev:full",
    message2: "For production: npm run client:build then npm start"
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  // ✅ Added Console Output for Admin Path
  console.log(`🔑 Admin Login Path: http://localhost:${port}${adminLoginPath}`);
});
