import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthProvider/AuthProvider';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const { user, token, isLoading } = useAuth();
    const location = useLocation();

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    // If no token or user, redirect to login
    if (!token || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If specific roles are required, check if user has the right role
    if (allowedRoles && allowedRoles.length > 0) {
        const userRole = user.role?.toString?.() ?? '';
        if (!allowedRoles.includes(userRole)) {
            // Redirect based on user's actual role
            if (userRole === 'ORGANIZATION') {
                return <Navigate to="/orgdashboard" replace />;
            } else {
                return <Navigate to="/home" replace />;
            }
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;