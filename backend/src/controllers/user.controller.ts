import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { signToken } from "../middleware/auth";
import { prisma } from "../lib/db";
import { withDatabaseRetry, withAuthRetry, handleDatabaseError } from "../lib/databaseHealth";
import { AuthPerformanceMonitor } from "../lib/authPerformanceMonitor";
import crypto from "crypto";
import { buildVerificationEmail, buildPasswordResetEmail } from "../Email/design.controller";
import { sendEmail } from "../lib/mailer";


const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
}

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();


export const resetPassword = async (req: Request, res: Response) => {
    const startTime = Date.now();

    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Optimized query - only select necessary fields
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true
            }
        });

        if (!user) {
            const duration = Date.now() - startTime;
            console.log(`❌ Password reset failed for non-existent user in ${duration}ms`);
            return res.status(404).json({ message: "User not found" });
        }

        const tokenEntry = await prisma.passwordResetToken.findFirst({
            where: { userId: user.id, token: otp },
            select: {
                id: true,
                expiresAt: true
            }
        });

        if (!tokenEntry || tokenEntry.expiresAt < new Date()) {
            const duration = Date.now() - startTime;
            console.log(`❌ Invalid or expired OTP for password reset in ${duration}ms`);
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        // Invalidate OTP
        await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

        const duration = Date.now() - startTime;
        console.log(`✅ Password reset successful for ${user.email} in ${duration}ms`);

        return res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ Password reset failed in ${duration}ms:`, error);
        return res.status(500).json({ message: "Failed to reset password" });
    }
};



export const requestPasswordReset = async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { email } = req.body;

    try {
        if (!email) return res.status(400).json({ message: "Email is required" });

        // Optimized query - only select necessary fields
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                fullname: true
            }
        });

        if (!user) {
            const duration = Date.now() - startTime;
            AuthPerformanceMonitor.recordMetric(email, 'password-reset-request', duration, false, 'user_not_found');
            console.log(`❌ Password reset requested for non-existent email in ${duration}ms`);
            return res.status(404).json({ message: "User not found" });
        }

        // Remove old OTPs
        await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

        const otp = generateOTP();
        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token: otp,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            },
        });

        const msg = buildPasswordResetEmail(user.fullname, otp);

        await sendEmail(user.email, "Password Reset OTP", msg);

        const duration = Date.now() - startTime;
        AuthPerformanceMonitor.recordMetric(user.email, 'password-reset-request', duration, true);
        console.log(`✅ Password reset OTP sent to ${user.email} in ${duration}ms`);

        return res.status(200).json({ message: "OTP sent to your email" });
    } catch (error) {
        const duration = Date.now() - startTime;
        AuthPerformanceMonitor.recordMetric(email || 'unknown', 'password-reset-request', duration, false, 'system_error');
        console.error(`❌ Password reset request failed in ${duration}ms:`, error);
        return res.status(500).json({ message: "Failed to send OTP" });
    }
};

export const verifyPasswordOtp = async (req: Request, res: Response) => {
    const startTime = Date.now();

    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

        // Optimized query - only select necessary fields
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true
            }
        });

        if (!user) {
            const duration = Date.now() - startTime;
            console.log(`❌ OTP verification failed for non-existent user in ${duration}ms`);
            return res.status(404).json({ message: "User not found" });
        }

        const tokenEntry = await prisma.passwordResetToken.findFirst({
            where: { userId: user.id, token: otp },
            select: {
                id: true,
                expiresAt: true
            }
        });

        if (!tokenEntry || tokenEntry.expiresAt < new Date()) {
            const duration = Date.now() - startTime;
            console.log(`❌ Invalid or expired OTP for ${user.email} in ${duration}ms`);
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        const duration = Date.now() - startTime;
        console.log(`✅ OTP verified for ${user.email} in ${duration}ms`);

        return res.status(200).json({ message: "OTP verified successfully" });
    } catch (error: unknown) {
        const duration = Date.now() - startTime;
        console.error(`❌ OTP verification failed in ${duration}ms:`, error);
        return res.status(500).json({ message: "Failed to verify OTP" });
    }
};



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


        const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
        const verifyUrl = `${backendUrl}/users/verify?token=${token}`;

        const msg = buildVerificationEmail(user.fullname, verifyUrl);

        sendEmail(user.email, "Verify your email", msg.text ? msg : { html: msg.html, text: msg.text })
            .then(() => console.log(`Verification email (resend) queued for ${user.email}`))
            .catch(err => console.error('Failed to send verification email (resend):', err));


        return res.status(200).json({ message: "Verification email resent" });
    } catch (error: unknown) {
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

            const clientUrl = (process.env.FRONTEND_URL) || `${req.protocol}://${req.get('host')}` || 'http://localhost:5173';
            const safeClientUrl = typeof clientUrl === 'string' && clientUrl.length > 0 ? clientUrl : 'http://localhost:5173';
            return res.redirect(`${safeClientUrl}/verify?status=error`);
        }


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
                // role in the DB is an enum; coerce to string and fall back to 'STUDENT'
                const roleValue = typeof updatedUser.role === 'string' ? updatedUser.role : 'STUDENT';
                const authToken = signToken({ id: String(updatedUser.id), email: updatedUser.email, role: roleValue || 'STUDENT' });
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
        const clientUrl2 = (process.env.CLIENT_URL || process.env.FRONTEND_URL) || `${req.protocol}://${req.get('host')}` || 'http://localhost:5173';

        const safeClientUrl2 = typeof clientUrl2 === 'string' && clientUrl2.length > 0 ? clientUrl2 : 'http://localhost:5173';

        const redirectUrl = `${safeClientUrl2}/verify?status=success&email=${encodeURIComponent(updatedUser?.email || '')}`;
        return res.redirect(redirectUrl);


    } catch (error) {
        console.log("Error Verify Email: ", error);
        const fallbackClient = (process.env.CLIENT_URL || process.env.FRONTEND_URL) || `${req.protocol}://${req.get('host')}` || 'http://localhost:5173';
        const safeFallback = typeof fallbackClient === 'string' && fallbackClient.length > 0 ? fallbackClient : 'http://localhost:5173';
        return res.redirect(`${safeFallback}/verify?status=error`);
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


        const backendUrl2 = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
        const verifyUrl2 = `${backendUrl2}/users/verify?token=${token}`;

        const msg2 = buildVerificationEmail(fullname, verifyUrl2);

        sendEmail(email, "Verify your email", msg2)
            .then(() => console.log(`Verification email queued for ${email}`))
            .catch(err => console.error('Failed to send verification email (registration):', err));

        return res.status(201).json({
            success: true,
            message: "User registered. Please check your email for verification.",
            response
        });

    } catch (error: unknown) {
        console.log("Error User Registration: ", error);

        // Narrow unknown to Error when possible
        const err = error as Error | undefined;
        if (err?.message === "USER_EXISTS") {
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
    const startTime = Date.now();
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const result = await withAuthRetry(async () => {
            // Optimized query - only fetch necessary fields for authentication
            const user = await prisma.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    password: true,
                    role: true,
                    isVerified: true,
                    fullname: true
                }
            });

            // Fast fail for non-existent users without expensive bcrypt operations
            if (!user) {
                // To prevent timing attacks, we still perform a dummy bcrypt operation
                // but with a predictable hash so it takes consistent time
                await bcrypt.compare(password, '$2b$10$dummy.hash.to.prevent.timing.attacks.abcdefghijklmnopqrstuv');
                throw new Error("INVALID_CREDENTIALS");
            }

            // Check verification status early to avoid unnecessary password comparison
            if (!user.isVerified) {
                throw new Error("EMAIL_NOT_VERIFIED");
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new Error("INVALID_CREDENTIALS");
            }

            // Exclude sensitive fields by omitting password
            const { password: _password, ...safeUser } = user;
            // Use the extracted _password in a no-op to avoid "assigned but never used" lint errors
            void _password;

            // Generate token
            const token = signToken({ id: user.id, email: user.email, role: user.role });

            return { safeUser, token };
        }, 2, "User Login");


        res.cookie('authToken', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            path: '/'
        });

        const duration = Date.now() - startTime;
        AuthPerformanceMonitor.recordMetric(email, 'login', duration, true);
        console.log(`✅ Login successful for ${email} in ${duration}ms`);

        // For production we avoid sending raw tokens in the response body.
        // During local development, include the token in the response to
        // support dev setups where cookies may not be sent (Vite dev server
        // on a different origin). This is safe for dev only.
        const includeToken = process.env.NODE_ENV !== 'production';

        // Define a narrow response shape for the login endpoint
        interface LoginResponse {
            success: boolean;
            user: { id: string; email: string; fullname?: string; role?: string } | Record<string, unknown>;
            message: string;
            token?: string;
        }

        const body: LoginResponse = {
            success: true,
            user: result.safeUser as unknown as LoginResponse['user'],
            message: "Login successful",
        };

        if (includeToken) {
            body.token = result.token;
        }

        return res.status(200).json(body);

    } catch (error) {
        const duration = Date.now() - startTime;
        const err = error as Error | undefined;
        const msg = err?.message || String(error);

        AuthPerformanceMonitor.recordMetric(
            email || 'unknown',
            'login',
            duration,
            false,
            msg === "INVALID_CREDENTIALS" ? "invalid_credentials" :
                msg === "EMAIL_NOT_VERIFIED" ? "email_not_verified" : "system_error"
        );
        console.log(`❌ Login failed in ${duration}ms:`, error);

        // Normalize the message (some errors might be wrapped)

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

    } catch (error) {
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

