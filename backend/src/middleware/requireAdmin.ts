import { Request, Response, NextFunction } from 'express';

/**
 * Admin role guard. Must be used after the `authenticate` middleware.
 * Checks req.user.role === "ADMIN" (set from Supabase user_metadata).
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({
      message: 'Forbidden: Admin access required',
      error: 'INSUFFICIENT_ROLE',
    });
    return;
  }
  next();
};
