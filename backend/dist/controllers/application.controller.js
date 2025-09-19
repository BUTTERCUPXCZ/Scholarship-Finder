"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateApplicationStatus = exports.getScholarshipApplications = exports.withdrawApplication = exports.getApplicationById = exports.getUserApplications = exports.submitApplication = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Submit an application for a scholarship
 */
const submitApplication = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { scholarshipId, personalStatement, documents = [], Firstname, Middlenae, Lastname, Email, Phone, Address, City } = req.body;
        if (!scholarshipId) {
            return res.status(400).json({ message: 'Scholarship ID is required' });
        }
        // Validate required applicant fields
        if (!Firstname || !Lastname || !Email || !Phone || !Address || !City) {
            return res.status(400).json({ message: 'Applicant first name, last name, email, phone, address and city are required' });
        }
        // Check if scholarship exists and is active
        const scholarship = await prisma.scholarship.findUnique({
            where: { id: scholarshipId },
        });
        if (!scholarship) {
            return res.status(404).json({ message: 'Scholarship not found' });
        }
        if (scholarship.status !== 'ACTIVE') {
            return res.status(400).json({ message: 'This scholarship is no longer accepting applications' });
        }
        // Check if deadline has passed
        if (new Date() > scholarship.deadline) {
            return res.status(400).json({ message: 'Application deadline has passed' });
        }
        // Check if user already applied
        const existingApplication = await prisma.application.findFirst({
            where: {
                userId,
                scholarshipId,
            },
        });
        if (existingApplication) {
            return res.status(400).json({ message: 'You have already applied for this scholarship' });
        }
        // Create application with documents
        const application = await prisma.application.create({
            data: {
                userId,
                scholarshipId,
                // Map applicant personal fields required by schema
                Firstname,
                Middlenae: Middlenae || '',
                Lastname,
                Email,
                Phone,
                Address,
                City,
                status: 'SUBMITTED',
                documents: documents.length > 0 ? {
                    create: documents.map(doc => ({
                        filename: doc.filename,
                        contentType: doc.contentType,
                        size: doc.size,
                        fileUrl: doc.fileUrl,
                        storagePath: doc.storagePath,
                    }))
                } : undefined
            },
            include: {
                documents: true,
                scholarship: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        deadline: true,
                        location: true,
                        benefits: true,
                        requirements: true,
                        type: true,
                        status: true,
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: application
        });
    }
    catch (error) {
        console.error('Submit application error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.submitApplication = submitApplication;
/**
 * Get user's applications
 */
const getUserApplications = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const applications = await prisma.application.findMany({
            where: { userId },
            include: {
                documents: true,
                scholarship: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        deadline: true,
                        location: true,
                        benefits: true,
                        requirements: true,
                        type: true,
                        status: true,
                    }
                }
            },
            orderBy: { submittedAt: 'desc' }
        });
        res.status(200).json({
            success: true,
            data: applications
        });
    }
    catch (error) {
        console.error('Get user applications error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getUserApplications = getUserApplications;
/**
 * Get application by ID
 */
const getApplicationById = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const application = await prisma.application.findFirst({
            where: {
                id,
                userId, // Ensure user can only access their own applications
            },
            include: {
                documents: true,
                scholarship: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        deadline: true,
                        location: true,
                        benefits: true,
                        requirements: true,
                        type: true,
                        status: true,
                    }
                }
            }
        });
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        res.status(200).json({
            success: true,
            data: application
        });
    }
    catch (error) {
        console.error('Get application by ID error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getApplicationById = getApplicationById;
/**
 * Withdraw application
 */
const withdrawApplication = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const application = await prisma.application.findFirst({
            where: {
                id,
                userId,
            },
        });
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        if (application.status === 'ACCEPTED' || application.status === 'REJECTED') {
            return res.status(400).json({
                message: 'Cannot withdraw an application that has been processed'
            });
        }
        // Delete the application and associated documents
        await prisma.application.delete({
            where: { id },
        });
        res.status(200).json({
            success: true,
            message: 'Application withdrawn successfully'
        });
    }
    catch (error) {
        console.error('Withdraw application error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.withdrawApplication = withdrawApplication;
/**
 * Get applications for a scholarship (for organization)
 */
const getScholarshipApplications = async (req, res) => {
    try {
        const userId = req.userId;
        const { scholarshipId } = req.params;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // Verify that the scholarship belongs to the requesting organization
        const scholarship = await prisma.scholarship.findFirst({
            where: {
                id: scholarshipId,
                providerId: userId,
            },
        });
        if (!scholarship) {
            return res.status(404).json({
                message: 'Scholarship not found or you do not have access to it'
            });
        }
        const applications = await prisma.application.findMany({
            where: { scholarshipId },
            include: {
                documents: true,
                user: {
                    select: {
                        id: true,
                        fullname: true,
                        email: true,
                    }
                }
            },
            orderBy: { submittedAt: 'desc' }
        });
        res.status(200).json({
            success: true,
            data: applications
        });
    }
    catch (error) {
        console.error('Get scholarship applications error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getScholarshipApplications = getScholarshipApplications;
/**
 * Update application status (for organization)
 */
const updateApplicationStatus = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { status } = req.body;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!['PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        // Verify that the application's scholarship belongs to the requesting organization
        const application = await prisma.application.findUnique({
            where: { id },
            include: {
                scholarship: true,
            }
        });
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        if (application.scholarship.providerId !== userId) {
            return res.status(403).json({
                message: 'You do not have permission to update this application'
            });
        }
        const updatedApplication = await prisma.application.update({
            where: { id },
            data: { status },
            include: {
                documents: true,
                user: {
                    select: {
                        id: true,
                        fullname: true,
                        email: true,
                    }
                }
            }
        });
        res.status(200).json({
            success: true,
            message: 'Application status updated successfully',
            data: updatedApplication
        });
    }
    catch (error) {
        console.error('Update application status error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateApplicationStatus = updateApplicationStatus;
