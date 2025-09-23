import Login from './pages/Login'
import Register from './pages/Register'
import { Route, Routes, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Scholarship from './pages/Scholarship'
import Scholarshipdetails from './pages/Scholarshipdetails'
import Profile from './pages/Profile'
import ApplicationStudent from './pages/ApplicationStudent'
import ChatPage from './pages/Chat'
import Orgdashboard from './organization/orgdashboard'
import ManageScholar from './organization/ManageScholar'
import Archive from './organization/Archive'
import { AuthProvider } from './AuthProvider/AuthProvider'
import { NotificationProvider } from './Context/NotificationContext'
import ProtectedRoute from './components/ProtectedRoute'
import AuthenticatedRedirect from './components/AuthenticatedRedirect'
import PublicRoute from './components/PublicRoute'
import { Toaster } from 'react-hot-toast'
import { useNetworkStatus } from './hooks/useNetworkStatus'
import { NetworkStatusBanner } from './components/NetworkStatusBanner'
import ProfileOrg from './organization/ProfileOrg'

function App() {
  const { isOnline } = useNetworkStatus()

  return (
    <>
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
              path="/Profile"
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

            {/* Catch all - redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </>
  )
}

export default App
