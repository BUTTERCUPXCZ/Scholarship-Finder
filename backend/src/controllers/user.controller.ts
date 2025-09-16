import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { signToken } from "../middleware/auth";

const prisma = new PrismaClient();

export const userRegister = async (req: Request, res: Response) => {
    try {
        const { fullname, email, password, role } = req.body;

        if (!fullname || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const response = await prisma.user.create({
            data: { fullname, email, password: hashPassword, role }
        });

        res.status(201).json({ success: true, user: response });
    } catch (error) {
        console.log("Error User Registration: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}


export const userLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Exclude sensitive fields
        const { password: _, ...safeUser } = user;

        // Generate token
        const token = signToken({ id: user.id, email: user.email, role: user.role });

        // Set HTTP-only cookie (secure token storage)
        res.cookie('authToken', token, {
            httpOnly: true,          // Cannot be accessed by JavaScript
            secure: process.env.NODE_ENV === 'production', // HTTPS only in production
            sameSite: 'lax',         // Allow cross-site requests for login flows
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            path: '/'                // Available for all routes
        });

        // Don't send token in response body for security
        res.status(200).json({
            success: true,
            user: safeUser,
            message: "Login successful"
        });

    } catch (error) {
        console.log("Error User Login: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Logout endpoint to clear the HTTP-only cookie
export const userLogout = async (req: Request, res: Response) => {
    try {
        // Clear the auth cookie
        res.clearCookie('authToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/'
        });

        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        console.log("Error User Logout: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Get current user profile (for authentication check)
export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return null;
        }

        const user = await prisma.user.findUnique({
            where: { id: String(userId) },
            select: {
                id: true,
                fullname: true,
                email: true,
                role: true
            }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.log("Error Get Current User: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Update user profile
export const updateUserProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { fullname, email } = req.body;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!fullname || !email) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if email is already taken by another user
        const existingUser = await prisma.user.findFirst({
            where: {
                email,
                NOT: { id: String(userId) }
            }
        });

        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        const updatedUser = await prisma.user.update({
            where: { id: String(userId) },
            data: { fullname, email },
            select: {
                id: true,
                fullname: true,
                email: true,
                role: true
            }
        });

        res.status(200).json({
            success: true,
            user: updatedUser
        });
    } catch (error) {
        console.log("Error Update User Profile: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Get organization statistics
export const getOrganizationStats = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Verify user is an organization
        const user = await prisma.user.findUnique({
            where: { id: String(userId) },
            select: { role: true }
        });

        if (!user || user.role !== 'ORGANIZATION') {
            return res.status(403).json({ message: "Access denied. Organizations only." });
        }

        // Get scholarship statistics
        const [totalScholarships, activeScholarships, archivedScholarships] = await Promise.all([
            prisma.scholarship.count({
                where: { providerId: String(userId) }
            }),
            prisma.scholarship.count({
                where: {
                    providerId: String(userId),
                    status: 'ACTIVE'
                }
            }),
            prisma.archive.count({
                where: { providerId: String(userId) }
            })
        ]);

        // Get total applications for all scholarships by this organization
        const totalApplications = await prisma.application.count({
            where: {
                scholarship: {
                    providerId: String(userId)
                }
            }
        });

        const stats = {
            totalScholarships,
            activeScholarships,
            archivedScholarships,
            totalApplications
        };

        res.status(200).json(stats);
    } catch (error) {
        console.log("Error Get Organization Stats: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

