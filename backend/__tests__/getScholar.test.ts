import request from "supertest";
import express from "express";
import scholarRouter from "../src/routes/scholar.routes";


jest.mock("../src/middleware/auth", () => ({
    authenticate: (req: any, res: any, next: any) => next(),
}));

// Mock controller functions
jest.mock("../src/controllers/scholar.controller", () => ({
    createScholar: (req: any, res: any) => res.status(201).json({ message: "Scholar created" }),
    getAllScholars: (req: any, res: any) => res.status(200).json([{ id: 1, name: "Scholarship A" }]),
    getScholarshipById: (req: any, res: any) => res.status(200).json({ id: req.params.id, name: "Scholarship B" }),
    updateExpiredScholarshipsEndpoint: (req: any, res: any) => res.status(200).json({ message: "Expired updated" }),
    ArchiveScholarship: (req: any, res: any) => res.status(200).json({ message: "Scholar archived" }),
    updateScholar: (req: any, res: any) => res.status(200).json({ message: "Scholar updated" }),
    getArchivedScholarships: (req: any, res: any) => res.status(200).json([{ id: 2, name: "Archived Scholar" }]),
    getOrganizationScholarships: (req: any, res: any) => res.status(200).json([{ id: 3, name: "Org Scholar" }]),
    getPublicScholars: (req: any, res: any) => res.status(200).json([{ id: 4, name: "Public Scholar" }]),
    deleteScholarship: (req: any, res: any) => res.status(200).json({ message: "Scholar deleted" }),
    DeleteArchivedScholarship: (req: any, res: any) => res.status(200).json({ message: "Archived deleted" }),
    RestoreArchivedScholarship: (req: any, res: any) => res.status(200).json({ message: "Archived restored" }),
}));

// Create app for testing
const app = express();
app.use(express.json());
app.use("/scholars", scholarRouter);

describe("Scholar Routes", () => {
    it("should create a scholar", async () => {
        const res = await request(app).post("/scholars/create-scholar").send({ name: "New Scholar" });
        expect(res.status).toBe(201);
        expect(res.body.message).toBe("Scholar created");
    });

    it("should get all scholars", async () => {
        const res = await request(app).get("/scholars/get-scholars");
        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
    });

    it("should get a scholar by id", async () => {
        const res = await request(app).get("/scholars/get-scholarship/123");
        expect(res.status).toBe(200);
        expect(res.body.id).toBe("123");
    });

    it("should get public scholars", async () => {
        const res = await request(app).get("/scholars/public");
        expect(res.status).toBe(200);
        expect(res.body[0].name).toBe("Public Scholar");
    });

    it("should delete a scholar", async () => {
        const res = await request(app).delete("/scholars/delete-scholar/1");
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Scholar deleted");
    });
});
