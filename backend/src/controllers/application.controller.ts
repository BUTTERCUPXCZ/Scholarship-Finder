import { Request, Response } from 'express';
import { submitApplicationSchema } from '../Validators/Application';
import { prisma } from '../lib/db';
import { withRLS } from '../lib/rls';
import { createNotification } from '../services/notification';
import { emitNotificationToUser } from '../services/socketService';
import { redisClient } from '../config/redisClient';
import { createAuditLog, extractIpAddress } from '../services/auditLog.service';
import { AuditAction, AuditStatus } from '@prisma/client';

/**
 * Submit an application for a scholarship
 */
export const submitApplication = async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Validate request body using Zod
        const parseResult = submitApplicationSchema.safeParse(req.body);
        if (!parseResult.success) {
            const formatted = parseResult.error.format();
            return res.status(400).json({ message: 'Invalid request data', errors: formatted });
        }

        const { scholarshipId, documents = [], Firstname, Middlename, Lastname, Email, Phone, Address, City } = parseResult.data;

        const role = (req.user?.role as string) || 'STUDENT';

        // Both queries in one atomic RLS-enforced transaction.
        const application = await withRLS(userId, role, async (tx) => {
            const existingApplication = await tx.application.findFirst({
                where: { userId, scholarshipId },
            });

            if (existingApplication) return null;

            return tx.application.create({
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
        });

        if (!application) {
            return res.status(400).json({ message: 'You have already applied for this scholarship' });
        }

        // ✅ Invalidate user's applications cache after successful submission
        const userCacheKey = `user:applications:${userId}`;
        try {
            await redisClient.del(userCacheKey);
            console.log("Cache invalidated ✅", userCacheKey);
        } catch (redisError) {
            console.log("Redis cache invalidation failed, but continuing:", redisError);
        }

        createAuditLog({ userId, action: AuditAction.APPLICATION_SUBMITTED, resource: 'APPLICATION', resourceId: application.id, ipAddress: extractIpAddress(req), userAgent: (req.headers?.['user-agent'] as string) ?? 'unknown', status: AuditStatus.SUCCESS, metadata: { scholarshipId } }).catch((err) => console.error('[AuditLog] Write failed:', err));
        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: application
        });

    } catch (error) {
        console.error('Submit application error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Get user's applications
 */
export const getUserApplications = async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // ✅ Unique Redis cache key for user's applications
        const cacheKey = `user:applications:${userId}`;

        // ✅ Check if data exists in Redis (with error handling)
        let cached = null;
        try {
            cached = await redisClient.get(cacheKey);
            if (cached) {
                console.log("Cache hit ✅", cacheKey);
                return res.status(200).json(JSON.parse(cached as string));
            }
        } catch (redisError) {
            console.log("Redis cache read failed, proceeding without cache:", redisError);
        }

        const role = (req.user?.role as string) || 'STUDENT';
        const applications = await withRLS(userId, role, async (tx) => {
            return tx.application.findMany({
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
        });

        const responseData = {
            success: true,
            data: applications,
        };

        // ✅ Store in Redis for 5 minutes (300s) (with error handling)
        try {
            await redisClient.setEx(cacheKey, 300, JSON.stringify(responseData));
            console.log("Cache stored ✅", cacheKey);
        } catch (redisError) {
            console.log("Redis cache write failed, but continuing:", redisError);
        }

        return res.status(200).json(responseData);

    } catch (error) {
        console.error('Get user applications error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Get application by ID
 */
export const getApplicationById = async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const role = (req.user?.role as string) || 'STUDENT';
        const application = await withRLS(userId, role, async (tx) => {
            return tx.application.findFirst({
                where: { id, userId },
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
        });

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        res.status(200).json({
            success: true,
            data: application
        });

    } catch (error) {
        console.error('Get application by ID error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Withdraw application
 */
export const withdrawApplication = async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const role = (req.user?.role as string) || 'STUDENT';

        // Both queries in one atomic RLS-enforced transaction.
        let applicationFound = false;
        let alreadyProcessed = false;

        await withRLS(userId, role, async (tx) => {
            const application = await tx.application.findFirst({
                where: { id, userId },
            });

            if (!application) return;
            applicationFound = true;

            if (application.status === 'ACCEPTED' || application.status === 'REJECTED') {
                alreadyProcessed = true;
                return;
            }

            await tx.application.delete({ where: { id } });
        });

        if (!applicationFound) {
            return res.status(404).json({ message: 'Application not found' });
        }

        if (alreadyProcessed) {
            return res.status(400).json({
                message: 'Cannot withdraw an application that has been processed'
            });
        }

        // ✅ Invalidate user's applications cache after withdrawal
        const userCacheKey = `user:applications:${userId}`;
        try {
            await redisClient.del(userCacheKey);
            console.log("Cache invalidated after withdrawal ✅", userCacheKey);
        } catch (redisError) {
            console.log("Redis cache invalidation failed, but continuing:", redisError);
        }

        createAuditLog({ userId, action: AuditAction.APPLICATION_WITHDRAWN, resource: 'APPLICATION', resourceId: id, ipAddress: extractIpAddress(req), userAgent: (req.headers?.['user-agent'] as string) ?? 'unknown', status: AuditStatus.SUCCESS }).catch((err) => console.error('[AuditLog] Write failed:', err));
        res.status(200).json({
            success: true,
            message: 'Application withdrawn successfully'
        });

    } catch (error) {
        console.error('Withdraw application error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Get applications for a scholarship (for organization)
 */
export const getScholarshipApplications = async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        const { scholarshipId } = req.params;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const role = (req.user?.role as string) || 'ORGANIZATION';

        // Both queries in one atomic RLS-enforced transaction.
        // application_select_org policy enforces org sees only their scholarship's apps.
        let scholarshipFound = false;
        let applications: Awaited<ReturnType<typeof prisma.application.findMany>> = [];

        await withRLS(userId, role, async (tx) => {
            const scholarship = await tx.scholarship.findFirst({
                where: { id: scholarshipId, providerId: userId },
            });

            if (!scholarship) return;
            scholarshipFound = true;

            applications = await tx.application.findMany({
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
        });

        if (!scholarshipFound) {
            return res.status(404).json({
                message: 'Scholarship not found or you do not have access to it'
            });
        }

        res.status(200).json({
            success: true,
            data: applications
        });

    } catch (error) {
        console.error('Get scholarship applications error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Update application status (for organization)
 */
export const updateApplicationStatus = async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        const { id } = req.params;
        const { status } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!['PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const role = (req.user?.role as string) || 'ORGANIZATION';

        let applicationFound = false;
        let permissionDenied = false;
        let updatedApplication: Awaited<ReturnType<typeof prisma.application.update>> | null = null;
        let notificationPayload: { userId: string; notificationMessage: string; notificationType: 'SCHOLARSHIP_ACCEPTED' | 'SCHOLARSHIP_REJECTED' | 'SCHOLARSHIP_UPDATE' } | null = null;
        let applicationUserId = '';
        let applicationScholarshipId = '';

        // Run the status update AND notification insert in one atomic RLS transaction.
        // Socket.IO emit happens outside after the transaction commits.
        await withRLS(userId, role, async (tx) => {
            const application = await tx.application.findUnique({
                where: { id },
                include: { scholarship: true, user: true }
            });

            if (!application) return;
            applicationFound = true;
            applicationUserId = application.userId;
            applicationScholarshipId = application.scholarshipId;

            if (application.scholarship.providerId !== userId) {
                permissionDenied = true;
                return;
            }

            updatedApplication = await tx.application.update({
                where: { id },
                data: { status },
                include: {
                    documents: true,
                    scholarship: true,
                    user: { select: { id: true, fullname: true, email: true } }
                }
            });

            let notificationMessage = '';
            let notificationType: 'SCHOLARSHIP_ACCEPTED' | 'SCHOLARSHIP_REJECTED' | 'SCHOLARSHIP_UPDATE' = 'SCHOLARSHIP_UPDATE';

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

            // Inline notification insert (notification_insert_any policy allows this).
            await tx.notification.create({
                data: {
                    userId: application.userId,
                    message: notificationMessage,
                    type: notificationType,
                    read: false,
                }
            });

            notificationPayload = { userId: application.userId, notificationMessage, notificationType };
        });

        if (!applicationFound) {
            return res.status(404).json({ message: 'Application not found' });
        }

        if (permissionDenied) {
            return res.status(403).json({
                message: 'You do not have permission to update this application'
            });
        }

        // Emit Socket.IO notification after the transaction has committed.
        if (notificationPayload !== null) {
            const payload = notificationPayload as { userId: string; notificationMessage: string; notificationType: string };
            emitNotificationToUser(payload.userId, {
                message: payload.notificationMessage,
                type: payload.notificationType,
            });
        }

        // ✅ Invalidate user's applications cache after status update
        const userCacheKey = `user:applications:${applicationUserId}`;
        try {
            await redisClient.del(userCacheKey);
            console.log("Cache invalidated after status update ✅", userCacheKey);
        } catch (redisError) {
            console.log("Redis cache invalidation failed, but continuing:", redisError);
        }

        createAuditLog({ userId, action: AuditAction.APPLICATION_STATUS_UPDATED, resource: 'APPLICATION', resourceId: id, ipAddress: extractIpAddress(req), userAgent: (req.headers?.['user-agent'] as string) ?? 'unknown', status: AuditStatus.SUCCESS, metadata: { newStatus: status, applicationUserId, scholarshipId: applicationScholarshipId } }).catch((err) => console.error('[AuditLog] Write failed:', err));
        res.status(200).json({
            success: true,
            message: 'Application status updated successfully',
            data: updatedApplication
        });

    } catch (error) {
        console.error('Update application status error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


export const getApplicants = async (req: Request, res: Response) => {
    try {
        const userID = req.userId as string; // org/provider ID
        if (!userID) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const role = (req.user?.role as string) || 'ORGANIZATION';

        // RLS application_select_org policy ensures org sees only applicants
        // for their own scholarships.
        const scholarshipsWithApplicants = await withRLS(userID, role, async (tx) => {
            return tx.scholarship.findMany({
                where: { providerId: userID },
                include: {
                    applications: {
                        include: {
                            user: true,
                            documents: true,
                        },
                    },
                },
            });
        });

        return res.status(200).json(scholarshipsWithApplicants);
    } catch (error) {
        console.error("Error fetching applicants:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};