"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArchivedScholarships = exports.getOrganizationScholarships = exports.ArchiveScholarship = exports.deleteScholarship = exports.updateScholar = exports.getScholarshipById = exports.getAllScholars = exports.updateExpiredScholarshipsEndpoint = exports.updateExpiredScholarships = exports.createScholar = void 0;
const client_1 = require("@prisma/client");
const CreateScholar_1 = require("../Validators/CreateScholar");
const zod_1 = require("zod");
const db_1 = require("../lib/db");
const createScholar = async (req, res) => {
    try {
        const providerId = req.userId;
        if (!providerId) {
            return res.status(401).json({ message: "Unauthorized: provider id missing" });
        }
        const parsedBody = CreateScholar_1.createScholarSchema.parse(req.body);
        const { title, type, description, location, requirements, benefits, deadline } = parsedBody;
        const deadlineDate = new Date(deadline);
        const scholar = await db_1.prisma.scholarship.create({
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
        // Use a more efficient query with proper indexing
        const result = await db_1.prisma.scholarship.updateMany({
            where: {
                AND: [
                    { deadline: { lt: now } },
                    { status: client_1.ScholarshipStatus.ACTIVE }
                ]
            },
            data: {
                status: client_1.ScholarshipStatus.EXPIRED,
                updatedAt: now
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
// New endpoint for manually triggering expired scholarship updates
const updateExpiredScholarshipsEndpoint = async (req, res) => {
    try {
        const result = await (0, exports.updateExpiredScholarships)();
        return res.status(200).json({
            success: true,
            message: `Updated ${result.count} expired scholarships`,
            count: result.count
        });
    }
    catch (error) {
        console.error("Error updating expired scholarships:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.updateExpiredScholarshipsEndpoint = updateExpiredScholarshipsEndpoint;
const getAllScholars = async (req, res) => {
    try {
        // Parse query parameters for pagination and filtering
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 items per page
        const status = req.query.status;
        const type = req.query.type;
        const search = req.query.search;
        const skip = (page - 1) * limit;
        // Build where condition efficiently
        const whereCondition = {};
        if (status && ['ACTIVE', 'EXPIRED'].includes(status)) {
            whereCondition.status = status;
        }
        if (type) {
            whereCondition.type = {
                contains: type,
                mode: 'insensitive'
            };
        }
        if (search) {
            whereCondition.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { location: { contains: search, mode: 'insensitive' } }
            ];
        }
        // Use efficient query with proper indexing
        const [scholars, totalCount] = await Promise.all([
            db_1.prisma.scholarship.findMany({
                where: whereCondition,
                select: {
                    id: true,
                    title: true,
                    description: true,
                    deadline: true,
                    location: true,
                    type: true,
                    benefits: true,
                    requirements: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    providerId: true
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: limit
            }),
            db_1.prisma.scholarship.count({ where: whereCondition })
        ]);
        const totalPages = Math.ceil(totalCount / limit);
        return res.status(200).json({
            success: true,
            data: scholars,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
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
        const scholarship = await db_1.prisma.scholarship.findUnique({
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
        const existingScholarship = await db_1.prisma.scholarship.findUnique({
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
        const updatedScholarship = await db_1.prisma.scholarship.update({
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
        const scholarship = await db_1.prisma.scholarship.findUnique({
            where: { id: scholarshipId }
        });
        if (!scholarship) {
            return res.status(404).json({ success: false, message: "Scholarship not found" });
        }
        if (scholarship.providerId !== providerId) {
            return res.status(403).json({ success: false, message: "Forbidden: You can only delete your own scholarships" });
        }
        await db_1.prisma.scholarship.delete({ where: { id: scholarshipId } });
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
        const scholarship = await db_1.prisma.scholarship.findUnique({
            where: { id: scholarshipId }
        });
        if (!scholarship) {
            return res.status(404).json({ success: false, message: "Scholarship not found" });
        }
        if (scholarship.providerId !== providerId) {
            return res.status(403).json({ success: false, message: "Forbidden: You can only archive your own scholarships" });
        }
        // Create archive record
        const archivedScholarship = await db_1.prisma.archive.create({
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
        await db_1.prisma.scholarship.update({
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
const getOrganizationScholarships = async (req, res) => {
    try {
        const providerId = req.userId;
        if (!providerId) {
            return res.status(401).json({ success: false, message: "Unauthorized: provider id missing" });
        }
        const scholarships = await db_1.prisma.scholarship.findMany({
            where: {
                providerId: providerId
            },
            orderBy: { createdAt: "desc" },
            include: {
                applications: {
                    select: {
                        id: true,
                        status: true
                    }
                }
            }
        });
        return res.status(200).json({
            success: true,
            data: scholarships,
        });
    }
    catch (error) {
        console.error("Error fetching organization scholarships:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.getOrganizationScholarships = getOrganizationScholarships;
const getArchivedScholarships = async (req, res) => {
    try {
        const providerId = req.userId;
        if (!providerId) {
            return res.status(401).json({ success: false, message: "Unauthorized: provider id missing" });
        }
        const archivedScholarships = await db_1.prisma.archive.findMany({
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
