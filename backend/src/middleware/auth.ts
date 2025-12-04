import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../config/supabaseClient";

// Extend Express Request interface to include user and userId
declare module "express-serve-static-core" {
    interface Request {
        user?: {
            id: string;
            email?: string;
            role?: string;
            [key: string]: unknown;
        };
        userId?: string;
    }
}

// Middleware to verify Supabase JWT and attach user info to req.user and req.userId
export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
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

    try {
        // Verify the token with Supabase
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            console.log('Authentication failed:', error?.message || 'Invalid token');
            
            let errorMessage = "Invalid or expired token";
            let errorCode = "INVALID_TOKEN";

            if (error?.message?.includes('expired')) {
                errorMessage = "Token has expired";
                errorCode = "TOKEN_EXPIRED";
            }

            return res.status(401).json({
                message: errorMessage,
                error: errorCode
            });
        }

        // Attach user info to request
        req.user = {
            id: user.id,
            email: user.email,
            role: user.user_metadata?.role || 'STUDENT',
            ...user.user_metadata
        };
        req.userId = user.id;
        
        next();
    } catch (err: unknown) {
        console.log('Authentication error:', err);
        return res.status(401).json({
            message: 'Invalid or expired token',
            error: 'INVALID_TOKEN'
        });
    }
};