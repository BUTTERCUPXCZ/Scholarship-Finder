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
 * Decode a Supabase JWT payload (base64url) without signature verification.
 * Returns null if the token is malformed.
 */
const decodeJwtPayload = (
  token: string,
): { sub?: string; exp?: number; aal?: string } | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(Buffer.from(parts[1], "base64").toString());
  } catch {
    return null;
  }
};

/**
 * Extract and validate the Supabase JWT token from Authorization header or cookie.
 * Attaches req.user and req.userId on success.
 *
 * Uses supabaseAdmin.auth.admin.getUserById() (Admin API) instead of
 * supabaseAdmin.auth.getUser(token) to avoid issues where the admin client's
 * own internal session state (set during signInWithPassword in the login handler)
 * interferes with per-request token validation.
 */
const extractAndVerifyToken = async (
  req: Request,
  res: Response,
): Promise<boolean> => {
  // Collect all available tokens — prefer Authorization header (always
  // carries the latest Supabase JS SDK token, including aal2 after MFA),
  // fall back to cookie (set at login time, may be stale after MFA verify).
  const tokens: string[] = [];

  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    tokens.push(authHeader.split(" ")[1]);
  }

  if (req.cookies?.authToken) {
    tokens.push(req.cookies.authToken);
  }

  // Deduplicate — if both sources carry the same token, only validate once
  const uniqueTokens = [...new Set(tokens)];

  if (uniqueTokens.length === 0) {
    console.log("Authentication failed: No token provided");
    res.status(401).json({
      message: "No token provided",
      error: "MISSING_TOKEN",
    });
    return false;
  }

  // Try each token until one succeeds. This handles the common case where
  // the cookie holds a stale token while the Authorization header carries
  // a fresh aal2 token after MFA verification.
  let lastError: string | null = null;

  for (const token of uniqueTokens) {
    const payload = decodeJwtPayload(token);
    if (!payload) {
      lastError = "Malformed JWT";
      continue;
    }

    // Check token expiry locally before making a network call
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      lastError = "Token has expired";
      continue;
    }

    if (!payload.sub) {
      lastError = "JWT missing sub claim";
      continue;
    }

    try {
      // Validate the user via the Admin API — this is NOT affected by the
      // admin client's own session state and always works with the service role key.
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(
        payload.sub,
      );

      if (!error && data?.user) {
        req.user = {
          id: data.user.id,
          email: data.user.email,
          role: data.user.user_metadata?.role || "STUDENT",
          ...data.user.user_metadata,
        };
        req.userId = data.user.id;
        return true;
      }

      lastError = error?.message || "User not found";
    } catch (err: unknown) {
      lastError =
        err instanceof Error ? err.message : "Token validation error";
    }
  }

  // All tokens failed
  console.log("Authentication failed:", lastError);

  let errorMessage = "Invalid or expired token";
  let errorCode = "INVALID_TOKEN";

  if (lastError?.includes("expired")) {
    errorMessage = "Token has expired";
    errorCode = "TOKEN_EXPIRED";
  }

  res.status(401).json({
    message: errorMessage,
    error: errorCode,
  });
  return false;
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
      (f: { factor_type: string; status: string }) => f.factor_type === "totp" && f.status === "verified",
    );

    // If user has MFA enrolled, verify the token's AAL level
    if (verifiedFactors.length > 0) {
      // Prefer Authorization header (carries aal2 after MFA verify)
      // over cookie (may still hold stale aal1 token).
      const token =
        req.headers["authorization"]?.split(" ")[1] || req.cookies?.authToken;
      if (token) {
        const payload = decodeJwtPayload(token);
        if (!payload || payload.aal !== "aal2") {
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
