import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { signToken } from "../middleware/auth";
import { prisma } from "../lib/db";
import { withDatabaseRetry, handleDatabaseError } from "../lib/databaseHealth";
import { Resend } from "resend";
import crypto from "crypto";
import { buildVerificationEmail } from "../Email/design.controller";


const resend = new Resend(process.env.RESEND_API_KEY);

const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
}



export const resendVerificationEmail = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.isVerified) {
            return res.status(400).json({ message: "User is already verified" });
        }

        // Remove any existing tokens for this user
        await prisma.verificationToken.deleteMany({ where: { userId: user.id } });

        // Generate new token
        const token = generateToken();
        await prisma.verificationToken.create({
            data: {
                token,
                userId: user.id,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60)
            }
        });

        // Send user to the backend verify endpoint which will validate the token
        // and then redirect to the frontend with the result (status=success|error).
        const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
        const verifyUrl = `${backendUrl}/users/verify?token=${token}`;

        const msg = buildVerificationEmail(user.fullname, verifyUrl);
        await resend.emails.send({
            from: "onboarding@resend.dev",
            to: email,
            subject: "Verify your email",
            html: msg.html,
            text: msg.text
        });

        return res.status(200).json({ message: "Verification email resent" });
    } catch (error) {
        console.log("Error Resend Verification Email: ", error);
        return res.status(500).json({ message: "Failed to resend verification email" });
    }
};

export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        const dbToken = await prisma.verificationToken.findUnique({
            where: { token: String(token) },
        });

        if (!dbToken || dbToken.expiresAt < new Date()) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // Mark user verified and fetch their id/email/role so we can sign an auth token
        const updatedUser = await prisma.user.update({
            where: { id: dbToken.userId },
            data: { isVerified: true },
            select: { id: true, email: true, role: true }
        });

        await prisma.verificationToken.deleteMany({
            where: { userId: dbToken.userId }
        });

        // Create an auth token and set it as an HTTP-only cookie so the user is logged in immediately
        try {
            if (updatedUser) {
                const authToken = signToken({ id: String(updatedUser.id), email: updatedUser.email, role: (updatedUser.role as any) || 'STUDENT' });
                res.cookie('authToken', authToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                    maxAge: 24 * 60 * 60 * 1000,
                    path: '/'
                });
            }
        } catch (cookieErr) {
            console.log('Failed to set auth cookie after verification:', cookieErr);
        }

        // Redirect user to the frontend verify page so the UI can show a success message
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const redirectUrl = `${clientUrl}/verify?status=success&email=${encodeURIComponent(updatedUser?.email || '')}`;
        return res.redirect(redirectUrl);
    } catch (error) {
        console.log("Error Verify Email: ", error);
        return res.redirect(`${process.env.CLIENT_URL}/verify?status=error`);
    }
}

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
        const token = generateToken();
        await prisma.verificationToken.create({
            data: {
                token,
                userId: response.id,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60)
            }
        });

        // Build backend verify URL (so clicking the link hits the server to validate the token)
        const backendUrl2 = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
        const verifyUrl2 = `${backendUrl2}/users/verify?token=${token}`;

        const msg2 = buildVerificationEmail(fullname, verifyUrl2);
        await resend.emails.send({
            from: "onboarding@resend.dev",
            to: email,
            subject: "Verify your email",
            html: msg2.html,
            text: msg2.text
        });

        return res.status(201).json({
            success: true,
            message: "User registered. Please check your email for verification.",
            response
        });

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
            if (!user.isVerified) {
                throw new Error("EMAIL_NOT_VERIFIED");
            }

            // Exclude sensitive fields
            const { password: _, ...safeUser } = user;

            // Generate token
            const token = signToken({ id: user.id, email: user.email, role: user.role });

            return { safeUser, token };
        });


        res.cookie('authToken', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            path: '/'
        });

        // Don't send token in response body for security
        return res.status(200).json({
            success: true,
            user: result.safeUser,
            message: "Login successful"
        });

    } catch (error: any) {
        console.log("Error User Login: ", error);

        // Normalize the message (some errors might be wrapped)
        const msg = error?.message || String(error);

        if (msg === "INVALID_CREDENTIALS") {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        if (msg === "EMAIL_NOT_VERIFIED") {
            // Return a clear machine-detectable response for frontend to show a toast
            return res.status(403).json({ message: "Email is not verified. Please check your inbox." });
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

