import express from "express";
import { authenticate } from "../middleware/auth";
import {
  storeRecoveryCodes,
  verifyRecoveryCode,
  getMfaStatus,
  unenrollMfa,
} from "../controllers/mfa.controller";

const router = express.Router();

// All MFA routes require basic authentication (aal1 is fine since these manage MFA itself)
router.post("/recovery-codes", authenticate, storeRecoveryCodes);
router.post("/recover", authenticate, verifyRecoveryCode);
router.get("/status", authenticate, getMfaStatus);
router.post("/unenroll", authenticate, unenrollMfa);

export default router;
