import React, { Suspense } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPass from "./pages/ForgotPass";
import { Route, Routes, Navigate } from "react-router-dom";
// Route-level lazy imports to reduce initial bundle size
const Home = React.lazy(() => import("./pages/Home"));
const Scholarship = React.lazy(() => import("./pages/Scholarship"));
const Scholarshipdetails = React.lazy(
  () => import("./pages/Scholarshipdetails"),
);
const Profile = React.lazy(() => import("./pages/Profile"));
const ApplicationStudent = React.lazy(
  () => import("./pages/ApplicationStudent"),
);
const Orgdashboard = React.lazy(() => import("./organization/orgdashboard"));
const ManageScholar = React.lazy(() => import("./organization/ManageScholar"));
const Archive = React.lazy(() => import("./organization/Archive"));
const MfaSetup = React.lazy(() => import("./pages/MfaSetup"));
const MfaVerify = React.lazy(() => import("./pages/MfaVerify"));
const AdminDashboard = React.lazy(() => import("./admin/AdminDashboard"));
const AdminUsers = React.lazy(() => import("./admin/AdminUsers"));
const AdminAuditLogs = React.lazy(() => import("./admin/AdminAuditLogs"));
const AdminAnalytics = React.lazy(() => import("./admin/AdminAnalytics"));
const AdminReports = React.lazy(() => import("./admin/AdminReports"));
import { AuthProvider } from "./AuthProvider/AuthProvider";
import { NotificationProvider } from "./Context/NotificationContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MfaEnforcementRoute from "./components/MfaEnforcementRoute";
import AuthenticatedRedirect from "./components/AuthenticatedRedirect";
import PublicRoute from "./components/PublicRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { Toaster } from "react-hot-toast";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { NetworkStatusBanner } from "./components/NetworkStatusBanner";
import ProfileOrg from "./organization/ProfileOrg";
import EmailVerify from "./pages/EmailVerify";
import RegisterSuccess from "./pages/RegisterSuccess";
import ResetPassword from "./pages/ResetPassword";

function App() {
  const { isOnline } = useNetworkStatus();

  return (
    <>
      <ErrorBoundary>
        <AuthProvider>
          <NotificationProvider>
            {/* Network Status Banner */}
            <NetworkStatusBanner isOnline={isOnline} />

            <Toaster
              position="top-right"
              reverseOrder={false}
              toastOptions={{
                // Add margin-top to account for offline banner
                style: {
                  marginTop: !isOnline ? "60px" : "0px",
                },
              }}
            />

            <Suspense
              fallback={
                <div className="flex items-center justify-center py-6">
                  <div className="h-8 w-8 rounded-full border-4 border-gray-200 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-indigo-400 animate-spin"></div>
                  </div>
                  <span className="sr-only">Loading...</span>
                </div>
              }
            >
              <Routes>
                {/* Public routes - redirect if already authenticated */}
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <div className={!isOnline ? "pt-16" : ""}>
                        <Login />
                      </div>
                    </PublicRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <div className={!isOnline ? "pt-16" : ""}>
                        <Register />
                      </div>
                    </PublicRoute>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <PublicRoute>
                      <div className={!isOnline ? "pt-16" : ""}>
                        <ForgotPass />
                      </div>
                    </PublicRoute>
                  }
                />
                <Route
                  path="/verify"
                  element={
                    <PublicRoute>
                      <div className={!isOnline ? "pt-16" : ""}>
                        <EmailVerify />
                      </div>
                    </PublicRoute>
                  }
                />

                {/* Public student-accessible pages (browse without login) */}
                <Route
                  path="/home"
                  element={
                    <div className={!isOnline ? "pt-16" : ""}>
                      <Home />
                    </div>
                  }
                />
                <Route
                  path="/scholarship"
                  element={
                    <div className={!isOnline ? "pt-16" : ""}>
                      <Scholarship />
                    </div>
                  }
                />
                {/* Scholarship details requires authentication */}
                <Route
                  path="/scholarship/:id"
                  element={
                    <ProtectedRoute allowedRoles={["STUDENT"]}>
                      <MfaEnforcementRoute>
                        <div className={!isOnline ? "pt-16" : ""}>
                          <Scholarshipdetails />
                        </div>
                      </MfaEnforcementRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute allowedRoles={["STUDENT"]}>
                      <MfaEnforcementRoute>
                        <div className={!isOnline ? "pt-16" : ""}>
                          <Profile />
                        </div>
                      </MfaEnforcementRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-applications"
                  element={
                    <ProtectedRoute allowedRoles={["STUDENT"]}>
                      <MfaEnforcementRoute>
                        <div className={!isOnline ? "pt-16" : ""}>
                          <ApplicationStudent />
                        </div>
                      </MfaEnforcementRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Protected organization routes */}
                <Route
                  path="/orgdashboard"
                  element={
                    <ProtectedRoute allowedRoles={["ORGANIZATION"]}>
                      <MfaEnforcementRoute>
                        <div className={!isOnline ? "pt-16" : ""}>
                          <Orgdashboard />
                        </div>
                      </MfaEnforcementRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/manage-scholarships"
                  element={
                    <ProtectedRoute allowedRoles={["ORGANIZATION"]}>
                      <MfaEnforcementRoute>
                        <div className={!isOnline ? "pt-16" : ""}>
                          <ManageScholar />
                        </div>
                      </MfaEnforcementRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/archive"
                  element={
                    <ProtectedRoute allowedRoles={["ORGANIZATION"]}>
                      <MfaEnforcementRoute>
                        <div className={!isOnline ? "pt-16" : ""}>
                          <Archive />
                        </div>
                      </MfaEnforcementRoute>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/Profile-organization"
                  element={
                    <ProtectedRoute allowedRoles={["ORGANIZATION"]}>
                      <MfaEnforcementRoute>
                        <div className={!isOnline ? "pt-16" : ""}>
                          <ProfileOrg />
                        </div>
                      </MfaEnforcementRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Root redirect - smart redirect based on auth state */}
                <Route path="/" element={<AuthenticatedRedirect />} />

                {/* MFA routes - accessible to authenticated users without MFA enforcement */}
                <Route
                  path="/mfa-setup"
                  element={
                    <ProtectedRoute>
                      <div className={!isOnline ? "pt-16" : ""}>
                        <MfaSetup />
                      </div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/mfa-verify"
                  element={
                    <ProtectedRoute>
                      <div className={!isOnline ? "pt-16" : ""}>
                        <MfaVerify />
                      </div>
                    </ProtectedRoute>
                  }
                />

                {/* Admin routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <div className={!isOnline ? "pt-16" : ""}>
                        <AdminDashboard />
                      </div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <div className={!isOnline ? "pt-16" : ""}>
                        <AdminUsers />
                      </div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/audit-logs"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <div className={!isOnline ? "pt-16" : ""}>
                        <AdminAuditLogs />
                      </div>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/analytics"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <div className={!isOnline ? "pt-16" : ""}>
                        <AdminAnalytics />
                      </div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <div className={!isOnline ? "pt-16" : ""}>
                        <AdminReports />
                      </div>
                    </ProtectedRoute>
                  }
                />

                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/register-success" element={<RegisterSuccess />} />
                {/* Catch all - redirect to login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>
          </NotificationProvider>
        </AuthProvider>
      </ErrorBoundary>
    </>
  );
}

export default App;
