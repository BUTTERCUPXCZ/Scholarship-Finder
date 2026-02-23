import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../AuthProvider/AuthProvider";
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
import { ShieldCheck, KeyRound } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface MfaChallengeProps {
  factorId: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

const MfaChallenge = ({ factorId, onSuccess, onCancel }: MfaChallengeProps) => {
  const { refreshMfaStatus } = useAuth();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  // Handle cooldown timer
  const startCooldown = () => {
    setCooldown(30);
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Verify TOTP code
  const handleVerify = async () => {
    if (code.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    if (cooldown > 0) return;

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
        code,
      });

      if (verifyError) throw verifyError;

      // Supabase has upgraded the session to aal2 in localStorage.
      // Sync the new aal2 token to the backend HTTP-only cookie so that
      // cookie-based API calls pass the MFA enforcement check.
      const { data: { session: aal2Session } } = await supabase.auth.getSession();
      if (aal2Session?.access_token) {
        // Send the aal2 token as the Authorization header so the
        // authenticate middleware can validate it even if the cookie
        // from the initial login is not sent (e.g., cross-port in dev).
        await fetch(`${API_URL}/users/refresh-session`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${aal2Session.access_token}`,
          },
          body: JSON.stringify({ token: aal2Session.access_token }),
        });
      }

      // Update AuthProvider MFA state so protected routes reflect aal2
      await refreshMfaStatus();

      toast.success("MFA verification successful");
      onSuccess();
    } catch (err: unknown) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= 3) {
        startCooldown();
        setError("Too many failed attempts. Please wait 30 seconds.");
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Invalid verification code. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
      setCode("");
    }
  };

  // Verify recovery code via backend
  const handleRecoveryVerify = async () => {
    if (!recoveryCode.trim()) {
      setError("Please enter a recovery code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${API_URL}/mfa/recover`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: recoveryCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid recovery code");
      }

      // Recovery code accepted — unenroll the TOTP factor via backend admin API.
      // After this the factor no longer exists, so we must NOT call mfa.challenge().
      const unenrollResponse = await fetch(`${API_URL}/mfa/unenroll`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ factorId }),
      });

      if (!unenrollResponse.ok) {
        throw new Error("Failed to reset MFA after recovery");
      }

      // Refresh the Supabase session — now that the TOTP factor is gone,
      // the session drops back to aal1. Sync the refreshed token to the cookie.
      const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
      if (refreshedSession?.access_token) {
        await fetch(`${API_URL}/users/refresh-session`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          // This will return 403 (aal1) but that's expected — we just want
          // to clear the old cookie. Use a plain cookie-clear approach instead.
          body: JSON.stringify({ token: refreshedSession.access_token }),
        }).catch(() => {
          // Ignore 403 MFA_NOT_VERIFIED — the cookie will be updated on next login
        });
      }

      // Refresh AuthProvider MFA state (mfaEnrolled will now be false)
      await refreshMfaStatus();

      toast.success("Recovery code accepted. MFA has been reset. Please set up MFA again.");
      onSuccess();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to verify recovery code",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (useRecovery) {
        handleRecoveryVerify();
      } else {
        handleVerify();
      }
    }
  };

  return (
    <Card className="max-w-md mx-auto border-gray-200 shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          {useRecovery ? (
            <KeyRound className="w-8 h-8 text-blue-600" />
          ) : (
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          )}
        </div>
        <CardTitle className="text-2xl text-gray-900">
          {useRecovery ? "Enter Recovery Code" : "Two-Factor Authentication"}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {useRecovery
            ? "Enter one of your recovery codes to access your account. This will reset your MFA and you will need to set it up again."
            : "Enter the 6-digit code from your authenticator app to continue."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!useRecovery ? (
          <>
            <div className="space-y-2">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setCode(val);
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="000000"
                className="text-center text-2xl tracking-[0.5em] font-mono"
                autoFocus
                disabled={cooldown > 0}
              />
            </div>

            <Button
              onClick={handleVerify}
              disabled={isLoading || code.length !== 6 || cooldown > 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {cooldown > 0
                ? `Wait ${cooldown}s`
                : isLoading
                  ? "Verifying..."
                  : "Verify"}
            </Button>

            <div className="text-center">
              <button
                onClick={() => {
                  setUseRecovery(true);
                  setError(null);
                }}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Lost access to your authenticator? Use a recovery code
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Input
                type="text"
                value={recoveryCode}
                onChange={(e) => {
                  setRecoveryCode(e.target.value);
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter recovery code"
                className="text-center font-mono"
                autoFocus
              />
            </div>

            <Button
              onClick={handleRecoveryVerify}
              disabled={isLoading || !recoveryCode.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? "Verifying..." : "Use Recovery Code"}
            </Button>

            <div className="text-center">
              <button
                onClick={() => {
                  setUseRecovery(false);
                  setError(null);
                }}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Back to authenticator code
              </button>
            </div>
          </>
        )}

        {onCancel && (
          <Button
            onClick={onCancel}
            variant="ghost"
            className="w-full text-gray-500"
          >
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default MfaChallenge;
