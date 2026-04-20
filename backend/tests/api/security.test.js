const request = require("supertest");
const express = require("express");
const securityMiddleware = require("../../middleware/security");

const app = express();
app.use(securityMiddleware);
app.get("/test", (req, res) => res.send("ok"));

describe("Security Middleware", () => {
    test("Should include Helmet security headers", async () => {
        const res = await request(app).get("/test");
        expect(res.headers["x-content-type-options"]).toBe("nosniff");
        expect(res.headers["x-dns-prefetch-control"]).toBe("off");
        expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
    });

    test("Should respond with CORS headers for allowed origins", async () => {
        const res = await request(app)
            .get("/test")
            .set("Origin", "http://localhost:5173");
        expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
        expect(res.headers["access-control-allow-credentials"]).toBe("true");
    });

    test("Should reject blocked origins", async () => {
        const res = await request(app)
            .get("/test")
            .set("Origin", "http://malicious-site.com");
        expect(res.status).toBe(500); // CORS error middleware in security.js
    });
});
