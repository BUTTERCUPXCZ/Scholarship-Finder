import { Request, Response } from 'express';
import { submitApplicationSchema } from '../Validators/Application';
import { prisma } from '../lib/db';

// Interface for application document from frontend
interface ApplicationDocumentData {
    filename: string;
    contentType: string;
    size: number;
    fileUrl: string;
    storagePath: string;
}

// Interface for application submission
interface ApplicationSubmissionData {
    scholarshipId: string;
    // Prisma Application model requires applicant fields
    Firstname: string;
    Middlename?: string;
    Lastname: string;
    Email: string;
    Phone: string;
    Address: string;
    City: string;
    // personalStatement is not stored in Prisma Application model; accept but ignore
    personalStatement?: string;
    documents?: ApplicationDocumentData[];
}

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

    } catch (error) {
        console.error('Update application status error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};