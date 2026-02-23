import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthProvider/AuthProvider";
import MfaEnroll from "../components/MfaEnroll";

const MfaSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleComplete = () => {
    // Redirect to the page they were trying to access, or default based on role
    const from = location.state?.from?.pathname;
    if (from) {
      navigate(from, { replace: true });
    } else {
      const redirectPath =
        user?.role === "ORGANIZATION" ? "/orgdashboard" : "/scholarship";
      navigate(redirectPath, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Secure Your Account
          </h1>
          <p className="text-gray-600">
            Two-factor authentication is required for all accounts. Set up your
            authenticator app to continue.
          </p>
        </div>
        <MfaEnroll onComplete={handleComplete} />
      </div>
    </div>
  );
};

export default MfaSetup;
