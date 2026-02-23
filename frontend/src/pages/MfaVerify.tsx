import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthProvider/AuthProvider";
import { supabase } from "../lib/supabase";
import MfaChallenge from "../components/MfaChallenge";

const MfaVerify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getFactors = async () => {
      try {
        const { data, error } = await supabase.auth.mfa.listFactors();

        if (error) {
          console.error("Error listing MFA factors:", error);
          setLoading(false);
          return;
        }

        const totpFactors = data?.totp || [];
        if (totpFactors.length > 0) {
          setFactorId(totpFactors[0].id);
        }
      } catch (err) {
        console.error("Error checking MFA factors:", err);
      } finally {
        setLoading(false);
      }
    };

    getFactors();
  }, []);

  const handleSuccess = () => {
    const from = location.state?.from?.pathname;
    if (from) {
      navigate(from, { replace: true });
    } else {
      const redirectPath =
        user?.role === "ORGANIZATION" ? "/orgdashboard" : "/scholarship";
      navigate(redirectPath, { replace: true });
    }
  };

  const handleCancel = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!factorId) {
    // No factors found — redirect to setup
    navigate("/mfa-setup", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <MfaChallenge
          factorId={factorId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default MfaVerify;
