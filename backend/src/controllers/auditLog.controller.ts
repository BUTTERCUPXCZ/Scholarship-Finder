import { Request, Response } from "express";
import { AuditAction, AuditStatus } from "@prisma/client";
import { getAuditLogs, AuditLogFilters } from "../services/auditLog.service";

/**
 * GET /audit-logs
 *
 * Returns a paginated list of audit log entries.
 * Access: ADMIN role only (enforced by requireAdmin middleware in the route).
 *
 * Query params (all optional):
 *   userId    — UUID, filter logs for a specific user
 *   action    — AuditAction enum value
 *   resource  — resource type string (e.g. "SCHOLARSHIP", "APPLICATION")
 *   status    — "SUCCESS" | "FAILURE"
 *   startDate — ISO 8601 date string
 *   endDate   — ISO 8601 date string
 *   page      — integer >= 1 (default: 1)
 *   limit     — integer 1–100 (default: 20)
 */
export const getAuditLogsHandler = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { userId, action, resource, status, startDate, endDate, page, limit } =
      req.query as Record<string, string | undefined>;

    if (action && !(action in AuditAction)) {
      return res.status(400).json({
        message: `Invalid action value. Must be one of: ${Object.keys(AuditAction).join(", ")}`,
      });
    }

    if (status && !(status in AuditStatus)) {
      return res.status(400).json({
        message: "Invalid status value. Must be SUCCESS or FAILURE",
      });
    }

    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (startDate) {
      parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        return res
          .status(400)
          .json({ message: "Invalid startDate format. Use ISO 8601." });
      }
    }

    if (endDate) {
      parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return res
          .status(400)
          .json({ message: "Invalid endDate format. Use ISO 8601." });
      }
    }

    if (parsedStartDate && parsedEndDate && parsedStartDate > parsedEndDate) {
      return res
        .status(400)
        .json({ message: "startDate must be before endDate" });
    }

    const filters: AuditLogFilters = {
      userId: userId || undefined,
      action: action ? (action as AuditAction) : undefined,
      resource: resource || undefined,
      status: status ? (status as AuditStatus) : undefined,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    };

    const result = await getAuditLogs(filters);

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("[AuditLog] Error fetching audit logs:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
