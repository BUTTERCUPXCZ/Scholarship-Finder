import { Request, Response } from "express";
import { withRLS } from "../lib/rls";
import { supabaseAdmin } from "../config/supabaseClient";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { createAuditLog, extractIpAddress } from "../services/auditLog.service";
import { AuditAction, AuditStatus } from "@prisma/client";

// Generate 10 random recovery codes
const generateRecoveryCodes = (): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString("hex")); // 8-char hex codes
  }
  return codes;
};

// Store recovery codes for a user (called after MFA enrollment)
export const storeRecoveryCodes = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Generate codes
    const plainCodes = generateRecoveryCodes();

    // Hash each code
    const hashedCodes = await Promise.all(
      plainCodes.map(async (code) => {
        const hash = await bcrypt.hash(code, 10);
        return { userId, codeHash: hash };
      }),
    );

    const role = (req.user?.role as string) || 'STUDENT';

    // deleteMany + createMany in one atomic RLS-enforced transaction.
    await withRLS(userId, role, async (tx) => {
      await tx.recoveryCode.deleteMany({ where: { userId } });
      await tx.recoveryCode.createMany({ data: hashedCodes });
    });

    console.log(`✅ Recovery codes generated for user ${userId}`);
    createAuditLog({ userId, action: AuditAction.MFA_RECOVERY_CODES_GENERATED, resource: 'USER', resourceId: userId, ipAddress: extractIpAddress(req), userAgent: (req.headers?.['user-agent'] as string) ?? 'unknown', status: AuditStatus.SUCCESS, metadata: { codesCount: 10 } }).catch((err) => console.error('[AuditLog] Write failed:', err));

    return res.status(200).json({
      success: true,
      codes: plainCodes,
      message:
        "Recovery codes generated. Save these in a safe place — they will not be shown again.",
    });
  } catch (error) {
    console.error("❌ Error generating recovery codes:", error);
    return res
      .status(500)
      .json({ message: "Failed to generate recovery codes" });
  }
};

// Verify a recovery code (used when user can't access their authenticator app)
export const verifyRecoveryCode = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: "Recovery code is required" });
    }

    const role = (req.user?.role as string) || 'STUDENT';

    // Read codes under RLS (recoverycode_select_own policy enforces ownership).
    const recoveryCodes = await withRLS(userId, role, async (tx) => {
      return tx.recoveryCode.findMany({ where: { userId, used: false } });
    });

    if (recoveryCodes.length === 0) {
      return res
        .status(400)
        .json({ message: "No valid recovery codes remaining" });
    }

    // Check each code
    let matchedCode = null;
    for (const rc of recoveryCodes) {
      const isMatch = await bcrypt.compare(code, rc.codeHash);
      if (isMatch) {
        matchedCode = rc;
        break;
      }
    }

    if (!matchedCode) {
      createAuditLog({ userId, action: AuditAction.MFA_RECOVERY_CODE_USED, ipAddress: extractIpAddress(req), userAgent: (req.headers?.['user-agent'] as string) ?? 'unknown', status: AuditStatus.FAILURE, metadata: { reason: 'invalid_recovery_code' } }).catch((err) => console.error('[AuditLog] Write failed:', err));
      return res.status(400).json({ message: "Invalid recovery code" });
    }

    // Mark code as used under RLS in a separate transaction.
    // bcrypt.compare runs between the two withRLS calls (CPU-bound, not DB).
    await withRLS(userId, role, async (tx) => {
      await tx.recoveryCode.update({
        where: { id: matchedCode.id },
        data: { used: true },
      });
    });

    const remainingCodes = recoveryCodes.length - 1;

    console.log(
      `✅ Recovery code used for user ${userId}. ${remainingCodes} codes remaining.`,
    );
    createAuditLog({ userId, action: AuditAction.MFA_RECOVERY_CODE_USED, resource: 'USER', resourceId: userId, ipAddress: extractIpAddress(req), userAgent: (req.headers?.['user-agent'] as string) ?? 'unknown', status: AuditStatus.SUCCESS, metadata: { remainingCodes } }).catch((err) => console.error('[AuditLog] Write failed:', err));

    return res.status(200).json({
      success: true,
      remainingCodes,
      message: "Recovery code verified successfully",
    });
  } catch (error) {
    console.error("❌ Error verifying recovery code:", error);
    return res.status(500).json({ message: "Failed to verify recovery code" });
  }
};

// Get MFA status for the current user
export const getMfaStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check MFA factors via Supabase Admin API
    const { data, error } = await supabaseAdmin.auth.admin.mfa.listFactors({
      userId,
    });

    if (error) {
      console.error("❌ Error fetching MFA factors:", error);
      return res.status(500).json({ message: "Failed to fetch MFA status" });
    }

    const totpFactors = (data?.factors || []).filter(
      (f: { factor_type: string; status: string }) =>
        f.factor_type === "totp" && f.status === "verified",
    );

    const role = (req.user?.role as string) || 'STUDENT';

    // Count remaining recovery codes under RLS.
    const remainingCodes = await withRLS(userId, role, async (tx) => {
      return tx.recoveryCode.count({ where: { userId, used: false } });
    });

    return res.status(200).json({
      success: true,
      mfaEnabled: totpFactors.length > 0,
      factorCount: totpFactors.length,
      remainingRecoveryCodes: remainingCodes,
      factors: totpFactors.map(
        (f: { id: string; friendly_name?: string; created_at: string }) => ({
          id: f.id,
          friendlyName: f.friendly_name,
          createdAt: f.created_at,
        }),
      ),
    });
  } catch (error) {
    console.error("❌ Error getting MFA status:", error);
    return res.status(500).json({ message: "Failed to get MFA status" });
  }
};

// Unenroll MFA factor (admin operation via service role)
export const unenrollMfa = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { factorId } = req.body;
    if (!factorId) {
      return res.status(400).json({ message: "Factor ID is required" });
    }

    // Delete the factor via Supabase Admin
    const { error } = await supabaseAdmin.auth.admin.mfa.deleteFactor({
      userId,
      id: factorId,
    });

    if (error) {
      console.error("❌ Error unenrolling MFA:", error);
      createAuditLog({ userId, action: AuditAction.MFA_UNENROLLED, ipAddress: extractIpAddress(req), userAgent: (req.headers?.['user-agent'] as string) ?? 'unknown', status: AuditStatus.FAILURE, metadata: { factorId, reason: 'supabase_error' } }).catch((err) => console.error('[AuditLog] Write failed:', err));
      return res.status(500).json({ message: "Failed to unenroll MFA" });
    }

    const role = (req.user?.role as string) || 'STUDENT';

    // Delete recovery codes under RLS.
    await withRLS(userId, role, async (tx) => {
      await tx.recoveryCode.deleteMany({ where: { userId } });
    });

    console.log(`✅ MFA unenrolled for user ${userId}`);
    createAuditLog({ userId, action: AuditAction.MFA_UNENROLLED, resource: 'USER', resourceId: userId, ipAddress: extractIpAddress(req), userAgent: (req.headers?.['user-agent'] as string) ?? 'unknown', status: AuditStatus.SUCCESS, metadata: { factorId } }).catch((err) => console.error('[AuditLog] Write failed:', err));

    return res.status(200).json({
      success: true,
      message: "MFA has been unenrolled successfully",
    });
  } catch (error) {
    console.error("❌ Error unenrolling MFA:", error);
    return res.status(500).json({ message: "Failed to unenroll MFA" });
  }
};
