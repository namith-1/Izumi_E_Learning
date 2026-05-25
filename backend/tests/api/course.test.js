const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const session = require("express-session");
const courseRoutes = require("../../routes/courseRoutes");
const Student = require("../../models/Student");
const Teacher = require("../../models/Teacher");
const Course = require("../../models/Course");
const Enrollment = require("../../models/Enrollment");

let mongoServer;
let app;
let activeUser = null;

const createValidCourseData = (teacherId) => ({
  title: "Valid Course",
  subject: "Science",
  description: "A very long and descriptive text for testing.",
  teacherId: teacherId,
  rootModule: { id: "m1", title: "Root" },
  modules: { "m1": { id: "m1", title: "Root", type: "folder" } }
});

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  app = express();
  app.use(express.json());
  app.use(session({ secret: "course_test_secret", resave: false, saveUninitialized: true }));
  
  app.use((req, res, next) => {
    if (activeUser) {
      req.session.user = activeUser;
    }
    next();
  });

  app.use("/api/courses", courseRoutes);
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
  await Course.deleteMany({});
  await Teacher.deleteMany({});
  await Student.deleteMany({});
  await Enrollment.deleteMany({});
  activeUser = null;
});

describe("Course API (Comprehensive)", () => {

  describe("Course Catalog & Discovery", () => {
    const roles = [
      { role: "student", expectedCount: 1 }, // Only approved
      { role: "teacher", expectedCount: 2 }, // Own drafts + others approved
      { role: "admin", expectedCount: 2 }   // All
    ];

    test.each(roles)("GET /api/courses - Visibility check for %s", async ({ role, expectedCount }) => {
      const teacher = await Teacher.create({ name: "T1", email: "t@t.com", password: "p" });
      await Course.create({ ...createValidCourseData(teacher._id), title: "Approved", approvalStatus: "approved" });
      await Course.create({ ...createValidCourseData(teacher._id), title: "Pending", approvalStatus: "pending" });

      activeUser = { id: teacher._id, role: role };
      const res = await request(app).get("/api/courses");
      expect(res.status).toBe(200);
      // In our current controller logic, teachers/admins see all. 
      // Students see only approved.
      if (role === "student") {
        expect(res.body.length).toBe(1);
      } else {
        expect(res.body.length).toBe(2);
      }
    });

    test("GET /api/courses - Unauthenticated see only approved", async () => {
      const teacher = await Teacher.create({ name: "T1", email: "t@t.com", password: "p" });
      await Course.create({ ...createValidCourseData(teacher._id), title: "Approved", approvalStatus: "approved" });
      await Course.create({ ...createValidCourseData(teacher._id), title: "Draft", approvalStatus: "draft" });

      activeUser = null;
      const res = await request(app).get("/api/courses");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    test("GET /api/courses/:id - Authenticated user can see course detail", async () => {
      const teacher = await Teacher.create({ name: "T1", email: "t@t.com", password: "p" });
      const student = await Student.create({ name: "S1", email: "s@s.com", password: "p" });
      const course = await Course.create(createValidCourseData(teacher._id));
      
      activeUser = { id: student._id, role: "student" };
      const res = await request(app).get(`/api/courses/${course._id}`);
      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Valid Course");
    });
    
    test("GET /api/courses/:id - Fail on invalid ID format", async () => {
      const student = await Student.create({ name: "S1", email: "s@s.com", password: "p" });
      activeUser = { id: student._id, role: "student" };
      const res = await request(app).get("/api/courses/invalid-id");
      // Since cast error is caught by controller and returns 500 or 400
      expect([400, 500]).toContain(res.status);
    });
  });

  describe("Instructor Actions", () => {
    test("POST /api/courses - Instructor can create course", async () => {
      const teacher = await Teacher.create({ name: "T1", email: "t@t.com", password: "p" });
      activeUser = { id: teacher._id, role: "teacher" };

      const res = await request(app)
        .post("/api/courses")
        .send({ 
          courseTitle: "New Course", 
          courseDescription: "Desc",
          subject: "Math",
          rootModule: { id: "r1", title: "R" },
          modules: { "r1": { id: "r1", title: "R", type: "folder" } }
        });
      
      expect(res.status).toBe(201);
      expect(res.body.title).toBe("New Course");
    });

    test("PUT /api/courses/:id - Instructor can update their own course", async () => {
      const teacher = await Teacher.create({ name: "T1", email: "t@t.com", password: "p" });
      const course = await Course.create(createValidCourseData(teacher._id));
      activeUser = { id: teacher._id, role: "teacher" };

      const res = await request(app)
        .put(`/api/courses/${course._id}`)
        .send({ 
          courseTitle: "Updated Title",
          rootModule: { id: "r1", title: "R" },
          modules: { "r1": { id: "r1", title: "R", type: "folder" } }
        });
      
      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Updated Title");
    });

    test("PUT /api/courses/:id - Instructor CANNOT update others' courses", async () => {
      const teacher1 = await Teacher.create({ name: "T1", email: "t1@t.com", password: "p" });
      const teacher2 = await Teacher.create({ name: "T2", email: "t2@t.com", password: "p" });
      const course = await Course.create(createValidCourseData(teacher1._id));
      
      activeUser = { id: teacher2._id, role: "teacher" };
      const res = await request(app)
        .put(`/api/courses/${course._id}`)
        .send({ courseTitle: "Hacked" });
      
      expect(res.status).toBe(403);
    });

    test("GET /api/courses/analytics - Returns aggregated stats for instructor", async () => {
      const teacher = await Teacher.create({ name: "T1", email: "t@t.com", password: "p" });
      const course = await Course.create(createValidCourseData(teacher._id));
      await Enrollment.create({ studentId: new mongoose.Types.ObjectId(), courseId: course._id });

      activeUser = { id: teacher._id, role: "teacher" };
      const res = await request(app).get("/api/courses/analytics");
      
      expect(res.status).toBe(200);
      expect(res.body[0].title).toBe("Valid Course"); // Align with createValidCourseData
      expect(res.body[0].totalStudentsEnrolled).toBe(1);
    });
  });

  describe("Validation & Security", () => {
    test("POST /api/courses - Fail if user is not teacher", async () => {
      const student = await Student.create({ name: "S1", email: "s@s.com", password: "p" });
      activeUser = { id: student._id, role: "student" };
      const res = await request(app).post("/api/courses").send({ title: "S", subject: "S" });
      expect(res.status).toBe(403);
    });

    test("POST /api/courses - Fail if subject is missing", async () => {
      const teacher = await Teacher.create({ name: "T1", email: "t@t.com", password: "p" });
      activeUser = { id: teacher._id, role: "teacher" };

      const res = await request(app)
        .post("/api/courses")
        .send({ courseTitle: "Untitled" });
      
      expect(res.status).toBe(400); // Joi/Schema validation error
    });
  });

});
