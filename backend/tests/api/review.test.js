const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const session = require("express-session");
const reviewRoutes = require("../../routes/reviewRoutes");
const Course = require("../../models/Course");
const Teacher = require("../../models/Teacher");
const Reviewer = require("../../models/Reviewer");

let mongoServer;
let app;
let activeUser = null;

const createValidDraft = (teacherId) => ({
  title: "Valid Course Title",
  subject: "CS",
  description: "Detailed description that passes pre-checks.",
  teacherId,
  approvalStatus: "draft",
  rootModule: { id: "r1", title: "R" },
  modules: { 
    "r1": { id: "r1", title: "R", type: "folder" },
    "m1": { id: "m1", title: "M1", type: "text" }
  }
});

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  app = express();
  app.use(express.json());
  app.use(session({ secret: "review_test_secret", resave: false, saveUninitialized: true }));
  
  app.use((req, res, next) => {
    if (activeUser) {
      req.session.user = activeUser;
    }
    next();
  });

  app.use("/api/review", reviewRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Course.deleteMany({});
  await Teacher.deleteMany({});
  await Reviewer.deleteMany({});
  activeUser = null;
});

describe("Review API (Comprehensive)", () => {

  describe("Instructor Submission & Checks", () => {
    test("POST /submit/:id - Success after passing pre-checks", async () => {
      const teacher = await Teacher.create({ name: "T1", email: "t@t.com", password: "p" });
      const course = await Course.create(createValidDraft(teacher._id));
      activeUser = { id: teacher._id, role: "teacher", name: "T1" };

      const res = await request(app).post(`/api/review/submit/${course._id}`);
      expect(res.status).toBe(200);
      expect(res.body.course.approvalStatus).toBe("awaited");
    });

    test("POST /submit/:id - Fail on failed pre-checks (missing title)", async () => {
      const teacher = await Teacher.create({ name: "T1", email: "t@t.com", password: "p" });
      const course = await Course.create({ 
          ...createValidDraft(teacher._id), 
          title: " " // Invalid title
      });
      activeUser = { id: teacher._id, role: "teacher" };

      const res = await request(app).post(`/api/review/submit/${course._id}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("pre-checks");
    });

    test("GET /my-status - Teacher checks their own submissions", async () => {
      const teacher = await Teacher.create({ name: "T1", email: "t@t.com", password: "p" });
      await Course.create({ ...createValidDraft(teacher._id), approvalStatus: "awaited" });

      activeUser = { id: teacher._id, role: "teacher" };
      const res = await request(app).get("/api/review/my-status");
      expect(res.status).toBe(200);
      expect(res.body[0].approvalStatus).toBe("awaited");
    });
  });

  describe("Reviewer Workflow", () => {
    test("GET /queue - returns only awaited courses", async () => {
      const teacher = await Teacher.create({ name: "T1", email: "t@t.com", password: "p" });
      await Course.create({ ...createValidDraft(teacher._id), title: "Awaited", approvalStatus: "awaited" });
      await Course.create({ ...createValidDraft(teacher._id), title: "Draft", approvalStatus: "draft" });

      activeUser = { id: new mongoose.Types.ObjectId(), role: "reviewer" };
      const res = await request(app).get("/api/review/queue");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    test("POST /course/:id/approve - Successfully approves awaited course", async () => {
      const teacher = await Teacher.create({ name: "T1", email: "t@t.com", password: "p" });
      const course = await Course.create({ ...createValidDraft(teacher._id), approvalStatus: "awaited" });
      const reviewerId = new mongoose.Types.ObjectId();
      activeUser = { id: reviewerId, role: "reviewer", name: "Reviewer 1" };

      const res = await request(app).post(`/api/review/course/${course._id}/approve`).send({ note: "Looks good" });
      expect(res.status).toBe(200);
      
      const updated = await Course.findById(course._id);
      expect(updated.approvalStatus).toBe("approved");
      expect(updated.reviewerId.toString()).toBe(reviewerId.toString());
    });

    test("POST /course/:id/reject - Fails without rejection note", async () => {
      const course = await Course.create({ title: "C", subject: "S", teacherId: new mongoose.Types.ObjectId(), approvalStatus: "awaited", rootModule: {id:"r"}, modules: {"r":{}} });
      activeUser = { id: new mongoose.Types.ObjectId(), role: "reviewer" };

      const res = await request(app).post(`/api/review/course/${course._id}/reject`).send({});
      expect(res.status).toBe(400); // Reason is required
    });

    test("GET /stats - Returns accurate platform review stats", async () => {
      await Course.create({ title: "A", subject: "S", teacherId: new mongoose.Types.ObjectId(), approvalStatus: "approved", rootModule: {id:"r"}, modules: {"r":{}} });
      await Course.create({ title: "P", subject: "S", teacherId: new mongoose.Types.ObjectId(), approvalStatus: "awaited", rootModule: {id:"r"}, modules: {"r":{}} });

      activeUser = { id: new mongoose.Types.ObjectId(), role: "reviewer" };
      const res = await request(app).get("/api/review/stats");
      expect(res.status).toBe(200);
      expect(res.body.approved).toBe(1);
      expect(res.body.pending).toBe(1); // Stats controller still uses 'pending' as key for awaited count
    });
  });

  describe("RBAC & Boundaries", () => {
    test("RBAC: Instructor cannot access review queue", async () => {
      activeUser = { id: new mongoose.Types.ObjectId(), role: "teacher" };
      const res = await request(app).get("/api/review/queue");
      expect(res.status).toBe(403);
    });

    test("Workflow: Cannot approve a draft course", async () => {
      const course = await Course.create({ title: "D", subject: "S", teacherId: new mongoose.Types.ObjectId(), approvalStatus: "draft", rootModule: {id:"r"}, modules: {"r":{}} });
      activeUser = { id: new mongoose.Types.ObjectId(), role: "reviewer" };

      const res = await request(app).post(`/api/review/course/${course._id}/approve`);
      expect(res.status).toBe(400);
    });
  });

});
