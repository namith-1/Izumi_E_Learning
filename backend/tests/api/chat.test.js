const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const session = require("express-session");
const chatRoutes = require("../../routes/chatRoutes");
const Message = require("../../models/Message");
const Enrollment = require("../../models/Enrollment");
const Course = require("../../models/Course");
const Student = require("../../models/Student");
const Teacher = require("../../models/Teacher");

let mongoServer;
let app;
let activeUser = null;

const createValidCourse = async (teacherId) => {
  return await Course.create({
    title: "Chat Course",
    subject: "Communication",
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
  app.use(session({ secret: "chat_test_secret", resave: false, saveUninitialized: true }));
  
  app.use((req, res, next) => {
    if (activeUser) {
      req.session.user = activeUser;
    }
    next();
  });

  app.use("/api/chat", chatRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Message.deleteMany({});
  await Enrollment.deleteMany({});
  await Course.deleteMany({});
  await Student.deleteMany({});
  await Teacher.deleteMany({});
  activeUser = null;
});

describe("Chat API (Comprehensive)", () => {

  describe("Messaging & Privacy", () => {
    test("GET /unread-count - Accurate counting of unread messages", async () => {
      const studentId = new mongoose.Types.ObjectId();
      const teacherId = new mongoose.Types.ObjectId();
      const courseId = new mongoose.Types.ObjectId();
      
      await Message.create({ courseId, senderId: teacherId, receiverId: studentId, senderRole: "teacher", senderName: "T", content: "M1", read: false });
      await Message.create({ courseId, senderId: teacherId, receiverId: studentId, senderRole: "teacher", senderName: "T", content: "M2", read: true });

      activeUser = { id: studentId, role: "student" };
      const res = await request(app).get("/api/chat/unread-count");
      expect(res.status).toBe(200);
      expect(res.body.unreadCount).toBe(1);
    });

    test("GET /:courseId/messages - isolation: Student A cannot read Student B chat", async () => {
      const teacherId = new mongoose.Types.ObjectId();
      const course = await createValidCourse(teacherId);
      const studentA = new mongoose.Types.ObjectId();
      const studentB = new mongoose.Types.ObjectId();

      await Enrollment.create({ courseId: course._id, studentId: studentA });
      await Enrollment.create({ courseId: course._id, studentId: studentB });

      // Message between Teacher and Student B
      await Message.create({ courseId: course._id, senderId: teacherId, receiverId: studentB, senderRole: "teacher", senderName: "T", content: "Private" });

      activeUser = { id: studentA, role: "student" };
      const res = await request(app).get(`/api/chat/${course._id}/messages?otherUserId=${teacherId}`);
      
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0); // Student A sees nothing of Student B's chat
    });

    test("GET /:courseId/messages - Block access if not enrolled", async () => {
      const teacherId = new mongoose.Types.ObjectId();
      const course = await createValidCourse(teacherId);
      
      activeUser = { id: new mongoose.Types.ObjectId(), role: "student" };
      const res = await request(app).get(`/api/chat/${course._id}/messages?otherUserId=${teacherId}`);
      expect(res.status).toBe(403);
    });
  });

  describe("Instructor Operations", () => {
    test("GET /:courseId/conversations - List students who messaged instructor", async () => {
      const teacherId = new mongoose.Types.ObjectId();
      const studentId = new mongoose.Types.ObjectId();
      const course = await createValidCourse(teacherId);
      
      await Student.create({ _id: studentId, name: "Student Demo", email: "s@d.com", password: "p" });
      await Message.create({ 
        courseId: course._id, senderId: studentId, receiverId: teacherId, 
        senderRole: "student", senderName: "Student Demo", content: "Hi", read: false 
      });

      activeUser = { id: teacherId, role: "teacher" };
      const res = await request(app).get(`/api/chat/${course._id}/conversations`);
      
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].studentName).toBe("Student Demo");
      expect(res.body[0].unreadCount).toBe(1);
    });

    test("RBAC: Student cannot access conversation list", async () => {
      const courseId = new mongoose.Types.ObjectId();
      activeUser = { id: new mongoose.Types.ObjectId(), role: "student" };
      const res = await request(app).get(`/api/chat/${courseId}/conversations`);
      expect(res.status).toBe(403);
    });
  });

  describe("Security Boundaries", () => {
    test("Unauthenticated access should be blocked", async () => {
      activeUser = null;
      const res = await request(app).get("/api/chat/unread-count");
      expect(res.status).toBe(401);
    });
  });

});
