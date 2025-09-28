process.env.SUPABASE_URL = "http://fake-supabase-url";
process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-key";

import request from "supertest";
import express from "express";
import path from "path";
import fs from "fs";

import uploadRouter from "../src/routes/upload.routes";

// Mock auth middleware so tests bypass JWT
jest.mock("../src/middleware/auth", () => ({
    authenticate: jest.fn((req, res, next) => {
        req.userId = "test-user"; // fake user for testing
        next();
    }),
}));

// Mock Supabase client methods
jest.mock("@supabase/supabase-js", () => {
    const mStorage = {
        upload: jest.fn().mockResolvedValue({ data: { path: "fake/path" }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: "http://fake-url.com/file" } }),
        createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: "http://fake-url.com/signed" }, error: null }),
        createBucket: jest.fn().mockResolvedValue({ error: null }),
    };
    return {
        createClient: jest.fn(() => ({ storage: { from: jest.fn(() => mStorage) } })),
    };
});

describe("Upload Routes", () => {
    const app = express();
    app.use(express.json());
    app.use("/upload", uploadRouter);

    const testFilePath = path.join(__dirname, "testfile.pdf");

    beforeAll(() => {
        fs.writeFileSync(testFilePath, "dummy pdf content");
    });

    afterAll(() => {
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    });

    it("should upload a file successfully", async () => {
        const res = await request(app)
            .post("/upload/files")
            .attach("documents", testFilePath); // must match multer field name

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data[0]).toHaveProperty("fileUrl");
    });

    it("should reject request without files", async () => {
        const res = await request(app).post("/upload/files");
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/No files provided/i);
    });

    it("should return signed download URL", async () => {
        const res = await request(app)
            .post("/upload/download")
            .send({ storagePath: "fake/path" });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("downloadUrl");
        expect(res.body.downloadUrl).toMatch(/http:\/\/fake-url.com\/signed/);
    });

    it("should reject download without storagePath", async () => {
        const res = await request(app).post("/upload/download").send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Storage path is required/i);
    });
});
