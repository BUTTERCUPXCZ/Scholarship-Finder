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
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        return res.status(500).json({ message: "JWT_SECRET not configured" });
    }

    try {
        const decoded = jwt.verify(token, secret) as JwtPayload;
        // attach both a user object and a convenience userId property
        req.user = { id: decoded.userId };
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};