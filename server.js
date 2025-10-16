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

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Serve root-level static files
app.use(express.static(path.join(__dirname)));
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
const studentCourseRoutes = require("./routes/studentCourseRoutes");
const CourseView = require("./routes/courseRoutes");
const Comments = require("./routes/comments");
const qna = require("./routes/questions.js");
const gamifyRoutes = require("./routes/gamifyRoutes");
const instructorCourseRoutes = require("./routes/instructorCourseRoutes");
const adminRoutes = require("./routes/adminRoutes");
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
app.use("/", studentCourseRoutes);
app.use("/", CourseView);
app.use("/coms", Comments);
app.use("/", qna); // All question routes
app.use("/", gamifyRoutes);
app.use("/", instructorCourseRoutes);
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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
