import { useEffect, useState } from "react";
import { useAuth } from "../AuthProvider/AuthProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Shield, ShieldCheck, ShieldAlert, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import MfaEnroll from "./MfaEnroll";
import RecoveryCodesDialog from "./RecoveryCodesDialog";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface MfaStatus {
  mfaEnabled: boolean;
  factorCount: number;
  remainingRecoveryCodes: number;
  factors: Array<{
    id: string;
    friendlyName: string;
    createdAt: string;
  }>;
}

const MfaStatusSection = () => {
  const { getToken, refreshMfaStatus } = useAuth();
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [confirmRegenOpen, setConfirmRegenOpen] = useState(false);
  const [recoveryCodesDialogOpen, setRecoveryCodesDialogOpen] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);

  const fetchStatus = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/mfa/status`, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch {
      console.error("Error fetching MFA status");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line
  }, []);

  const handleRegenerateRecoveryCodes = async () => {
    setConfirmRegenOpen(false);
    setIsRegenerating(true);
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/mfa/recovery-codes`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to regenerate recovery codes");

      const data = await response.json();
      setGeneratedCodes(data.codes);
      setRecoveryCodesDialogOpen(true);
    } catch {
      toast.error("Failed to regenerate recovery codes");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRecoveryCodesDone = async () => {
    setGeneratedCodes([]);
    await fetchStatus();
  };

  const handleEnrollComplete = async () => {
    setEnrollDialogOpen(false);
    await fetchStatus();
    await refreshMfaStatus();
  };

  if (isLoading) {
    return (
      <Card className="border-gray-200 bg-white shadow-lg">
        <CardContent className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 bg-white shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl text-gray-900">Security</CardTitle>
            <CardDescription className="text-gray-600">
              Two-factor authentication and recovery codes
            </CardDescription>
          </div>
          {status?.mfaEnabled && (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              MFA Enabled
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status?.mfaEnabled ? (
          <>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Two-factor authentication is enabled
                </p>
                <p className="text-xs text-green-600 mt-0.5">
                  Your account is protected with an authenticator app
                </p>
              </div>
            </div>

            {/* Recovery Codes Status */}
            <div
              className={`flex items-center justify-between p-4 rounded-xl border ${
                status.remainingRecoveryCodes <= 2
                  ? "bg-amber-50 border-amber-200"
                  : "bg-gray-50 border-gray-100"
              }`}
            >
              <div className="flex items-center gap-3">
                {status.remainingRecoveryCodes <= 2 ? (
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                ) : (
                  <Shield className="w-5 h-5 text-gray-600" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Recovery Codes: {status.remainingRecoveryCodes} remaining
                  </p>
                  {status.remainingRecoveryCodes <= 2 && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      You're running low — consider regenerating your codes
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={() => setConfirmRegenOpen(true)}
                disabled={isRegenerating}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 mr-1.5 ${isRegenerating ? "animate-spin" : ""}`}
                />
                {isRegenerating ? "Generating..." : "Regenerate"}
              </Button>
            </div>

            {status.factors.length > 0 && (
              <div className="text-xs text-gray-500 px-1">
                Authenticator configured on{" "}
                {new Date(status.factors[0].createdAt).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <Alert className="border-amber-200 bg-amber-50">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Two-factor authentication is not set up. Enable it now to
                secure your account.
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => setEnrollDialogOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Shield className="w-4 h-4 mr-2" />
              Enable Two-Factor Authentication
            </Button>

            <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
              <DialogContent className="max-w-lg p-0 overflow-hidden">
                <DialogHeader className="sr-only">
                  <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
                  <DialogDescription>
                    Follow the steps to enable two-factor authentication on
                    your account.
                  </DialogDescription>
                </DialogHeader>
                {enrollDialogOpen && (
                  <MfaEnroll onComplete={handleEnrollComplete} />
                )}
              </DialogContent>
            </Dialog>
          </>
        )}
      </CardContent>

      {/* Confirm regeneration dialog */}
      <Dialog open={confirmRegenOpen} onOpenChange={setConfirmRegenOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-blue-600" />
            </div>
            <DialogTitle className="text-center text-2xl text-gray-900">
              Regenerate Recovery Codes?
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              This will invalidate all your existing recovery codes and generate
              new ones. Make sure to save the new codes in a safe place.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => setConfirmRegenOpen(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRegenerateRecoveryCodes}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Regenerate
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recovery codes display dialog */}
      <RecoveryCodesDialog
        open={recoveryCodesDialogOpen}
        onOpenChange={setRecoveryCodesDialogOpen}
        codes={generatedCodes}
        onDone={handleRecoveryCodesDone}
      />
    </Card>
  );
};

export default MfaStatusSection;
