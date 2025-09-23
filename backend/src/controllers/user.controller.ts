import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { signToken } from "../middleware/auth";
import { prisma } from "../lib/db";
import { withDatabaseRetry, handleDatabaseError } from "../lib/databaseHealth";

export const userRegister = async (req: Request, res: Response) => {
    try {
        const { fullname, email, password, role } = req.body;

        if (!fullname || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Use database retry logic
        const response = await withDatabaseRetry(async () => {
            const existingUser = await prisma.user.findUnique({ where: { email } });

            if (existingUser) {
                throw new Error("USER_EXISTS");
            }

            const hashPassword = await bcrypt.hash(password, 10);

            return await prisma.user.create({
                data: { fullname, email, password: hashPassword, role }
            });
        });

        return res.status(201).json({ success: true, user: response });

    } catch (error: any) {
        console.log("Error User Registration: ", error);

        if (error.message === "USER_EXISTS") {
            return res.status(400).json({ message: "User already exists" });
        }

        const dbError = handleDatabaseError(error, "User Registration");
        return res.status(500).json({
            message: dbError.message,
            retryable: dbError.retryable
        });
    }
}


export const userLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const result = await withDatabaseRetry(async () => {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                throw new Error("INVALID_CREDENTIALS");
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new Error("INVALID_CREDENTIALS");
            }

            // Exclude sensitive fields
            const { password: _, ...safeUser } = user;

            // Generate token
            const token = signToken({ id: user.id, email: user.email, role: user.role });

            return { safeUser, token };
        });

        // Set HTTP-only cookie (secure token storage)
        // For cross-site requests (frontend hosted on a different origin),
        // browsers require SameSite=None and Secure to include cookies.
        res.cookie('authToken', result.token, {
            httpOnly: true, // Cannot be accessed by JavaScript
            secure: process.env.NODE_ENV === 'production', // HTTPS only in production
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // None in prod for cross-site
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            path: '/' // Available for all routes
        });

        // Don't send token in response body for security
        return res.status(200).json({
            success: true,
            user: result.safeUser,
            message: "Login successful"
        });

    } catch (error: any) {
        console.log("Error User Login: ", error);

        if (error.message === "INVALID_CREDENTIALS") {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const dbError = handleDatabaseError(error, "User Login");
        return res.status(500).json({
            message: dbError.message,
            retryable: dbError.retryable
        });
    }
}

// Logout endpoint to clear the HTTP-only cookie
export const userLogout = async (req: Request, res: Response) => {
    try {
        // Clear the auth cookie
        res.clearCookie('authToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
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
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await withDatabaseRetry(async () => {
            return await prisma.user.findUnique({
                where: { id: String(userId) },
                select: {
                    id: true,
                    fullname: true,
                    email: true,
                    role: true
                }
            });
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            success: true,
            user: user
        });

    } catch (error: any) {
        console.log("Error Get Current User: ", error);

        const dbError = handleDatabaseError(error, "Get Current User");
        return res.status(500).json({
            message: dbError.message,
            retryable: dbError.retryable
        });
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

