import express from "express";
import { authenticate } from "../middleware/auth";
import {
  storeRecoveryCodes,
  verifyRecoveryCode,
  getMfaStatus,
  unenrollMfa,
} from "../controllers/mfa.controller";
import { mfaRecoveryRateLimit, mfaOperationsRateLimit } from "../middleware/rateLimiter";

const router = express.Router();

// All MFA routes require basic authentication (aal1 is fine since these manage MFA itself)
router.post("/recovery-codes", authenticate, storeRecoveryCodes);
// Recovery code verification is rate-limited: 5 attempts per 15 min per user
router.post("/recover", authenticate, mfaRecoveryRateLimit, verifyRecoveryCode);
router.get("/status", authenticate, getMfaStatus);
// Unenroll is rate-limited: 10 per hour per user to prevent abuse
router.post("/unenroll", authenticate, mfaOperationsRateLimit, unenrollMfa);

export default router;
