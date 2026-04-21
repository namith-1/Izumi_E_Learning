const request = require("supertest");
const express = require("express");
const securityMiddleware = require("../../middleware/security");

const app = express();
app.use(securityMiddleware);
app.get("/test", (req, res) => res.send("ok"));

describe("Security Middleware (Comprehensive)", () => {
    describe("CORS Policies", () => {
        test("Should allow specific known origins", async () => {
            const origins = ["http://localhost:5173", "http://localhost:5000", "https://izumi-e-learning-frontend.onrender.com"];
            for (const origin of origins) {
                const res = await request(app).get("/test").set("Origin", origin);
                expect(res.headers["access-control-allow-origin"]).toBe(origin);
            }
        });

        test("Should allow requests with no origin (e.g. mobile/postman)", async () => {
            const res = await request(app).get("/test");
            expect(res.status).toBe(200);
            expect(res.headers["access-control-allow-origin"]).toBeUndefined();
        });

        test("Should reject malicious origins", async () => {
            const res = await request(app).get("/test").set("Origin", "http://hacker-domain.com");
            expect(res.status).toBe(500); // Handled by our error logic in security.js
        });

        test("Should handle OPTIONS preflight with correct headers", async () => {
            const res = await request(app)
                .options("/test")
                .set("Origin", "http://localhost:5173")
                .set("Access-Control-Request-Method", "PUT");
            
            expect(res.headers["access-control-allow-methods"]).toContain("PUT");
            expect(res.status).toBe(204); // Standard status for OPTIONS CORS
        });
    });

    describe("HTTP Security Headers (Helmet)", () => {
        test("Should include critical security headers", async () => {
            const res = await request(app).get("/test");
            expect(res.headers["x-content-type-options"]).toBe("nosniff");
            expect(res.headers["x-dns-prefetch-control"]).toBe("off");
            expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
            expect(res.headers["x-xss-protection"]).toBe("0"); // Modern Helmet default
            expect(res.headers["strict-transport-security"]).toBeDefined();
        });
    });
});
