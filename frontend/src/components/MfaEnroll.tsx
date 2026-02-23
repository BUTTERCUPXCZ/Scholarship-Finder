import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "react-hot-toast";
import {
  Shield,
  Copy,
  Download,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface MfaEnrollProps {
  onComplete: () => void;
}

type EnrollStep = "qr" | "verify" | "recovery";

const MfaEnroll = ({ onComplete }: MfaEnrollProps) => {
  const [step, setStep] = useState<EnrollStep>("qr");
  const [qrUri, setQrUri] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [codesCopied, setCodesCopied] = useState(false);

  // Step 1: Enroll a TOTP factor
  const handleEnroll = async () => {
    setIsEnrolling(true);
    setError(null);
    try {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "ScholarSphere Authenticator",
      });

      if (enrollError) throw enrollError;
      if (!data) throw new Error("No enrollment data returned");

      setQrUri(data.totp.uri);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setStep("qr");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to set up MFA");
      toast.error("Failed to start MFA enrollment");
    } finally {
      setIsEnrolling(false);
    }
  };

  // Step 2: Verify the TOTP code
  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId,
        });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      // MFA is now enrolled and verified — generate recovery codes
      await generateRecoveryCodes();
      setStep("recovery");
      toast.success("MFA enabled successfully!");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Invalid verification code",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Generate recovery codes via backend
  const generateRecoveryCodes = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${API_URL}/mfa/recovery-codes`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to generate recovery codes");

      const data = await response.json();
      setRecoveryCodes(data.codes);
    } catch (err) {
      console.error("Error generating recovery codes:", err);
      // Don't block completion — MFA is already set up
    }
  };

  const copyRecoveryCodes = () => {
    const codesText = recoveryCodes.join("\n");
    navigator.clipboard.writeText(codesText);
    setCodesCopied(true);
    toast.success("Recovery codes copied to clipboard");
    setTimeout(() => setCodesCopied(false), 3000);
  };

  const downloadRecoveryCodes = () => {
    const codesText = `ScholarSphere Recovery Codes\n${"=".repeat(30)}\n\nSave these codes in a safe place. Each code can only be used once.\n\n${recoveryCodes.map((code, i) => `${i + 1}. ${code}`).join("\n")}\n\nGenerated: ${new Date().toISOString()}`;
    const blob = new Blob([codesText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scholarsphere-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Recovery codes downloaded");
  };

  // Auto-enroll on mount
  const enrolledRef = useRef(false);
  useEffect(() => {
    if (!qrUri && !isEnrolling && step === "qr" && !enrolledRef.current) {
      enrolledRef.current = true;
      handleEnroll();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Card className="max-w-lg mx-auto border-gray-200 shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle className="text-2xl text-gray-900">
          {step === "qr" && "Set Up Two-Factor Authentication"}
          {step === "verify" && "Verify Your Authenticator"}
          {step === "recovery" && "Save Your Recovery Codes"}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {step === "qr" &&
            "Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.)"}
          {step === "verify" &&
            "Enter the 6-digit code from your authenticator app to complete setup"}
          {step === "recovery" &&
            "These codes can be used to access your account if you lose your authenticator device"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Show QR Code */}
        {step === "qr" && (
          <>
            {isEnrolling ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : qrUri ? (
              <>
                <div className="flex justify-center p-6 bg-white rounded-xl border border-gray-100">
                  <QRCodeSVG value={qrUri} size={200} level="M" />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Can't scan? Enter this key manually:
                  </p>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <code className="text-sm text-gray-800 font-mono flex-1 break-all">
                      {secret}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(secret);
                        toast.success("Secret key copied");
                      }}
                      className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                    >
                      <Copy className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                <Button
                  onClick={() => setStep("verify")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  I've scanned the QR code
                </Button>
              </>
            ) : null}
          </>
        )}

        {/* Step 2: Verify Code */}
        {step === "verify" && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Enter the 6-digit code from your authenticator app
              </label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setVerifyCode(val);
                  setError(null);
                }}
                placeholder="000000"
                className="text-center text-2xl tracking-[0.5em] font-mono"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep("qr")}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleVerify}
                disabled={isLoading || verifyCode.length !== 6}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? "Verifying..." : "Verify & Enable"}
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Recovery Codes */}
        {step === "recovery" && (
          <>
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Important:</strong> Save these recovery codes now. They
                will not be shown again. Each code can only be used once.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
              {recoveryCodes.map((code, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-white rounded border border-gray-100"
                >
                  <span className="text-xs text-gray-400 font-mono w-5">
                    {index + 1}.
                  </span>
                  <code className="text-sm font-mono text-gray-800">
                    {code}
                  </code>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={copyRecoveryCodes}
                variant="outline"
                className="flex-1"
              >
                {codesCopied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />{" "}
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" /> Copy Codes
                  </>
                )}
              </Button>
              <Button
                onClick={downloadRecoveryCodes}
                variant="outline"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>

            <Button
              onClick={onComplete}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              I've saved my recovery codes — Continue
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MfaEnroll;
