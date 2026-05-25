const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const session = require("express-session");
const enrollmentRoutes = require("../../routes/enrollmentRoutes");
const Enrollment = require("../../models/Enrollment");
const Course = require("../../models/Course");
const Student = require("../../models/Student");
const Teacher = require("../../models/Teacher");

let mongoServer;
let app;
let activeUser = null;

const createValidCourse = async (teacherId) => {
  return await Course.create({
    title: "Enrollment Test",
    subject: "Tech",
    description: "Sample description for testing.",
    teacherId: teacherId || new mongoose.Types.ObjectId(),
    rootModule: { id: "r1", title: "R" },
    modules: { "r1": { id: "r1", title: "R", type: "folder" }, "m1": { id: "m1", title: "M", type: "text" } }
  });
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  app = express();
  app.use(express.json());
  app.use(session({ secret: "enroll_test_secret", resave: false, saveUninitialized: true }));
  
  app.use((req, res, next) => {
    if (activeUser) {
      req.session.user = activeUser;
    }
    next();
  });

  app.use("/api/enrollment", enrollmentRoutes);
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
  await Enrollment.deleteMany({});
  await Course.deleteMany({});
  await Student.deleteMany({});
  await Teacher.deleteMany({});
  activeUser = null;
});

describe("Enrollment API (Comprehensive)", () => {

  describe("Lifecycle & Access", () => {
    test("POST /api/enrollment/enroll - Successfully enroll student", async () => {
      const course = await createValidCourse();
      const student = await Student.create({ name: "S1", email: "s@s.com", password: "p" });
      activeUser = { id: student._id, role: "student" };

      const res = await request(app).post("/api/enrollment/enroll").send({ courseId: course._id });
      expect(res.status).toBe(201);
      
      const dbEntry = await Enrollment.findOne({ studentId: student._id, courseId: course._id });
      expect(dbEntry).toBeDefined();
    });

    test("POST /api/enrollment/enroll - Block duplicate enrollment", async () => {
      const course = await createValidCourse();
      const student = await Student.create({ name: "S2", email: "s2@s.com", password: "p" });
      activeUser = { id: student._id, role: "student" };

      await request(app).post("/api/enrollment/enroll").send({ courseId: course._id });
      const res = await request(app).post("/api/enrollment/enroll").send({ courseId: course._id });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Already enrolled in this course");
    });

    test("GET /api/enrollment/my-courses - Returns list of enrolled courses", async () => {
      const teacher = await Teacher.create({ name: "T1", email: "t1@t.com", password: "p" });
      const course = await createValidCourse(teacher._id);
      const student = await Student.create({ name: "S3", email: "s3@s.com", password: "p" });
      activeUser = { id: student._id, role: "student" };

      await Enrollment.create({ studentId: student._id, courseId: course._id });
      
      const res = await request(app).get("/api/enrollment/my-courses");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    test("GET /api/enrollment/:courseId - Returns specific enrollment details", async () => {
      const course = await createValidCourse();
      const student = await Student.create({ name: "S4", email: "s4@s.com", password: "p" });
      activeUser = { id: student._id, role: "student" };

      await Enrollment.create({ studentId: student._id, courseId: course._id, completionStatus: "in-progress" });
      
      const res = await request(app).get(`/api/enrollment/${course._id}`);
      expect(res.status).toBe(200);
      expect(res.body.completionStatus).toBe("in-progress");
    });

    test("RBAC: Cannot access another student's enrollment detail", async () => {
       const course = await createValidCourse();
       const otherStudent = await Student.create({ name: "S_Other", email: "other@s.com", password: "p" });
       await Enrollment.create({ studentId: otherStudent._id, courseId: course._id });
       
       const student = await Student.create({ name: "S_Me", email: "me@s.com", password: "p" });
       activeUser = { id: student._id, role: "student" };
       const res = await request(app).get(`/api/enrollment/${course._id}`);
       expect(res.status).toBe(404);
    });
  });

  describe("Progress & Completion", () => {
    test("PUT /api/enrollment/:courseId/progress - Update module completion", async () => {
      const course = await createValidCourse();
      const student = await Student.create({ name: "S5", email: "s5@s.com", password: "p" });
      activeUser = { id: student._id, role: "student" };

      await Enrollment.create({ studentId: student._id, courseId: course._id });

      const res = await request(app)
        .put(`/api/enrollment/${course._id}/progress`)
        .send({ moduleId: "m1", completed: true, timeSpent: 120 });
      
      expect(res.status).toBe(200);
      const updated = await Enrollment.findOne({ studentId: student._id, courseId: course._id });
      const mod = updated.modules_status.find(m => m.moduleId === "m1");
      expect(mod.completed).toBe(true);
    });

    test("PUT /api/enrollment/:courseId/progress - Handling non-existent module", async () => {
      const course = await createValidCourse();
      const student = await Student.create({ name: "S6", email: "s6@s.com", password: "p" });
      activeUser = { id: student._id, role: "student" };
      await Enrollment.create({ studentId: student._id, courseId: course._id });

      const res = await request(app)
        .put(`/api/enrollment/${course._id}/progress`)
        .send({ moduleId: "ghost", completed: true });
      
      expect(res.status).toBe(200); 
    });

    test("Workflow: Progress update leads to course completion", async () => {
      const teacher = await Teacher.create({ name: "T_WF", email: `wf_${Date.now()}@t.com`, password: "p" });
      const course = await Course.create({
        title: "Pass Test", subject: "S", teacherId: teacher._id,
        rootModule: { id: "r1" },
        modules: { 
          "r1": { id: "r1", type: "folder" },
          "m1": { id: "m1", type: "quiz", weight: 100, passingScore: 70 }
        },
        passingPolicy: { mode: "threshold", passingThreshold: 100 }
      });

      const student = await Student.create({ name: "S7", email: "s7@s.com", password: "p" });
      activeUser = { id: student._id, role: "student" };
      await Enrollment.create({ studentId: student._id, courseId: course._id });

      const res = await request(app)
        .put(`/api/enrollment/${course._id}/progress`)
        .send({ moduleId: "m1", completed: true, quizScore: 85 });
      
      expect(res.status).toBe(200);
      expect(res.body.passStatus).toBe("pass");
      expect(res.body.completionStatus).toBe("completed");
    });
  });

  describe("Ratings & Feedback", () => {
    test("PUT /api/enrollment/:courseId/rating - Successfully rate course", async () => {
      const course = await createValidCourse();
      const student = await Student.create({ name: "S8", email: "s8@s.com", password: "p" });
      activeUser = { id: student._id, role: "student" };

      await Enrollment.create({ studentId: student._id, courseId: course._id });

      const res = await request(app)
        .put(`/api/enrollment/${course._id}/rating`)
        .send({ rating: 5, review: "Excellent!" });
      
      expect(res.status).toBe(200);
      const updated = await Enrollment.findOne({ studentId: student._id, courseId: course._id });
      expect(updated.rating).toBe(5);
    });

    test("PUT /api/enrollment/:courseId/rating - Fail on invalid rating range", async () => {
      const course = await createValidCourse();
      const student = await Student.create({ name: "S9", email: "s9@s.com", password: "p" });
      activeUser = { id: student._id, role: "student" };
      await Enrollment.create({ studentId: student._id, courseId: course._id });

      const res = await request(app)
        .put(`/api/enrollment/${course._id}/rating`)
        .send({ rating: 6 });
      
      expect(res.status).toBe(400);
    });
  });

});
