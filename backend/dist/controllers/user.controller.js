"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizationStats = exports.updateUserProfile = exports.getCurrentUser = exports.userLogout = exports.userLogin = exports.userRegister = exports.verifyEmail = exports.resendVerificationEmail = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_1 = require("../middleware/auth");
const db_1 = require("../lib/db");
const databaseHealth_1 = require("../lib/databaseHealth");
const resend_1 = require("resend");
const crypto_1 = __importDefault(require("crypto"));
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
const generateToken = () => {
    return crypto_1.default.randomBytes(32).toString('hex');
};
const buildVerificationEmail = (fullname, verifyUrl) => {
    const preheader = 'Verify your email to activate your account';
    const safeName = fullname || 'there';
    const html = `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Verify your email</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f6f7fb;font-family:system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial;">
        <!-- Preheader: hidden in most email clients but visible in inbox preview -->
        <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f6f7fb;padding:24px 0;">
            <tr>
                <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">
                        <tr>
                            <td style="padding:24px 32px;background:linear-gradient(90deg,#4f46e5,#06b6d4);color:#fff;">
                                <h1 style="margin:0;font-size:20px;letter-spacing:-0.5px;">ScholarSphere</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:32px;">
                                <p style="margin:0 0 12px 0;color:#111827;font-size:16px;">Hi ${safeName},</p>
                                <p style="margin:0 0 20px 0;color:#6b7280;font-size:14px;">Thanks for registering. Please verify your email address by clicking the button below. This helps us keep your account secure.</p>

                                <!-- Button (use table for better email client support) -->
                                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 28px 0;">
                                    <tr>
                                        <td align="center" bgcolor="#4f46e5" style="border-radius:6px;">
                                            <a href="${verifyUrl}" target="_blank" style="display:inline-block;padding:12px 22px;color:#ffffff;text-decoration:none;font-weight:600;border-radius:6px;">Verify Email</a>
                                        </td>
                                    </tr>
                                </table>

                                <p style="margin:0;color:#6b7280;font-size:13px;">If the button doesn't work, copy and paste the link below into your browser:</p>
                                <p style="word-break:break-all;color:#2563eb;font-size:13px;margin-top:8px;">${verifyUrl}</p>

                                <hr style="border:none;border-top:1px solid #eef2ff;margin:20px 0;" />
                                <p style="margin:0;color:#9ca3af;font-size:12px;">If you didn't sign up for an account, you can safely ignore this email.</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:16px 32px;background:#fbfafc;color:#9ca3af;font-size:12px;text-align:center;">© ${new Date().getFullYear()} ScholarSphere — <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="color:inherit;text-decoration:underline;">Visit site</a></td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>`;
    const text = `Hello ${fullname},\n\nPlease verify your email by visiting the following link:\n${verifyUrl}\n\nIf you didn't create an account, you can ignore this message.`;
    return { html, text };
};
const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        const user = await db_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.isVerified) {
            return res.status(400).json({ message: "User is already verified" });
        }
        await db_1.prisma.verificationToken.deleteMany({ where: { userId: user.id } });
        const token = generateToken();
        await db_1.prisma.verificationToken.create({
            data: {
                token,
                userId: user.id,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60)
            }
        });
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
    }
    catch (error) {
        console.log("Error Resend Verification Email: ", error);
        return res.status(500).json({ message: "Failed to resend verification email" });
    }
};
exports.resendVerificationEmail = resendVerificationEmail;
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }
        const dbToken = await db_1.prisma.verificationToken.findUnique({
            where: { token: String(token) },
        });
        if (!dbToken || dbToken.expiresAt < new Date()) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }
        const updatedUser = await db_1.prisma.user.update({
            where: { id: dbToken.userId },
            data: { isVerified: true },
            select: { id: true, email: true, role: true }
        });
        await db_1.prisma.verificationToken.deleteMany({
            where: { userId: dbToken.userId }
        });
        try {
            if (updatedUser) {
                const authToken = (0, auth_1.signToken)({ id: String(updatedUser.id), email: updatedUser.email, role: updatedUser.role || 'STUDENT' });
                res.cookie('authToken', authToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                    maxAge: 24 * 60 * 60 * 1000,
                    path: '/'
                });
            }
        }
        catch (cookieErr) {
            console.log('Failed to set auth cookie after verification:', cookieErr);
        }
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const redirectUrl = `${clientUrl}/verify?status=success&email=${encodeURIComponent(updatedUser?.email || '')}`;
        return res.redirect(redirectUrl);
    }
    catch (error) {
        console.log("Error Verify Email: ", error);
        return res.redirect(`${process.env.CLIENT_URL}/verify?status=error`);
    }
};
exports.verifyEmail = verifyEmail;
const userRegister = async (req, res) => {
    try {
        const { fullname, email, password, role } = req.body;
        if (!fullname || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const response = await (0, databaseHealth_1.withDatabaseRetry)(async () => {
            const existingUser = await db_1.prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                throw new Error("USER_EXISTS");
            }
            const hashPassword = await bcrypt_1.default.hash(password, 10);
            return await db_1.prisma.user.create({
                data: { fullname, email, password: hashPassword, role }
            });
        });
        const token = generateToken();
        await db_1.prisma.verificationToken.create({
            data: {
                token,
                userId: response.id,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60)
            }
        });
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
    }
    catch (error) {
        console.log("Error User Registration: ", error);
        if (error.message === "USER_EXISTS") {
            return res.status(400).json({ message: "User already exists" });
        }
        const dbError = (0, databaseHealth_1.handleDatabaseError)(error, "User Registration");
        return res.status(500).json({
            message: dbError.message,
            retryable: dbError.retryable
        });
    }
};
exports.userRegister = userRegister;
const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const result = await (0, databaseHealth_1.withDatabaseRetry)(async () => {
            const user = await db_1.prisma.user.findUnique({ where: { email } });
            if (!user) {
                throw new Error("INVALID_CREDENTIALS");
            }
            const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
            if (!isPasswordValid) {
                throw new Error("INVALID_CREDENTIALS");
            }
            if (!user.isVerified) {
                throw new Error("EMAIL_NOT_VERIFIED");
            }
            const { password: _, ...safeUser } = user;
            const token = (0, auth_1.signToken)({ id: user.id, email: user.email, role: user.role });
            return { safeUser, token };
        });
        res.cookie('authToken', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000,
            path: '/'
        });
        return res.status(200).json({
            success: true,
            user: result.safeUser,
            message: "Login successful"
        });
    }
    catch (error) {
        console.log("Error User Login: ", error);
        const msg = error?.message || String(error);
        if (msg === "INVALID_CREDENTIALS") {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        if (msg === "EMAIL_NOT_VERIFIED") {
            return res.status(403).json({ message: "Email is not verified. Please check your inbox." });
        }
        const dbError = (0, databaseHealth_1.handleDatabaseError)(error, "User Login");
        return res.status(500).json({
            message: dbError.message,
            retryable: dbError.retryable
        });
    }
};
exports.userLogin = userLogin;
const userLogout = async (req, res) => {
    try {
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
    }
    catch (error) {
        console.log("Error User Logout: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.userLogout = userLogout;
const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await (0, databaseHealth_1.withDatabaseRetry)(async () => {
            return await db_1.prisma.user.findUnique({
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
    }
    catch (error) {
        console.log("Error Get Current User: ", error);
        const dbError = (0, databaseHealth_1.handleDatabaseError)(error, "Get Current User");
        return res.status(500).json({
            message: dbError.message,
            retryable: dbError.retryable
        });
    }
};
exports.getCurrentUser = getCurrentUser;
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { fullname, email } = req.body;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!fullname || !email) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const existingUser = await db_1.prisma.user.findFirst({
            where: {
                email,
                NOT: { id: String(userId) }
            }
        });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }
        const updatedUser = await db_1.prisma.user.update({
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
    }
    catch (error) {
        console.log("Error Update User Profile: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.updateUserProfile = updateUserProfile;
const getOrganizationStats = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await db_1.prisma.user.findUnique({
            where: { id: String(userId) },
            select: { role: true }
        });
        if (!user || user.role !== 'ORGANIZATION') {
            return res.status(403).json({ message: "Access denied. Organizations only." });
        }
        const [totalScholarships, activeScholarships, archivedScholarships] = await Promise.all([
            db_1.prisma.scholarship.count({
                where: { providerId: String(userId) }
            }),
            db_1.prisma.scholarship.count({
                where: {
                    providerId: String(userId),
                    status: 'ACTIVE'
                }
            }),
            db_1.prisma.archive.count({
                where: { providerId: String(userId) }
            })
        ]);
        const totalApplications = await db_1.prisma.application.count({
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
    }
    catch (error) {
        console.log("Error Get Organization Stats: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.getOrganizationStats = getOrganizationStats;
