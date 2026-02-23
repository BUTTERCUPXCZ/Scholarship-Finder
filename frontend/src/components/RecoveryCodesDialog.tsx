import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  Copy,
  Download,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface RecoveryCodesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codes: string[];
  onDone?: () => void;
}

const RecoveryCodesDialog = ({
  open,
  onOpenChange,
  codes,
  onDone,
}: RecoveryCodesDialogProps) => {
  const [codesCopied, setCodesCopied] = useState(false);

  const copyRecoveryCodes = async () => {
    const codesText = codes.join("\n");
    try {
      await navigator.clipboard.writeText(codesText);
      setCodesCopied(true);
      toast.success("Recovery codes copied to clipboard");
      setTimeout(() => setCodesCopied(false), 3000);
    } catch {
      toast.error("Failed to copy — please copy manually");
    }
  };

  const downloadRecoveryCodes = () => {
    const codesText = [
      "ScholarSphere Recovery Codes",
      "=".repeat(30),
      "",
      "Save these codes in a safe place. Each code can only be used once.",
      "",
      ...codes.map((code, i) => `${i + 1}. ${code}`),
      "",
      `Generated: ${new Date().toISOString()}`,
    ].join("\n");

    const blob = new Blob([codesText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scholarsphere-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Recovery codes downloaded");
  };

  const handleDone = () => {
    onOpenChange(false);
    onDone?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <DialogTitle className="text-2xl text-gray-900">
            Your New Recovery Codes
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            These codes can be used to access your account if you lose your
            authenticator device. Each code can only be used once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-sm">
              <strong>Important:</strong> Save these codes now. They will not be
              shown again.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
            {codes.map((code, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-white rounded border border-gray-100"
              >
                <span className="text-xs text-gray-400 font-mono w-5">
                  {index + 1}.
                </span>
                <code className="text-sm font-mono text-gray-800">{code}</code>
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
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Codes
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
        </div>

        <DialogFooter>
          <Button
            onClick={handleDone}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            I've saved my recovery codes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecoveryCodesDialog;
