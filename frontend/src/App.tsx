import Login from './pages/Login'
import Register from './pages/Register'
import { Route, Routes, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Orgdashboard from './organization/orgdashboard'
import CreateScholar from './organization/CreateScholar'
import ManageScholar from './organization/ManageScholar'
import { AuthProvider } from './AuthProvider/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'
import AuthenticatedRedirect from './components/AuthenticatedRedirect'
import PublicRoute from './components/PublicRoute'

function App() {
  return (
    <>
      <AuthProvider>
        <Routes>
          {/* Public routes - redirect if already authenticated */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Protected student routes */}
          <Route
            path="/home"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <Home />
              </ProtectedRoute>
            }
          />

          {/* Protected organization routes */}
          <Route
            path="/orgdashboard"
            element={
              <ProtectedRoute allowedRoles={['ORGANIZATION']}>
                <Orgdashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-scholar"
            element={
              <ProtectedRoute allowedRoles={['ORGANIZATION']}>
                <CreateScholar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-scholarships"
            element={
              <ProtectedRoute allowedRoles={['ORGANIZATION']}>
                <ManageScholar />
              </ProtectedRoute>
            }
          />


          {/* Root redirect - smart redirect based on auth state */}
          <Route path="/" element={<AuthenticatedRedirect />} />

          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </>
  )
}

export default App
