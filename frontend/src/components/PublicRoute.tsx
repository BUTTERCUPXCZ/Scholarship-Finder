import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider/AuthProvider';

interface PublicRouteProps {
    children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
    const { user, isAuthenticated, isLoading } = useAuth();

    // Show loading while checking auth state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    // If authenticated, redirect to appropriate dashboard
    if (isAuthenticated && user) {
        const userRole = user.role?.toString?.() ?? '';
        if (userRole === 'ORGANIZATION') {
            return <Navigate to="/orgdashboard" replace />;
        } else {
            return <Navigate to="/home" replace />;
        }
    }

    // Not authenticated, show the public page (login/register)
    return <>{children}</>;
};

export default PublicRoute;