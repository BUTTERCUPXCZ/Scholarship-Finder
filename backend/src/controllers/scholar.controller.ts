import { PrismaClient, ScholarshipStatus, Prisma } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const createScholar = async (req: Request, res: Response) => {
    try {
        // get provider id from authenticated user (set by auth middleware)
        const providerId = req.userId as string | undefined;

        // Debug log  console.log("Provider ID from request:", providerId); 

        const { title, type, description, location, requirements, benefits, deadline } = req.body;

        if (!providerId) {
            return res.status(401).json({ message: "Unauthorized: provider id missing" });
        }
        if (!title || !type || !description || !location || !requirements || !benefits || !deadline) {
            return res.status(400).json({ message: "All fields are required" });
        }



        const deadlineDate = new Date(deadline);
        if (deadlineDate <= new Date()) {
            return res.status(400).json({ message: "deadline must be in the future" });
        }

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
                status: ScholarshipStatus.ACTIVE
            }
        });

        return res.status(201).json({ success: true, message: "Scholarship Created", data: scholar });

    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return res.status(400).json({ message: "Invalid providerId (foreign key failed)" });
        }
        console.error("Error Create Scholar:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}


export const updateExpiredScholarships = async () => {
    try {
        const now = new Date();

        await prisma.scholarship.updateMany({
            where: {
                deadline: {
                    lt: now
                },
                status: ScholarshipStatus.ACTIVE
            },
            data: {
                status: ScholarshipStatus.EXPIRED
            }
        });
    } catch (error) {
        console.log("Error updating expired scholarships" + error);
    }
}