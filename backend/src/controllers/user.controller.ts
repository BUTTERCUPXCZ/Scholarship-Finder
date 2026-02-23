import { Request, Response } from "express";
import { prisma } from "../lib/db";
import { withDatabaseRetry, handleDatabaseError } from "../lib/databaseHealth";
import { AuthPerformanceMonitor } from "../lib/authPerformanceMonitor";
import { supabaseAdmin } from "../config/supabaseClient";



// Request password reset - Supabase will send the email
export const requestPasswordReset = async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { email } = req.body;

    try {
        if (!email) return res.status(400).json({ message: "Email is required" });

        // Check if user exists in our database
        const user = await prisma.user.findUnique({
            where: { email },
            select: { email: true }
        });

        if (!user) {
            const duration = Date.now() - startTime;
            AuthPerformanceMonitor.recordMetric(email, 'password-reset-request', duration, false, 'user_not_found');
            console.log(`❌ Password reset requested for non-existent email in ${duration}ms`);
            return res.status(404).json({ message: "User not found" });
        }

        // Use Supabase to send password reset email
        const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.FRONTEND_URL}/reset-password`
        });

        if (error) {
            const duration = Date.now() - startTime;
            AuthPerformanceMonitor.recordMetric(email, 'password-reset-request', duration, false, 'supabase_error');
            console.error(`❌ Supabase password reset failed in ${duration}ms:`, error);
            return res.status(500).json({ message: "Failed to send password reset email" });
        }

        const duration = Date.now() - startTime;
        AuthPerformanceMonitor.recordMetric(email, 'password-reset-request', duration, true);
        console.log(`✅ Password reset email sent to ${email} in ${duration}ms`);

        return res.status(200).json({ message: "Password reset email sent. Please check your inbox." });
    } catch (error) {
        const duration = Date.now() - startTime;
        AuthPerformanceMonitor.recordMetric(email || 'unknown', 'password-reset-request', duration, false, 'system_error');
        console.error(`❌ Password reset request failed in ${duration}ms:`, error);
        return res.status(500).json({ message: "Failed to send password reset email" });
    }
};

// Reset password with new password (called from reset form with Supabase token)
export const resetPassword = async (req: Request, res: Response) => {
    const startTime = Date.now();

    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: "Token and new password are required" });
        }

        // Update password using Supabase
        const { error } = await supabaseAdmin.auth.updateUser({
            password: newPassword
        });

        if (error) {
            const duration = Date.now() - startTime;
            console.error(`❌ Password reset failed in ${duration}ms:`, error);
            return res.status(400).json({ message: "Failed to reset password. Token may be invalid or expired." });
        }

        const duration = Date.now() - startTime;
        console.log(`✅ Password reset successful in ${duration}ms`);

        return res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ Password reset failed in ${duration}ms:`, error);
        return res.status(500).json({ message: "Failed to reset password" });
    }
};


// User registration with Supabase Auth (called after frontend creates auth user)
export const userRegister = async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
        const { id, fullname, email, role } = req.body;

        if (!id || !fullname || !email || !role) {
            return res.status(400).json({ message: "All fields are required (id, fullname, email, role)" });
        }

        // Check if user exists in Prisma database
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

                
        // Note: Password is managed by Supabase Auth, we don't store it
        const response = await withDatabaseRetry(async () => {
            return await prisma.user.create({
                data: { 
                    id, // Use Supabase user ID from frontend
                    fullname, 
                    email, 
                    password: '', // Empty - password managed by Supabase
                    role,
                    isVerified: false // Will be updated when email is verified
                }
            });
        });

        const duration = Date.now() - startTime;
        console.log(`✅ User profile created successfully in ${duration}ms`);

        return res.status(201).json({
            success: true,
            message: "User profile created successfully",
            user: {
                id: response.id,
                email: response.email,
                fullname: response.fullname,
                role: response.role
            }
        });

    } catch (error: unknown) {
        const duration = Date.now() - startTime;
        console.error(`❌ User profile creation failed in ${duration}ms:`, error);

        const dbError = handleDatabaseError(error, "User Registration");
        return res.status(500).json({
            message: dbError.message,
            retryable: dbError.retryable
        });
    }
};

// Resend verification email
export const resendVerificationEmail = async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({ 
            where: { email },
            select: { id: true, email: true, isVerified: true }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "Email is already verified" });
        }

        // Generate new verification link
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
            options: {
                redirectTo: `${process.env.FRONTEND_URL}/login`
            }
        });

        if (linkError) {
            console.error(`❌ Failed to generate verification link for ${email}:`, linkError);
            return res.status(500).json({ 
                message: "Failed to generate verification link. Please try again." 
            });
        }

        console.log(`📧 Verification link generated for ${email}`);
        console.log(`🔗 Link: ${linkData.properties.action_link}`);

        const duration = Date.now() - startTime;
        console.log(`✅ Verification email resent to ${email} in ${duration}ms`);

        const responseBody: { success: boolean; message: string; confirmationLink?: string; note?: string } = {
            success: true,
            message: "Verification email sent. Please check your inbox."
        };

        // Include link in development mode
        if (process.env.NODE_ENV !== 'production' && linkData?.properties?.action_link) {
            responseBody.confirmationLink = linkData.properties.action_link;
            responseBody.note = "⚠️ Development mode: Use the confirmationLink to verify your email";
        }

        return res.status(200).json(responseBody);

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ Resend verification failed in ${duration}ms:`, error);
        return res.status(500).json({ message: "Failed to resend verification email" });
    }
};

// User login with Supabase Auth
export const userLogin = async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Authenticate with Supabase
        const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password
        });

        if (authError || !authData.user || !authData.session) {
            const duration = Date.now() - startTime;
            AuthPerformanceMonitor.recordMetric(email, 'login', duration, false, 'invalid_credentials');
            console.log(`❌ Login failed for ${email} in ${duration}ms:`, authError?.message);
            
            return res.status(400).json({ 
                message: authError?.message || "Invalid credentials" 
            });
        }

        // Check if email is verified
        if (!authData.user.email_confirmed_at) {
            const duration = Date.now() - startTime;
            AuthPerformanceMonitor.recordMetric(email, 'login', duration, false, 'email_not_verified');
            console.log(`❌ Login failed - email not verified for ${email} in ${duration}ms`);
            
            return res.status(403).json({ 
                message: "Email is not verified. Please check your inbox." 
            });
        }

        // Get user from Prisma database
        let user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                fullname: true,
                role: true,
                isVerified: true
            }
        });

        // If user doesn't exist in Prisma but exists in Supabase, sync them
        if (!user && authData.user) {
            user = await prisma.user.create({
                data: {
                    id: authData.user.id,
                    email: authData.user.email!,
                    fullname: authData.user.user_metadata?.fullname || 'User',
                    password: '', // Managed by Supabase
                    role: authData.user.user_metadata?.role || 'STUDENT',
                    isVerified: true
                },
                select: {
                    id: true,
                    email: true,
                    fullname: true,
                    role: true,
                    isVerified: true
                }
            });
        }

        // Update isVerified if needed
        if (user && !user.isVerified) {
            await prisma.user.update({
                where: { id: user.id },
                data: { isVerified: true }
            });
        }

        // Set the Supabase session token as HTTP-only cookie
        res.cookie('authToken', authData.session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            path: '/'
        });

        const duration = Date.now() - startTime;
        AuthPerformanceMonitor.recordMetric(email, 'login', duration, true);
        console.log(`✅ Login successful for ${email} in ${duration}ms`);

        return res.status(200).json({
            success: true,
            user: {
                id: user?.id,
                email: user?.email,
                fullname: user?.fullname,
                role: user?.role
            },
            message: "Login successful",
            // Include token in response for development
            ...(process.env.NODE_ENV !== 'production' && { token: authData.session.access_token })
        });

    } catch (error) {
        const duration = Date.now() - startTime;
        AuthPerformanceMonitor.recordMetric(email || 'unknown', 'login', duration, false, 'system_error');
        console.error(`❌ Login failed in ${duration}ms:`, error);

        const dbError = handleDatabaseError(error, "User Login");
        return res.status(500).json({
            message: dbError.message,
            retryable: dbError.retryable
        });
    }
};

// Logout endpoint to clear the HTTP-only cookie and sign out from Supabase
export const userLogout = async (req: Request, res: Response) => {
    try {
        // Get token from cookie or header
        const token = req.cookies?.authToken || req.headers.authorization?.split(' ')[1];

        // Sign out from Supabase if token exists
        if (token) {
            await supabaseAdmin.auth.signOut();
        }

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
};

// Get current user profile (for authentication check)
export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Get user from database
        let user = await withDatabaseRetry(async () => {
            return await prisma.user.findUnique({
                where: { id: String(userId) },
                select: {
                    id: true,
                    fullname: true,
                    email: true,
                    role: true,
                    isVerified: true
                }
            });
        });

        // If user doesn't exist in database, create from Supabase data
        if (!user && req.user) {
            user = await prisma.user.create({
                data: {
                    id: req.user.id,
                    email: req.user.email || '',
                    fullname: (req.user as any).fullname || 'User',
                    password: '', // Managed by Supabase
                    role: req.user.role as any || 'STUDENT',
                    isVerified: true // If they can login, email is verified
                },
                select: {
                    id: true,
                    fullname: true,
                    email: true,
                    role: true,
                    isVerified: true
                }
            });
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update isVerified if needed (user logged in, so email is verified)
        if (user && !user.isVerified) {
            await prisma.user.update({
                where: { id: user.id },
                data: { isVerified: true }
            });
            user.isVerified = true;
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

