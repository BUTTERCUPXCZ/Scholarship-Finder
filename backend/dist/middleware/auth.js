"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = exports.signToken = void 0;
/// <reference path="../types/global.d.ts" />
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Generate JWT token for a user
const signToken = (user) => {
    const payload = { userId: user.id };
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not defined in environment variables.");
    }
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: (process.env.JWT_EXPIRES_IN || "1d") });
};
exports.signToken = signToken;
// Middleware to verify JWT and attach user info to req.user and req.userId
const authenticate = (req, res, next) => {
    // First try to get token from cookie (HTTP-only cookie method)
    let token = req.cookies?.authToken;
    // Fallback: try Authorization header for backward compatibility
    if (!token) {
        const authHeader = req.headers["authorization"];
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }
    }
    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return res.status(500).json({ message: "JWT_SECRET not configured" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        // attach both a user object and a convenience userId property
        req.user = { id: decoded.userId };
        req.userId = decoded.userId;
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
exports.authenticate = authenticate;
