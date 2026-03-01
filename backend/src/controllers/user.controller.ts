import { Request, Response } from "express";
import { prisma } from "../lib/db";
import { withRLS } from "../lib/rls";
import { withDatabaseRetry, handleDatabaseError } from "../lib/databaseHealth";
import { AuthPerformanceMonitor } from "../lib/authPerformanceMonitor";
import { supabaseAdmin } from "../config/supabaseClient";
import { createAuditLog, extractIpAddress } from "../services/auditLog.service";
import { AuditAction, AuditStatus } from "@prisma/client";



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
            createAuditLog({ userId: null, action: AuditAction.PASSWORD_RESET_REQUEST, ipAddress: extractIpAddress(req), userAgent: (req.headers?.['user-agent'] as string) ?? 'unknown', status: AuditStatus.FAILURE, metadata: { email, reason: 'user_not_found' } }).catch((err) => console.error('[AuditLog] Write failed:', err));
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
        createAuditLog({ userId: null, action: AuditAction.PASSWORD_RESET_REQUEST, ipAddress: extractIpAddress(req), userAgent: (req.headers?.['user-agent'] as string) ?? 'unknown', status: AuditStatus.SUCCESS, metadata: { email } }).catch((err) => console.error('[AuditLog] Write failed:', err));

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
            createAuditLog({ userId: null, action: AuditAction.PASSWORD_RESET_COMPLETE, ipAddress: extractIpAddress(req), userAgent: (req.headers?.['user-agent'] as string) ?? 'unknown', status: AuditStatus.FAILURE, metadata: { reason: 'invalid_or_expired_token' } }).catch((err) => console.error('[AuditLog] Write failed:', err));
            return res.status(400).json({ message: "Failed to reset password. Token may be invalid or expired." });
        }

        const duration = Date.now() - startTime;
        console.log(`✅ Password reset successful in ${duration}ms`);
        createAuditLog({ userId: null, action: AuditAction.PASSWORD_RESET_COMPLETE, ipAddress: extractIpAddress(req), userAgent: (req.headers?.['user-agent'] as string) ?? 'unknown', status: AuditStatus.SUCCESS }).catch((err) => console.error('[AuditLog] Write failed:', err));

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
        createAuditLog({ userId: response.id, action: AuditAction.USER_REGISTER, ipAddress: extractIpAddress(req), userAgent: (req.headers?.['user-agent'] as string) ?? 'unknown', status: AuditStatus.SUCCESS, metadata: { email: response.email, role: response.role } }).catch((err) => console.error('[AuditLog] Write failed:', err));

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
        createAuditLog({ userId: null, action: AuditAction.USER_REGISTER, ipAddress: extractIpAddress(req), userAgent: (req.headers?.['user-agent'] as string) ?? 'unknown', status: AuditStatus.FAILURE, metadata: { email: req.body?.email ?? null, reason: 'system_error' } }).catch((err) => console.error('[AuditLog] Write failed:', err));

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

        createAuditLog({ userId: user.id, action: AuditAction.EMAIL_VERIFICATION_RESEND, ipAddress: extractIpAddress(req), userAgent: (req.headers?.['user-agent'] as string) ?? 'unknown', status: AuditStatus.SUCCESS, metadata: { email } }).catch((err) => console.error('[AuditLog] Write failed:', err));
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
            createAuditLog({ userId: null, action: AuditAction.USER_LOGIN, ipAddress: extractIpAddress(req), userAgent: (req.headers?.['user-agent'] as string) ?? 'unknown', status: AuditStatus.FAILURE, metadata: { email, reason: authError?.message ?? 'invalid_credentials' } }).catch((err) => console.error('[AuditLog] Write failed:', err));

            return res.status(400).json({
                message: authError?.message || "Invalid credentials"
            });
        }

        // Check if email is verified
        if (!authData.user.email_confirmed_at) {
            const duration = Date.now() - startTime;
            AuthPerformanceMonitor.recordMetric(email, 'login', duration, false, 'email_not_verified');
            console.log(`❌ Login failed - email not verified for ${email} in ${duration}ms`);
            createAuditLog({ userId: null, action: AuditAction.USER_LOGIN, ipAddress: extractIpAddress(req), userAgent: (req.headers?.['user-agent'] as string) ?? 'unknown', status: AuditStatus.FAILURE, metadata: { email, reason: 'email_not_verified' } }).catch((err) => console.error('[AuditLog] Write failed:', err));

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
        createAuditLog({ userId: user?.id ?? null, action: AuditAction.USER_LOGIN, ipAddress: extractIpAddress(req), userAgent: (req.headers?.['user-agent'] as string) ?? 'unknown', status: AuditStatus.SUCCESS, metadata: { email } }).catch((err) => console.error('[AuditLog] Write failed:', err));

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

        createAuditLog({ userId: req.userId ?? null, action: AuditAction.USER_LOGOUT, ipAddress: extractIpAddress(req), userAgent: (req.headers?.['user-agent'] as string) ?? 'unknown', status: AuditStatus.SUCCESS }).catch((err) => console.error('[AuditLog] Write failed:', err));
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

        const role = (req.user?.role as string) || 'STUDENT';

        // All DB operations in one RLS-enforced transaction.
        const user = await withRLS(String(userId), role, async (tx) => {
            let u = await tx.user.findUnique({
                where: { id: String(userId) },
                select: { id: true, fullname: true, email: true, role: true, isVerified: true }
            });

            // First-login sync: create Prisma row if Supabase user exists but row is missing.
            if (!u && req.user) {
                u = await tx.user.create({
                    data: {
                        id: req.user.id,
                        email: req.user.email || '',
                        fullname: req.user?.fullname || 'User',
                        password: '',
                        role: (req.user?.role || 'STUDENT') as 'STUDENT' | 'ORGANIZATION' | 'ADMIN',
                        isVerified: true
                    },
                    select: { id: true, fullname: true, email: true, role: true, isVerified: true }
                });
            }

            if (u && !u.isVerified) {
                await tx.user.update({
                    where: { id: u.id },
                    data: { isVerified: true }
                });
                u.isVerified = true;
            }

            return u;
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

        const role = (req.user?.role as string) || 'STUDENT';

        // Both queries in one RLS-enforced transaction.
        // Email uniqueness is enforced by the DB @unique constraint (catches P2002).
        // The pre-check is omitted because RLS hides other users' rows anyway —
        // the unique constraint on the email column provides the authoritative guard.
        const updatedUser = await withRLS(String(userId), role, async (tx) => {
            return tx.user.update({
                where: { id: String(userId) },
                data: { fullname, email },
                select: { id: true, fullname: true, email: true, role: true }
            });
        }).catch((err: unknown) => {
            if ((err as { code?: string })?.code === 'P2002') return null; // unique constraint — email taken
            throw err;
        });

        if (!updatedUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        createAuditLog({ userId: updatedUser.id, action: AuditAction.PROFILE_UPDATED, resource: 'USER', resourceId: updatedUser.id, ipAddress: extractIpAddress(req), userAgent: (req.headers?.['user-agent'] as string) ?? 'unknown', status: AuditStatus.SUCCESS, metadata: { updatedFields: ['fullname', 'email'] } }).catch((err) => console.error('[AuditLog] Write failed:', err));
        res.status(200).json({
            success: true,
            user: updatedUser
        });
    } catch (error) {
        console.log("Error Update User Profile: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Refresh the HTTP-only cookie with the latest Supabase access token.
// Called by the frontend after MFA verification to sync the aal2 token
// into the cookie — necessary because the Supabase JS SDK holds the
// upgraded token in localStorage while the backend cookie still has aal1.
// The `authenticate` middleware already validated the token before this runs.
export const refreshSession = async (req: Request, res: Response) => {
    try {
        // The token to store in the cookie comes from the request body.
        // It's the same aal2 token used in the Authorization header,
        // already validated by the authenticate middleware.
        const token: string | undefined =
            req.body?.token ||
            req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        // Decode the JWT payload to check aal level.
        // No need to call getUser() again — authenticate middleware already did it.
        let payload: { aal?: string } = {};
        try {
            payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        } catch {
            return res.status(400).json({ message: "Malformed token" });
        }

        if (payload.aal !== 'aal2') {
            return res.status(403).json({
                message: "Token does not carry MFA verification",
                error: "MFA_NOT_VERIFIED"
            });
        }

        // Re-set the HTTP-only cookie with the aal2 token
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — matches Supabase default session length
            path: '/'
        });

        createAuditLog({ userId: req.userId ?? null, action: AuditAction.SESSION_REFRESH, ipAddress: extractIpAddress(req), userAgent: (req.headers?.['user-agent'] as string) ?? 'unknown', status: AuditStatus.SUCCESS }).catch((err) => console.error('[AuditLog] Write failed:', err));
        return res.status(200).json({ success: true, message: "Session cookie updated" });
    } catch (error) {
        console.error("❌ Error refreshing session cookie:", error);
        return res.status(500).json({ message: "Failed to refresh session" });
    }
};

// Get organization statistics
export const getOrganizationStats = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Verify user is an organization (role check before RLS wrapping)
        const userRole = (req.user?.role as string) || '';
        if (userRole !== 'ORGANIZATION') {
            return res.status(403).json({ message: "Access denied. Organizations only." });
        }

        // All count queries in one RLS-enforced transaction.
        // RLS policies automatically scope each count to the acting organization.
        const stats = await withRLS(String(userId), userRole, async (tx) => {
            const [totalScholarships, activeScholarships, archivedScholarships, totalApplications] =
                await Promise.all([
                    tx.scholarship.count({ where: { providerId: String(userId) } }),
                    tx.scholarship.count({ where: { providerId: String(userId), status: 'ACTIVE' } }),
                    tx.archive.count({ where: { providerId: String(userId) } }),
                    tx.application.count({
                        where: { scholarship: { providerId: String(userId) } }
                    }),
                ]);
            return { totalScholarships, activeScholarships, archivedScholarships, totalApplications };
        });

        res.status(200).json(stats);
    } catch (error) {
        console.log("Error Get Organization Stats: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

