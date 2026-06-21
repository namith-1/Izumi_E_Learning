const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const session = require("express-session");
const adminRoutes = require("../../routes/adminRoutes");
const Student = require("../../models/Student");
const Teacher = require("../../models/Teacher");
const Course = require("../../models/Course");
const Enrollment = require("../../models/Enrollment");
const Reviewer = require("../../models/Reviewer");

let mongoServer;
let app;
let activeUser = null;

const MOCK_ADMIN_ID = "60c728362d294d1f88c88888";
const ADMIN_EMAIL = "admin@izumi.com";

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  app = express();
  app.use(express.json());
  app.use(session({ secret: "admin_test_secret", resave: false, saveUninitialized: true }));

  // Middleware to simulate current user session
  app.use((req, res, next) => {
    if (activeUser) {
      req.session.user = activeUser;
    }
    next();
  });

  app.use("/api/admin", adminRoutes);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await Student.deleteMany({});
  await Teacher.deleteMany({});
  await Course.deleteMany({});
  await Enrollment.deleteMany({});
  await Reviewer.deleteMany({});
  activeUser = { id: MOCK_ADMIN_ID, role: "admin", name: "Izumi Admin", email: ADMIN_EMAIL };
});

describe("Admin Dashboard API (Comprehensive)", () => {

  describe("User Management", () => {
    test("GET /api/admin/users - Admin can fetch all students and teachers", async () => {
      await Student.create({ name: "S1", email: "s1@test.com", password: "p" });
      await Teacher.create({ name: "T1", email: "t1@test.com", password: "p" });
      
      const res = await request(app).get("/api/admin/users");
      expect(res.status).toBe(200);
      expect(res.body.students.length).toBe(1);
      expect(res.body.teachers.length).toBe(1);
    });

    test("RBAC: Student cannot fetch all users", async () => {
      activeUser = { id: new mongoose.Types.ObjectId(), role: "student" };
      const res = await request(app).get("/api/admin/users");
      // middleware/authMiddleware.js likely returns 403 for non-admins
      expect(res.status).toBe(403); 
    });

    test("POST /api/admin/reviewers - Successfully create reviewer", async () => {
      const res = await request(app)
        .post("/api/admin/reviewers")
        .send({ name: "R1", email: "r1@test.com", password: "password123", specialization: "Test" });
      
      expect(res.status).toBe(201);
      const inDb = await Reviewer.findOne({ email: "r1@test.com" });
      expect(inDb).toBeDefined();
    });

    test("PUT /api/admin/users/student/:id - Update student details", async () => {
      const student = await Student.create({ name: "Old", email: "old@test.com", password: "p" });
      const res = await request(app)
        .put(`/api/admin/users/student/${student._id}`)
        .send({ name: "New Name", email: "new@test.com" });
      
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("New Name");
    });

    test("PUT /api/admin/users/student/:id - Fail on duplicate email", async () => {
      await Student.create({ name: "Existing", email: "dup@test.com", password: "p" });
      const target = await Student.create({ name: "Target", email: "target@test.com", password: "p" });
      
      const res = await request(app)
        .put(`/api/admin/users/student/${target._id}`)
        .send({ email: "dup@test.com" });
      
      expect(res.status).toBe(400); // Controller uses try-catch/save or filter
    });

    test("PUT /api/admin/users/student/:id - 404 on non-existent student", async () => {
      const res = await request(app)
        .put(`/api/admin/users/student/${new mongoose.Types.ObjectId()}`)
        .send({ name: "Ghost" });
      
      expect(res.status).toBe(404);
    });

    test("DELETE /api/admin/users/teacher/:id - Deleting teacher should delete their courses", async () => {
      const teacher = await Teacher.create({ name: "T1", email: "t@t.com", password: "p" });
      await Course.create({ 
        title: "C1", subject: "S1", teacherId: teacher._id, 
        rootModule: { id: "r1" }, modules: { "r1": {} } 
      });

      const res = await request(app).delete(`/api/admin/users/teacher/${teacher._id}`);
      expect(res.status).toBe(200);
      
      const courses = await Course.find({ teacherId: teacher._id });
      expect(courses.length).toBe(0);
    });
  });

  describe("Course & Enrollment Analytics", () => {
    test("GET /api/admin/courses - Returns complex analytics", async () => {
      const teacher = await Teacher.create({ name: "T1", email: "t@t.com", password: "p" });
      const course = await Course.create({ 
        title: "Analytics Course", subject: "S1", teacherId: teacher._id, 
        rootModule: { id: "r1" }, modules: { "r1": { quizScore: 80 } },
        approvalStatus: "approved"
      });
      await Enrollment.create({ studentId: new mongoose.Types.ObjectId(), courseId: course._id, completionStatus: "completed" });

      const res = await request(app).get("/api/admin/courses");
      expect(res.status).toBe(200);
      expect(res.body[0].totalStudentsRegistered).toBe(1);
      expect(res.body[0].studentsCompleted).toBe(1);
      expect(res.body[0].instructorName).toBe("T1");
    });

    test("GET /api/admin/enrollments/student/:email - Student lookup", async () => {
      const student = await Student.create({ name: "Search", email: "search@test.com", password: "p" });
      const course = await Course.create({ 
        title: "C1", subject: "S1", teacherId: new mongoose.Types.ObjectId(), 
        rootModule: { id: "r1" }, modules: { "r1": {} } 
      });
      await Enrollment.create({ studentId: student._id, courseId: course._id });

      const res = await request(app).get("/api/admin/enrollments/student/search@test.com");
      expect(res.status).toBe(200);
      expect(res.body.student.name).toBe("Search");
      expect(res.body.enrollments.length).toBe(1);
    });

    test("GET /api/admin/enrollments/student/:email - 404 on missing student", async () => {
      const res = await request(app).get("/api/admin/enrollments/student/none@test.com");
      expect(res.status).toBe(404);
    });

    test("GET /api/admin/teachers/courses/:email - Teacher lookup", async () => {
      const teacher = await Teacher.create({ name: "T1", email: "t1@test.com", password: "p" });
      await Course.create({ 
        title: "T Course", subject: "S1", teacherId: teacher._id, 
        rootModule: { id: "r1" }, modules: { "r1": {} } 
      });

      const res = await request(app).get("/api/admin/teachers/courses/t1@test.com");
      expect(res.status).toBe(200);
      expect(res.body.teacher.name).toBe("T1");
      expect(res.body.courses[0].title).toBe("T Course");
    });
  });

    const adminEndpoints = [
      { method: "get", url: "/users" },
      { method: "get", url: "/enrollments" },
      { method: "get", url: "/courses" },
      { method: "get", url: "/reviewers" },
      { method: "post", url: "/reviewers" },
      { method: "put", url: "/users/student/60c728362d294d1f88c88888" },
      { method: "delete", url: "/users/student/60c728362d294d1f88c88888" },
      { method: "put", url: "/courses/60c728362d294d1f88c88888" },
      { method: "delete", url: "/courses/60c728362d294d1f88c88888" },
    ];

    test.each(adminEndpoints)("%s %s should be blocked for Students", async ({ method, url }) => {
      activeUser = { id: new mongoose.Types.ObjectId(), role: "student" };
      const res = await request(app)[method]("/api/admin" + url);
      expect(res.status).toBe(403);
    });

    test.each(adminEndpoints)("%s %s should be blocked for Teachers", async ({ method, url }) => {
      activeUser = { id: new mongoose.Types.ObjectId(), role: "teacher" };
      const res = await request(app)[method]("/api/admin" + url);
      expect(res.status).toBe(403);
    });

    test.each(adminEndpoints)("%s %s should be blocked for Reviewers", async ({ method, url }) => {
      activeUser = { id: new mongoose.Types.ObjectId(), role: "reviewer" };
      const res = await request(app)[method]("/api/admin" + url);
      expect(res.status).toBe(403);
    });

});
