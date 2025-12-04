import React, { Suspense } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPass from './pages/ForgotPass'
import { Route, Routes, Navigate } from 'react-router-dom'
// Route-level lazy imports to reduce initial bundle size
const Home = React.lazy(() => import('./pages/Home'))
const Scholarship = React.lazy(() => import('./pages/Scholarship'))
const Scholarshipdetails = React.lazy(() => import('./pages/Scholarshipdetails'))
const Profile = React.lazy(() => import('./pages/Profile'))
const ApplicationStudent = React.lazy(() => import('./pages/ApplicationStudent'))
const ChatPage = React.lazy(() => import('./pages/Chat'))
const Orgdashboard = React.lazy(() => import('./organization/orgdashboard'))
const ManageScholar = React.lazy(() => import('./organization/ManageScholar'))
const Archive = React.lazy(() => import('./organization/Archive'))
import { AuthProvider } from './AuthProvider/AuthProvider'
import { NotificationProvider } from './Context/NotificationContext'
import ProtectedRoute from './components/ProtectedRoute'
import AuthenticatedRedirect from './components/AuthenticatedRedirect'
import PublicRoute from './components/PublicRoute'
import ErrorBoundary from './components/ErrorBoundary'
import { Toaster } from 'react-hot-toast'
import { useNetworkStatus } from './hooks/useNetworkStatus'
import { NetworkStatusBanner } from './components/NetworkStatusBanner'
import ProfileOrg from './organization/ProfileOrg'
import EmailVerify from './pages/EmailVerify'
import  RegisterSuccess  from './pages/RegisterSuccess'
import  ResetPassword  from './pages/ResetPassword'

function App() {
  const { isOnline } = useNetworkStatus()

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
                  marginTop: !isOnline ? '60px' : '0px',
                },
              }}
            />

            <Suspense fallback={<div className="flex items-center justify-center py-6"><div className="h-8 w-8 rounded-full border-4 border-gray-200 relative"><div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-indigo-400 animate-spin"></div></div><span className="sr-only">Loading...</span></div>}>
              <Routes>
                {/* Public routes - redirect if already authenticated */}
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <div className={!isOnline ? 'pt-16' : ''}>
                        <Login />
                      </div>
                    </PublicRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <div className={!isOnline ? 'pt-16' : ''}>
                        <Register />
                      </div>
                    </PublicRoute>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <PublicRoute>
                      <div className={!isOnline ? 'pt-16' : ''}>
                        <ForgotPass />
                      </div>
                    </PublicRoute>
                  }
                />
                <Route
                  path="/verify"
                  element={
                    <PublicRoute>
                      <div className={!isOnline ? 'pt-16' : ''}>
                        <EmailVerify />
                      </div>
                    </PublicRoute>
                  }
                />

                {/* Public student-accessible pages (browse without login) */}
                <Route
                  path="/home"
                  element={
                    <div className={!isOnline ? 'pt-16' : ''}>
                      <Home />
                    </div>
                  }
                />
                <Route
                  path="/scholarship"
                  element={
                    <div className={!isOnline ? 'pt-16' : ''}>
                      <Scholarship />
                    </div>
                  }
                />
                {/* Scholarship details requires authentication */}
                <Route
                  path="/scholarship/:id"
                  element={
                    <ProtectedRoute allowedRoles={["STUDENT"]}>
                      <div className={!isOnline ? 'pt-16' : ''}>
                        <Scholarshipdetails />
                      </div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute allowedRoles={['STUDENT']}>
                      <div className={!isOnline ? 'pt-16' : ''}>
                        <Profile />
                      </div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-applications"
                  element={
                    <ProtectedRoute allowedRoles={['STUDENT']}>
                      <div className={!isOnline ? 'pt-16' : ''}>
                        <ApplicationStudent />
                      </div>
                    </ProtectedRoute>
                  }
                />

                {/* Chat route - accessible to both students and organizations */}
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute allowedRoles={['STUDENT', 'ORGANIZATION']}>
                      <div className={!isOnline ? 'pt-16' : ''}>
                        <ChatPage />
                      </div>
                    </ProtectedRoute>
                  }
                />


                {/* Protected organization routes */}
                <Route
                  path="/orgdashboard"
                  element={
                    <ProtectedRoute allowedRoles={['ORGANIZATION']}>
                      <div className={!isOnline ? 'pt-16' : ''}>
                        <Orgdashboard />
                      </div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/manage-scholarships"
                  element={
                    <ProtectedRoute allowedRoles={['ORGANIZATION']}>
                      <div className={!isOnline ? 'pt-16' : ''}>
                        <ManageScholar />
                      </div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/archive"
                  element={
                    <ProtectedRoute allowedRoles={['ORGANIZATION']}>
                      <div className={!isOnline ? 'pt-16' : ''}>
                        <Archive />
                      </div>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/Profile-organization"
                  element={
                    <ProtectedRoute allowedRoles={['ORGANIZATION']}>
                      <div className={!isOnline ? 'pt-16' : ''}>
                        <ProfileOrg />
                      </div>
                    </ProtectedRoute>
                  }
                />




                {/* Root redirect - smart redirect based on auth state */}
                <Route path="/" element={<AuthenticatedRedirect />} />

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
  )
}

export default App
