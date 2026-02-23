import { Request, Response } from "express";
import { prisma } from "../lib/db";
import { supabaseAdmin } from "../config/supabaseClient";
import bcrypt from "bcrypt";
import crypto from "crypto";

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

    // Delete any existing recovery codes for this user
    await prisma.recoveryCode.deleteMany({ where: { userId } });

    // Store new hashed codes
    await prisma.recoveryCode.createMany({ data: hashedCodes });

    console.log(`✅ Recovery codes generated for user ${userId}`);

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

    // Get unused recovery codes for this user
    const recoveryCodes = await prisma.recoveryCode.findMany({
      where: { userId, used: false },
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
      return res.status(400).json({ message: "Invalid recovery code" });
    }

    // Mark code as used
    await prisma.recoveryCode.update({
      where: { id: matchedCode.id },
      data: { used: true },
    });

    const remainingCodes = recoveryCodes.length - 1;

    console.log(
      `✅ Recovery code used for user ${userId}. ${remainingCodes} codes remaining.`,
    );

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

    // Count remaining recovery codes
    const remainingCodes = await prisma.recoveryCode.count({
      where: { userId, used: false },
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
      return res.status(500).json({ message: "Failed to unenroll MFA" });
    }

    // Delete recovery codes since MFA is being reset
    await prisma.recoveryCode.deleteMany({ where: { userId } });

    console.log(`✅ MFA unenrolled for user ${userId}`);

    return res.status(200).json({
      success: true,
      message: "MFA has been unenrolled successfully",
    });
  } catch (error) {
    console.error("❌ Error unenrolling MFA:", error);
    return res.status(500).json({ message: "Failed to unenroll MFA" });
  }
};
