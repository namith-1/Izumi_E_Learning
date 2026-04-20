const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const session = require("express-session");
const analyticsRoutes = require("../../routes/analyticsRoutes");
const Course = require("../../models/Course");
const Teacher = require("../../models/Teacher");
const Student = require("../../models/Student");
const Enrollment = require("../../models/Enrollment");

let mongoServer;
let app;
let testAdmin;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  app = express();
  app.use(express.json());
  app.use(session({ secret: "test", resave: false, saveUninitialized: true }));
  app.use((req, res, next) => {
    if (testAdmin) {
      req.session.user = {
        id: "60c728362d294d1f88c88888", // MOCK_ADMIN_ID
        role: "admin",
        name: "Izumi Admin",
        email: "admin@izumi.com"
      };
    }
    next();
  });
  app.use("/api/analytics", analyticsRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Course.deleteMany({});
  await Teacher.deleteMany({});
  await Student.deleteMany({});
  await Enrollment.deleteMany({});
  
  testAdmin = true;
});

describe("Analytics API", () => {
  test("GET /api/analytics/admin/overview - should return platform-wide stats", async () => {
    // Create some data
    await Student.create({ name: "S1", email: "s1@e.com", password: "p" });
    const t = await Teacher.create({ name: "T1", email: "t1@e.com", password: "p" });
    const c = await Course.create({
      title: "C1", subject: "S1", teacherId: t._id,
      rootModule: { id: "r1", title: "R" }, modules: { m1: { id: "m1", title: "M" } }
    });
    await Enrollment.create({ courseId: c._id, studentId: new mongoose.Types.ObjectId(), status: "enrolled" });

    const res = await request(app).get("/api/analytics/admin/overview");
    expect(res.status).toBe(200);
    expect(res.body.totals.students).toBe(1);
    expect(res.body.totals.instructors).toBe(1);
    expect(res.body.totals.courses).toBe(1);
    expect(res.body.totals.enrollments).toBe(1);
  });
});
