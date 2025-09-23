"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizationStats = exports.updateUserProfile = exports.getCurrentUser = exports.userLogout = exports.userLogin = exports.userRegister = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_1 = require("../middleware/auth");
const db_1 = require("../lib/db");
const databaseHealth_1 = require("../lib/databaseHealth");
const userRegister = async (req, res) => {
    try {
        const { fullname, email, password, role } = req.body;
        if (!fullname || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }
        await (0, databaseHealth_1.withDatabaseRetry)(async () => {
            const existingUser = await db_1.prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                throw new Error("USER_EXISTS");
            }
            const hashPassword = await bcrypt_1.default.hash(password, 10);
            const response = await db_1.prisma.user.create({
                data: { fullname, email, password: hashPassword, role }
            });
            res.status(201).json({ success: true, user: response });
        });
    }
    catch (error) {
        console.log("Error User Registration: ", error);
        if (error.message === "USER_EXISTS") {
            return res.status(400).json({ message: "User already exists" });
        }
        const dbError = (0, databaseHealth_1.handleDatabaseError)(error, "User Registration");
        res.status(500).json({
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
        await (0, databaseHealth_1.withDatabaseRetry)(async () => {
            const user = await db_1.prisma.user.findUnique({ where: { email } });
            if (!user) {
                throw new Error("INVALID_CREDENTIALS");
            }
            const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
            if (!isPasswordValid) {
                throw new Error("INVALID_CREDENTIALS");
            }
            const { password: _, ...safeUser } = user;
            const token = (0, auth_1.signToken)({ id: user.id, email: user.email, role: user.role });
            res.cookie('authToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000,
                path: '/'
            });
            res.status(200).json({
                success: true,
                user: safeUser,
                message: "Login successful"
            });
        });
    }
    catch (error) {
        console.log("Error User Login: ", error);
        if (error.message === "INVALID_CREDENTIALS") {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const dbError = (0, databaseHealth_1.handleDatabaseError)(error, "User Login");
        res.status(500).json({
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
            sameSite: 'strict',
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
        await (0, databaseHealth_1.withDatabaseRetry)(async () => {
            const user = await db_1.prisma.user.findUnique({
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
                user: user
            });
        });
    }
    catch (error) {
        console.log("Error Get Current User: ", error);
        const dbError = (0, databaseHealth_1.handleDatabaseError)(error, "Get Current User");
        res.status(500).json({
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
