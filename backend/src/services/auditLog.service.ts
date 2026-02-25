import { Request } from "express";
import { prisma } from "../lib/db";
import { AuditAction, AuditStatus, Prisma } from "@prisma/client";

// ---- Types ----------------------------------------------------------------

export interface CreateAuditLogData {
  userId?: string | null;
  action: AuditAction;
  resource?: string | null;
  resourceId?: string | null;
  ipAddress: string;
  userAgent: string;
  status: AuditStatus;
  metadata?: Record<string, unknown> | null;
}

export interface AuditLogFilters {
  userId?: string;
  action?: AuditAction;
  resource?: string;
  status?: AuditStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// ---- IP extraction --------------------------------------------------------

/**
 * Extract the real client IP from a request.
 *
 * Priority:
 *   1. x-forwarded-for (first IP in chain — closest to client)
 *   2. x-real-ip (nginx convention)
 *   3. req.ip (Express, respects trust proxy — already set to 1 in index.ts)
 *
 * Strips IPv6-mapped IPv4 notation (::ffff:1.2.3.4 → 1.2.3.4).
 */
export const extractIpAddress = (req: Request): string => {
  const forwardedFor = req.headers["x-forwarded-for"];

  let ip: string | undefined;

  if (forwardedFor) {
    const raw = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    ip = raw.split(",")[0].trim();
  } else if (typeof req.headers["x-real-ip"] === "string") {
    ip = req.headers["x-real-ip"];
  } else {
    ip = req.ip;
  }

  if (!ip) return "unknown";

  // Normalize IPv6-mapped IPv4 (::ffff:1.2.3.4 → 1.2.3.4)
  if (ip.startsWith("::ffff:")) ip = ip.slice(7);

  // Normalize IPv6 loopback to standard localhost notation
  if (ip === "::1") ip = "127.0.0.1";

  return ip;
};

// ---- Core write -----------------------------------------------------------

/**
 * Persist an audit log entry asynchronously.
 *
 * IMPORTANT: This is intentionally fire-and-forget at the call site.
 * Always call as:
 *   createAuditLog(data).catch((err) => console.error('[AuditLog] Write failed:', err));
 *
 * A DB write failure must NEVER propagate back to the HTTP response.
 */
export const createAuditLog = async (
  data: CreateAuditLogData,
): Promise<void> => {
  await prisma.auditLog.create({
    data: {
      userId: data.userId ?? null,
      action: data.action,
      resource: data.resource ?? null,
      resourceId: data.resourceId ?? null,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      status: data.status,
      metadata: data.metadata
        ? (data.metadata as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    },
  });
};

// ---- Query ----------------------------------------------------------------

export const getAuditLogs = async (filters: AuditLogFilters) => {
  const page = Math.max(filters.page ?? 1, 1);
  const limit = Math.min(filters.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Prisma.AuditLogWhereInput = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.action) where.action = filters.action;
  if (filters.resource) where.resource = filters.resource;
  if (filters.status) where.status = filters.status;

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate)
      (where.createdAt as Prisma.DateTimeFilter).gte = filters.startDate;
    if (filters.endDate)
      (where.createdAt as Prisma.DateTimeFilter).lte = filters.endDate;
  }

  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        userId: true,
        action: true,
        resource: true,
        resourceId: true,
        ipAddress: true,
        userAgent: true,
        status: true,
        metadata: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: logs,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};
