"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArchivedScholarships = exports.ArchiveScholarship = exports.deleteScholarship = exports.updateScholar = exports.getScholarshipById = exports.getAllScholars = exports.updateExpiredScholarships = exports.createScholar = void 0;
const client_1 = require("@prisma/client");
const CreateScholar_1 = require("../Validators/CreateScholar");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const createScholar = async (req, res) => {
    try {
        const providerId = req.userId;
        if (!providerId) {
            return res.status(401).json({ message: "Unauthorized: provider id missing" });
        }
        const parsedBody = CreateScholar_1.createScholarSchema.parse(req.body);
        const { title, type, description, location, requirements, benefits, deadline } = parsedBody;
        const deadlineDate = new Date(deadline);
        const scholar = await prisma.scholarship.create({
            data: {
                title,
                type,
                description,
                location,
                requirements,
                benefits,
                deadline: deadlineDate,
                provider: { connect: { id: providerId } },
                status: client_1.ScholarshipStatus.ACTIVE
            }
        });
        return res.status(201).json({ success: true, message: "Scholarship Created", data: scholar });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return res.status(400).json({ message: "Invalid providerId (foreign key failed)" });
        }
        console.error("Error Create Scholar:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.createScholar = createScholar;
const updateExpiredScholarships = async () => {
    try {
        const now = new Date();
        const result = await prisma.scholarship.updateMany({
            where: {
                deadline: {
                    lt: now
                },
                status: client_1.ScholarshipStatus.ACTIVE
            },
            data: {
                status: client_1.ScholarshipStatus.EXPIRED
            }
        });
        console.log(`Updated ${result.count} expired scholarships`);
        return result;
    }
    catch (error) {
        console.error("Error updating expired scholarships:", error);
        throw error;
    }
};
exports.updateExpiredScholarships = updateExpiredScholarships;
const getAllScholars = async (req, res) => {
    try {
        // First, update any expired scholarships
        await (0, exports.updateExpiredScholarships)();
        // Then fetch all scholarships with updated statuses
        const scholars = await prisma.scholarship.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });
        return res.status(200).json({ success: true, data: scholars });
    }
    catch (error) {
        console.error("Error fetching scholarships:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.getAllScholars = getAllScholars;
const getScholarshipById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: "Scholarship ID is required" });
        }
        // First, update any expired scholarships
        await (0, exports.updateExpiredScholarships)();
        // Then fetch the specific scholarship
        const scholarship = await prisma.scholarship.findUnique({
            where: { id }
        });
        if (!scholarship) {
            return res.status(404).json({ success: false, message: "Scholarship not found" });
        }
        return res.status(200).json({ success: true, data: scholarship });
    }
    catch (error) {
        console.error("Error fetching scholarship:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.getScholarshipById = getScholarshipById;
const updateScholar = async (req, res) => {
    try {
        const providerId = req.userId;
        if (!providerId) {
            return res.status(401).json({ success: false, message: "Unauthorized: provider id missing" });
        }
        const { id } = req.params;
        const scholarshipId = id;
        if (!scholarshipId) {
            return res.status(400).json({ success: false, message: "Scholarship id is required" });
        }
        // Parse request body (you might want to add Zod validation here too)
        const { title, type, description, location, requirements, benefits, deadline } = req.body;
        // Check if scholarship exists and belongs to the provider
        const existingScholarship = await prisma.scholarship.findUnique({
            where: { id: scholarshipId }
        });
        if (!existingScholarship) {
            return res.status(404).json({ success: false, message: "Scholarship not found" });
        }
        if (existingScholarship.providerId !== providerId) {
            return res.status(403).json({ success: false, message: "Forbidden: You can only update your own scholarships" });
        }
        // Convert deadline to Date object
        const deadlineDate = new Date(deadline);
        // Update the scholarship
        const updatedScholarship = await prisma.scholarship.update({
            where: { id: scholarshipId },
            data: {
                title,
                type,
                description,
                location,
                requirements,
                benefits,
                deadline: deadlineDate,
            }
        });
        return res.status(200).json({
            success: true,
            message: "Scholarship updated successfully",
            data: updatedScholarship
        });
    }
    catch (error) {
        console.error("Error updating scholarship:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.updateScholar = updateScholar;
const deleteScholarship = async (req, res) => {
    try {
        const providerId = req.userId;
        if (!providerId) {
            return res.status(401).json({ success: false, message: "Unauthorized: provider id missing" });
        }
        const { id } = req.params;
        const scholarshipId = id;
        if (!scholarshipId) {
            return res.status(400).json({ success: false, message: "Invalid scholarship id" });
        }
        const scholarship = await prisma.scholarship.findUnique({
            where: { id: scholarshipId }
        });
        if (!scholarship) {
            return res.status(404).json({ success: false, message: "Scholarship not found" });
        }
        if (scholarship.providerId !== providerId) {
            return res.status(403).json({ success: false, message: "Forbidden: You can only delete your own scholarships" });
        }
        await prisma.scholarship.delete({ where: { id: scholarshipId } });
        return res.status(200).json({ success: true, message: "Scholarship deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting scholarship:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.deleteScholarship = deleteScholarship;
const ArchiveScholarship = async (req, res) => {
    try {
        const providerId = req.userId;
        if (!providerId) {
            return res.status(401).json({ success: false, message: "Unauthorized: provider id missing" });
        }
        const { id } = req.params;
        const scholarshipId = id;
        if (!scholarshipId) {
            return res.status(400).json({ success: false, message: "Invalid scholarship id" });
        }
        // Check scholarship existence
        const scholarship = await prisma.scholarship.findUnique({
            where: { id: scholarshipId }
        });
        if (!scholarship) {
            return res.status(404).json({ success: false, message: "Scholarship not found" });
        }
        if (scholarship.providerId !== providerId) {
            return res.status(403).json({ success: false, message: "Forbidden: You can only archive your own scholarships" });
        }
        // Create archive record
        const archivedScholarship = await prisma.archive.create({
            data: {
                scholarshipId: scholarship.id,
                title: scholarship.title,
                description: scholarship.description,
                providerId: scholarship.providerId,
                deadline: scholarship.deadline,
                location: scholarship.location,
                type: scholarship.type,
                benefits: scholarship.benefits,
                requirements: scholarship.requirements,
                originalStatus: scholarship.status,
                archivedBy: providerId,
                originalCreatedAt: scholarship.createdAt,
                originalUpdatedAt: scholarship.updatedAt,
            },
        });
        // Mark original scholarship as archived
        await prisma.scholarship.update({
            where: { id },
            data: { status: client_1.ScholarshipStatus.EXPIRED }
        });
        return res.status(200).json({
            success: true,
            message: "Scholarship archived successfully",
            data: archivedScholarship,
        });
    }
    catch (error) {
        console.error("Error archiving scholarship:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.ArchiveScholarship = ArchiveScholarship;
const getArchivedScholarships = async (req, res) => {
    try {
        const providerId = req.userId;
        if (!providerId) {
            return res.status(401).json({ success: false, message: "Unauthorized: provider id missing" });
        }
        const archivedScholarships = await prisma.archive.findMany({
            where: { providerId: providerId },
            orderBy: { archivedAt: "desc" },
        });
        return res.status(200).json({
            success: true,
            data: archivedScholarships,
        });
    }
    catch (error) {
        console.error("Error fetching archived scholarships:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.getArchivedScholarships = getArchivedScholarships;
