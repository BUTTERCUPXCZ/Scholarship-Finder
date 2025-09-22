import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider/AuthProvider';

interface PublicRouteProps {
    children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
    const { user, isAuthenticated } = useAuth();


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