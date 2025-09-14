import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider/AuthProvider';

const AuthenticatedRedirect = () => {
    const { user, isAuthenticated, isLoading } = useAuth();

    // Show loading while checking auth state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    // If not authenticated, go to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If authenticated, redirect based on role
    const userRole = user?.role?.toString?.() ?? '';
    if (userRole === 'ORGANIZATION') {
        return <Navigate to="/orgdashboard" replace />;
    } else {
        return <Navigate to="/home" replace />;
    }
};

export default AuthenticatedRedirect;