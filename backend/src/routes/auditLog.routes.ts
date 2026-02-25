import express from "express";
import { authenticate } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";
import { getAuditLogsHandler } from "../controllers/auditLog.controller";

// Re-export so existing test imports keep working
export { requireAdmin };

const router = express.Router();

// GET /audit-logs — paginated audit log query, admin only
router.get("/", authenticate, requireAdmin, getAuditLogsHandler);

export default router;
