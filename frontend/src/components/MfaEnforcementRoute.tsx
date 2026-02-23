import { useAuth } from "../AuthProvider/AuthProvider";
import { Navigate, useLocation } from "react-router-dom";

interface MfaEnforcementRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard that ensures authenticated users have MFA enrolled.
 * Uses mfaEnrolled / mfaVerified from AuthProvider (which already calls
 * getAuthenticatorAssuranceLevel) — no extra Supabase call needed here.
 *
 * If the user has no TOTP factor enrolled → redirect to /mfa-setup.
 * If the user has factors but session is aal1 → redirect to /mfa-verify.
 */
const MfaEnforcementRoute = ({ children }: MfaEnforcementRouteProps) => {
  const { loading, user, mfaEnrolled, mfaVerified } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no user, let ProtectedRoute handle the redirect
  if (!user) {
    return <>{children}</>;
  }

  // Has MFA factors but hasn't verified yet in this session
  if (mfaEnrolled && !mfaVerified) {
    return <Navigate to="/mfa-verify" state={{ from: location }} replace />;
  }

  // Uncomment the block below to enforce mandatory MFA enrollment.
  // Only do so AFTER enabling TOTP in your Supabase Dashboard
  // (Authentication → Multi-Factor Authentication → Enable TOTP).
  //
  // if (!mfaEnrolled) {
  //   return <Navigate to="/mfa-setup" state={{ from: location }} replace />;
  // }

  return <>{children}</>;
};

export default MfaEnforcementRoute;
