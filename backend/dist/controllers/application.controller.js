"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateApplicationStatus = exports.getScholarshipApplications = exports.withdrawApplication = exports.getApplicationById = exports.getUserApplications = exports.submitApplication = void 0;
const Application_1 = require("../Validators/Application");
const db_1 = require("../lib/db");
const notification_1 = require("../services/notification");
const submitApplication = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const parseResult = Application_1.submitApplicationSchema.safeParse(req.body);
        if (!parseResult.success) {
            const formatted = parseResult.error.format();
            return res.status(400).json({ message: 'Invalid request data', errors: formatted });
        }
        const { scholarshipId, documents = [], Firstname, Middlename, Lastname, Email, Phone, Address, City } = parseResult.data;
        const existingApplication = await db_1.prisma.application.findFirst({
            where: {
                userId,
                scholarshipId,
            },
        });
        if (existingApplication) {
            return res.status(400).json({ message: 'You have already applied for this scholarship' });
        }
        const application = await db_1.prisma.application.create({
            data: {
                userId,
                scholarshipId,
                Firstname,
                Middlename: Middlename || '',
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
const getUserApplications = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const applications = await db_1.prisma.application.findMany({
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
const getApplicationById = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const application = await db_1.prisma.application.findFirst({
            where: {
                id,
                userId,
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
const withdrawApplication = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const application = await db_1.prisma.application.findFirst({
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
        await db_1.prisma.application.delete({
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
const getScholarshipApplications = async (req, res) => {
    try {
        const userId = req.userId;
        const { scholarshipId } = req.params;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const scholarship = await db_1.prisma.scholarship.findFirst({
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
        const applications = await db_1.prisma.application.findMany({
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
        const application = await db_1.prisma.application.findUnique({
            where: { id },
            include: {
                scholarship: true,
                user: true
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
        const updatedApplication = await db_1.prisma.application.update({
            where: { id },
            data: { status },
            include: {
                documents: true,
                scholarship: true,
                user: {
                    select: {
                        id: true,
                        fullname: true,
                        email: true,
                    }
                }
            }
        });
        let notificationMessage = '';
        let notificationType = 'SCHOLARSHIP_UPDATE';
        switch (status) {
            case 'ACCEPTED':
                notificationMessage = `Congratulations! Your application for "${application.scholarship.title}" has been accepted.`;
                notificationType = 'SCHOLARSHIP_ACCEPTED';
                break;
            case 'REJECTED':
                notificationMessage = `Thank you for your interest. Your application for "${application.scholarship.title}" was not selected this time.`;
                notificationType = 'SCHOLARSHIP_REJECTED';
                break;
            case 'UNDER_REVIEW':
                notificationMessage = `Your application for "${application.scholarship.title}" is now under review.`;
                notificationType = 'SCHOLARSHIP_UPDATE';
                break;
            case 'PENDING':
                notificationMessage = `Your application for "${application.scholarship.title}" status has been updated to pending.`;
                notificationType = 'SCHOLARSHIP_UPDATE';
                break;
        }
        await (0, notification_1.createNotification)({
            userId: application.userId,
            message: notificationMessage,
            type: notificationType
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
