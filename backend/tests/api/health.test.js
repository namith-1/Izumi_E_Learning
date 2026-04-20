const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");

// Setup a mock app for testing the route logic
let app;
let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    app = express();
    app.get("/api/health", (req, res) => {
        const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
        res.json({
            status: "ok",
            database: dbStatus,
            timestamp: new Date().toISOString()
        });
    });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe("Health Check API", () => {
    test("GET /api/health - returns 200 and connected status", async () => {
        const res = await request(app).get("/api/health");
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("ok");
        expect(res.body.database).toBe("connected");
    });
});
