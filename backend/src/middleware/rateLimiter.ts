import { Request, Response, NextFunction } from "express";
import { redisClient } from "../config/redisClient";

interface RateLimitOptions {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Max requests per window
  keyPrefix: string; // Unique prefix per route/context
  message?: string;
}

/**
 * Redis-backed rate limiter middleware.
 * Works correctly across multiple backend processes (horizontal scaling).
 *
 * Key format: `ratelimit:<prefix>:<ip>` or `ratelimit:<prefix>:<userId>`
 *
 * Falls back gracefully to allow requests if Redis is unavailable,
 * so auth/MFA flows are not blocked by infrastructure issues.
 */
const createRedisRateLimiter = (options: RateLimitOptions) => {
  const { windowMs, max, keyPrefix, message } = options;
  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ip = (req.ip || req.headers["x-forwarded-for"] || "unknown") as string;
    const userId = req.userId;

    // Use userId when available (post-auth routes), otherwise fall back to IP
    const identifier = userId || ip;
    const key = `ratelimit:${keyPrefix}:${identifier}`;

    try {
      if (!redisClient.isOpen) {
        // Redis unavailable — allow request to avoid blocking users
        console.warn(`[RateLimit] Redis not connected, skipping rate limit for ${key}`);
        next();
        return;
      }

      const current = await redisClient.incr(key);

      if (current === 1) {
        // First request in this window — set expiry
        await redisClient.expire(key, windowSeconds);
      }

      if (current > max) {
        const ttl = await redisClient.ttl(key);
        const retryAfter = ttl > 0 ? ttl : windowSeconds;

        res.setHeader("Retry-After", String(retryAfter));
        res.status(429).json({
          message: message || "Too many requests. Please try again later.",
          error: "RATE_LIMIT_EXCEEDED",
          retryAfter,
        });
        return;
      }

      next();
    } catch (err) {
      // Redis error — allow request rather than blocking auth flows
      console.error("[RateLimit] Redis error, allowing request:", err);
      next();
    }
  };
};

/**
 * Rate limiter for MFA recovery code verification.
 * Strict: 5 attempts per 15 minutes per user/IP.
 * Recovery codes are high-value targets — brute-forcing must be prevented.
 */
export const mfaRecoveryRateLimit = createRedisRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  keyPrefix: "mfa_recover",
  message: "Too many recovery code attempts. Please wait 15 minutes before trying again.",
});

/**
 * Rate limiter for general MFA-related write operations
 * (unenroll, status changes). 10 per hour per user/IP.
 */
export const mfaOperationsRateLimit = createRedisRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyPrefix: "mfa_ops",
  message: "Too many MFA operation attempts. Please try again later.",
});
