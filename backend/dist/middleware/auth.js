"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = exports.signToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const signToken = (user) => {
    const payload = { userId: user.id };
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not defined in environment variables.");
    }
    const expiresEnv = process.env.JWT_EXPIRES_IN;
    const expiresInValue = expiresEnv && !Number.isNaN(Number(expiresEnv))
        ? Number(expiresEnv)
        : (expiresEnv || "1d");
    const signOptions = { expiresIn: expiresInValue };
    return jsonwebtoken_1.default.sign(payload, secret, signOptions);
};
exports.signToken = signToken;
const authenticate = (req, res, next) => {
    let token = req.cookies?.authToken;
    if (!token) {
        const authHeader = req.headers["authorization"];
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }
    }
    if (!token) {
        console.log('Authentication failed: No token provided');
        return res.status(401).json({
            message: "No token provided",
            error: "MISSING_TOKEN"
        });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('JWT_SECRET not configured in environment variables');
        return res.status(500).json({
            message: "Server configuration error",
            error: "JWT_SECRET_MISSING"
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = { id: decoded.userId };
        req.userId = decoded.userId;
        next();
    }
    catch (err) {
        const isJwtError = (e) => typeof e === 'object' && e !== null && ('name' in e || 'message' in e);
        if (isJwtError(err)) {
            console.log('Authentication failed:', err.message);
            let errorMessage = "Invalid or expired token";
            let errorCode = "INVALID_TOKEN";
            if (err.name === 'TokenExpiredError') {
                errorMessage = "Token has expired";
                errorCode = "TOKEN_EXPIRED";
            }
            else if (err.name === 'JsonWebTokenError') {
                errorMessage = "Invalid token format";
                errorCode = "MALFORMED_TOKEN";
            }
            return res.status(401).json({
                message: errorMessage,
                error: errorCode
            });
        }
        console.log('Authentication failed:', err);
        return res.status(401).json({
            message: 'Invalid or expired token',
            error: 'INVALID_TOKEN'
        });
    }
};
exports.authenticate = authenticate;
