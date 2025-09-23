/// <reference path="../types/global.d.ts" />
import jwt, { SignOptions } from "jsonwebtoken";
import dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";

dotenv.config();

// Extend Express Request interface to include user and userId
declare module "express-serve-static-core" {
    interface Request {
        user?: any;
        userId?: string | number;
    }
}

// User object we accept for signing
interface JwtUser {
    id: string | number;
    [key: string]: any;
}

// Shape of payload we embed in the token
interface JwtPayload {
    userId: string | number;
    iat?: number;
    exp?: number;
}

// Generate JWT token for a user
export const signToken = (user: JwtUser): string => {
    const payload = { userId: user.id };
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not defined in environment variables.");
    }

    return jwt.sign(
        payload,
        secret,
        { expiresIn: (process.env.JWT_EXPIRES_IN || "1d") as any }
    );
};

// Middleware to verify JWT and attach user info to req.user and req.userId
export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
): Response<any, Record<string, any>> | void => {
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
        const decoded = jwt.verify(token, secret) as JwtPayload;
        // attach both a user object and a convenience userId property
        req.user = { id: decoded.userId };
        req.userId = decoded.userId;
        next();
    } catch (err: any) {
        console.log('Authentication failed:', err.message);

        // Provide more specific error messages
        let errorMessage = "Invalid or expired token";
        let errorCode = "INVALID_TOKEN";

        if (err.name === 'TokenExpiredError') {
            errorMessage = "Token has expired";
            errorCode = "TOKEN_EXPIRED";
        } else if (err.name === 'JsonWebTokenError') {
            errorMessage = "Invalid token format";
            errorCode = "MALFORMED_TOKEN";
        }

        return res.status(401).json({
            message: errorMessage,
            error: errorCode
        });
    }
};