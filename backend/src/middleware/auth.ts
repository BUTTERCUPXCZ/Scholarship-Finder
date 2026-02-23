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

/**
 * Extract and validate the Supabase JWT token from cookie or Authorization header.
 * Attaches req.user and req.userId on success.
 */
const extractAndVerifyToken = async (
  req: Request,
  res: Response,
): Promise<boolean> => {
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
    console.log("Authentication failed: No token provided");
    res.status(401).json({
      message: "No token provided",
      error: "MISSING_TOKEN",
    });
    return false;
  }

  try {
    // Verify the token with Supabase
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.log("Authentication failed:", error?.message || "Invalid token");

      let errorMessage = "Invalid or expired token";
      let errorCode = "INVALID_TOKEN";

      if (error?.message?.includes("expired")) {
        errorMessage = "Token has expired";
        errorCode = "TOKEN_EXPIRED";
      }

      res.status(401).json({
        message: errorMessage,
        error: errorCode,
      });
      return false;
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || "STUDENT",
      ...user.user_metadata,
    };
    req.userId = user.id;

    return true;
  } catch (err: unknown) {
    console.log("Authentication error:", err);
    res.status(401).json({
      message: "Invalid or expired token",
      error: "INVALID_TOKEN",
    });
    return false;
  }
};

/**
 * Standard authentication middleware (aal1 sufficient).
 * Used for MFA setup endpoints and general auth.
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  const valid = await extractAndVerifyToken(req, res);
  if (valid) {
    next();
  }
};

/**
 * MFA-enforced authentication middleware (requires aal2).
 * Used for protected endpoints that require completed MFA verification.
 * Checks Supabase MFA factors for the user — if they have enrolled TOTP,
 * the token must carry aal2. If no factors enrolled, aal1 is accepted
 * (enforcement of enrollment is handled on the frontend/route level).
 */
export const authenticateWithMfa = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  const valid = await extractAndVerifyToken(req, res);
  if (!valid) return;

  try {
    // Check if user has MFA factors enrolled
    const { data, error } = await supabaseAdmin.auth.admin.mfa.listFactors({
      userId: req.userId!,
    });

    if (error) {
      console.log("MFA factor check failed:", error.message);
      // If we can't check factors, fall through to allow access
      // (don't block users due to Supabase API issues)
      return next();
    }

    const verifiedFactors = (data?.factors || []).filter(
      (f: any) => f.factor_type === "totp" && f.status === "verified",
    );

    // If user has MFA enrolled, verify the token's AAL level
    if (verifiedFactors.length > 0) {
      // Decode the JWT to check aal claim
      // The Supabase JWT payload contains an `aal` field
      const token =
        req.cookies?.authToken || req.headers["authorization"]?.split(" ")[1];
      if (token) {
        try {
          // Decode the JWT payload (base64) without verification (already verified above)
          const payload = JSON.parse(
            Buffer.from(token.split(".")[1], "base64").toString(),
          );

          if (payload.aal !== "aal2") {
            return res.status(403).json({
              message: "MFA verification required",
              error: "MFA_REQUIRED",
            });
          }
        } catch {
          // If JWT parsing fails, deny access for MFA users
          return res.status(403).json({
            message: "MFA verification required",
            error: "MFA_REQUIRED",
          });
        }
      }
    }

    next();
  } catch (err) {
    console.log("MFA check error:", err);
    // On error, allow access rather than blocking
    next();
  }
};
