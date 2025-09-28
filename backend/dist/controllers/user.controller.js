"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizationStats = exports.updateUserProfile = exports.getCurrentUser = exports.userLogout = exports.userLogin = exports.userRegister = exports.verifyEmail = exports.resendVerificationEmail = exports.verifyPasswordOtp = exports.requestPasswordReset = exports.resetPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_1 = require("../middleware/auth");
const db_1 = require("../lib/db");
const databaseHealth_1 = require("../lib/databaseHealth");
const crypto_1 = __importDefault(require("crypto"));
const design_controller_1 = require("../Email/design.controller");
const mailer_1 = require("../lib/mailer");
const generateToken = () => {
    return crypto_1.default.randomBytes(32).toString('hex');
};
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const user = await db_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const tokenEntry = await db_1.prisma.passwordResetToken.findFirst({
            where: { userId: user.id, token: otp },
        });
        if (!tokenEntry || tokenEntry.expiresAt < new Date()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
        await db_1.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
        return res.status(200).json({ message: "Password reset successfully" });
    }
    catch (error) {
        console.error("Error resetPassword:", error);
        return res.status(500).json({ message: "Failed to reset password" });
    }
};
exports.resetPassword = resetPassword;
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ message: "Email is required" });
        const user = await db_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        await db_1.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
        const otp = generateOTP();
        await db_1.prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token: otp,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            },
        });
        const msg = (0, design_controller_1.buildPasswordResetEmail)(user.fullname, otp);
        await (0, mailer_1.sendEmail)(user.email, "Password Reset OTP", msg);
        return res.status(200).json({ message: "OTP sent to your email" });
    }
    catch (error) {
        console.error("Error requestPasswordReset:", error);
        return res.status(500).json({ message: "Failed to send OTP" });
    }
};
exports.requestPasswordReset = requestPasswordReset;
const verifyPasswordOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp)
            return res.status(400).json({ message: "Email and OTP are required" });
        const user = await db_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const tokenEntry = await db_1.prisma.passwordResetToken.findFirst({
            where: { userId: user.id, token: otp },
        });
        if (!tokenEntry || tokenEntry.expiresAt < new Date()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }
        return res.status(200).json({ message: "OTP verified successfully" });
    }
    catch (error) {
        console.error("Error verifyPasswordOtp:", error);
        return res.status(500).json({ message: "Failed to verify OTP" });
    }
};
exports.verifyPasswordOtp = verifyPasswordOtp;
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
        const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
        const verifyUrl = `${backendUrl}/users/verify?token=${token}`;
        const msg = (0, design_controller_1.buildVerificationEmail)(user.fullname, verifyUrl);
        (0, mailer_1.sendEmail)(user.email, "Verify your email", msg.text ? msg : { html: msg.html, text: msg.text })
            .then(() => console.log(`Verification email (resend) queued for ${user.email}`))
            .catch(err => console.error('Failed to send verification email (resend):', err));
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
            const clientUrl = (process.env.FRONTEND_URL) || `${req.protocol}://${req.get('host')}` || 'http://localhost:5173';
            const safeClientUrl = typeof clientUrl === 'string' && clientUrl.length > 0 ? clientUrl : 'http://localhost:5173';
            return res.redirect(`${safeClientUrl}/verify?status=error`);
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
                const roleValue = typeof updatedUser.role === 'string' ? updatedUser.role : 'STUDENT';
                const authToken = (0, auth_1.signToken)({ id: String(updatedUser.id), email: updatedUser.email, role: roleValue || 'STUDENT' });
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
        const clientUrl2 = (process.env.CLIENT_URL || process.env.FRONTEND_URL) || `${req.protocol}://${req.get('host')}` || 'http://localhost:5173';
        const safeClientUrl2 = typeof clientUrl2 === 'string' && clientUrl2.length > 0 ? clientUrl2 : 'http://localhost:5173';
        const redirectUrl = `${safeClientUrl2}/verify?status=success&email=${encodeURIComponent(updatedUser?.email || '')}`;
        return res.redirect(redirectUrl);
    }
    catch (error) {
        console.log("Error Verify Email: ", error);
        const fallbackClient = (process.env.CLIENT_URL || process.env.FRONTEND_URL) || `${req.protocol}://${req.get('host')}` || 'http://localhost:5173';
        const safeFallback = typeof fallbackClient === 'string' && fallbackClient.length > 0 ? fallbackClient : 'http://localhost:5173';
        return res.redirect(`${safeFallback}/verify?status=error`);
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
        const backendUrl2 = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
        const verifyUrl2 = `${backendUrl2}/users/verify?token=${token}`;
        const msg2 = (0, design_controller_1.buildVerificationEmail)(fullname, verifyUrl2);
        (0, mailer_1.sendEmail)(email, "Verify your email", msg2)
            .then(() => console.log(`Verification email queued for ${email}`))
            .catch(err => console.error('Failed to send verification email (registration):', err));
        return res.status(201).json({
            success: true,
            message: "User registered. Please check your email for verification.",
            response
        });
    }
    catch (error) {
        console.log("Error User Registration: ", error);
        const err = error;
        if (err?.message === "USER_EXISTS") {
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
            const { password: _password, ...safeUser } = user;
            void _password;
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
        const err = error;
        const msg = err?.message || String(error);
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
