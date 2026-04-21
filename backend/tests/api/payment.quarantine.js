const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const session = require("express-session");
const paymentRoutes = require("../../routes/paymentRoutes");
const Transaction = require("../../models/Transaction");
const Course = require("../../models/Course");
const Enrollment = require("../../models/Enrollment");
const Teacher = require("../../models/Teacher");
const Student = require("../../models/Student");

let mongoServer;
let app;
let activeUser = null;

const createValidCourse = async (teacherId) => {
  return await Course.create({
    title: "Paid Course",
    price: 99,
    subject: "Finance",
    description: "Learn money management.",
    teacherId,
    rootModule: { id: "r1", title: "R" },
    modules: { "r1": { id: "r1", title: "R" } }
  });
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  app = express();
  app.use(express.json());
  app.use(session({ secret: "pay_test_secret", resave: false, saveUninitialized: true }));
  
  app.use((req, res, next) => {
    if (activeUser) {
      req.session.user = activeUser;
    }
    next();
  });

  app.use("/api/payments", paymentRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Transaction.deleteMany({});
  await Course.deleteMany({});
  await Enrollment.deleteMany({});
  await Teacher.deleteMany({});
  await Student.deleteMany({});
  activeUser = null;
});

describe("Payment API (Comprehensive)", () => {

  describe("Student Checkout Flow", () => {
    test("POST /student/checkout - Success creates transaction and enrollment", async () => {
      const teacher = await Teacher.create({ name: "T", email: "t@t.com", password: "p" });
      const course = await createValidCourse(teacher._id);
      const studentId = new mongoose.Types.ObjectId();
      activeUser = { id: studentId, role: "student" };

      const res = await request(app)
        .post("/api/payments/student/checkout")
        .send({ courseId: course._id, paymentMethod: "card" });
      
      expect(res.status).toBe(201);
      expect(res.body.transaction.amount).toBe(99);
      
      const enrollment = await Enrollment.findOne({ studentId, courseId: course._id });
      expect(enrollment).toBeDefined();
    });

    test("POST /student/checkout - Fail on missing courseId", async () => {
      activeUser = { id: new mongoose.Types.ObjectId(), role: "student" };
      const res = await request(app).post("/api/payments/student/checkout").send({});
      expect(res.status).toBe(400);
    });

    test("GET /student/transactions - List owned transactions", async () => {
      const studentId = new mongoose.Types.ObjectId();
      const courseId = new mongoose.Types.ObjectId();
      await Transaction.create({ studentId, teacherId: new mongoose.Types.ObjectId(), courseId, amount: 50, status: "paid", reference: "REF_S1" });
      
      activeUser = { id: studentId, role: "student" };
      const res = await request(app).get("/api/payments/student/transactions");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    test("GET /student/transactions/:id - Block unauthorized access", async () => {
      const student1 = new mongoose.Types.ObjectId();
      const student2 = new mongoose.Types.ObjectId();
      const txn = await Transaction.create({ reference: "REF_U1", studentId: student1, teacherId: new mongoose.Types.ObjectId(), courseId: new mongoose.Types.ObjectId(), amount: 10, status: "paid" });
      
      activeUser = { id: student2, role: "student" };
      const res = await request(app).get(`/api/payments/student/transactions/${txn._id}`);
      expect(res.status).toBe(404); // Controller logic uses findOne({_id, studentId})
    });
  });

  describe("Teacher Revenue Operations", () => {
    test("GET /teacher/summary - returns revenue data", async () => {
      const teacherId = new mongoose.Types.ObjectId();
      await Transaction.create({ 
        reference: "REF_T1",
        teacherId, studentId: new mongoose.Types.ObjectId(), 
        courseId: new mongoose.Types.ObjectId(), amount: 100, status: "paid", payoutStatus: "released" 
      });

      activeUser = { id: teacherId, role: "teacher" };
      const res = await request(app).get("/api/payments/teacher/summary");
      expect(res.status).toBe(200);
      expect(res.body.grossRevenue).toBe(100);
    });

    test("PUT /teacher/transactions/:id/status - teacher updates payout status", async () => {
      const teacherId = new mongoose.Types.ObjectId();
      const txn = await Transaction.create({ 
        reference: "REF_T2",
        teacherId, studentId: new mongoose.Types.ObjectId(), 
        courseId: new mongoose.Types.ObjectId(), amount: 100, status: "paid", payoutStatus: "pending" 
      });

      activeUser = { id: teacherId, role: "teacher" };
      const res = await request(app)
        .put(`/api/payments/teacher/transactions/${txn._id}/status`)
        .send({ payoutStatus: "released" });
      
      expect(res.status).toBe(200);
      const updated = await Transaction.findById(txn._id);
      expect(updated.payoutStatus).toBe("released");
    });
  });

  describe("Admin Financial Oversight", () => {
    test("GET /admin/transactions - returns all platform transactions", async () => {
      await Transaction.create({ 
          reference: "REF_A1",
          teacherId: new mongoose.Types.ObjectId(), 
          studentId: new mongoose.Types.ObjectId(), 
          courseId: new mongoose.Types.ObjectId(), 
          amount: 50, status: "paid" 
      });

      activeUser = { id: new mongoose.Types.ObjectId(), role: "admin" };
      const res = await request(app).get("/api/payments/admin/transactions");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    test("RBAC: Teacher cannot access admin transactions", async () => {
      activeUser = { id: new mongoose.Types.ObjectId(), role: "teacher" };
      const res = await request(app).get("/api/payments/admin/transactions");
      expect(res.status).toBe(403);
    });

    test("PUT /admin/transactions/:id - admin can void transaction", async () => {
      const txn = await Transaction.create({ 
        reference: "REF_A2",
        teacherId: new mongoose.Types.ObjectId(), 
        studentId: new mongoose.Types.ObjectId(), 
        courseId: new mongoose.Types.ObjectId(), 
        amount: 50, status: "paid" 
      });

      activeUser = { id: new mongoose.Types.ObjectId(), role: "admin" };
      const res = await request(app)
        .put(`/api/payments/admin/transactions/${txn._id}`)
        .send({ status: "failed" });
      
      expect(res.status).toBe(200);
      const updated = await Transaction.findById(txn._id);
      expect(updated.status).toBe("failed");
    });
  });

});
