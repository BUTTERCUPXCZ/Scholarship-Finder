import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider/AuthProvider';

const AuthenticatedRedirect = () => {
    const { user, isAuthenticated, isLoading } = useAuth();

    // Show loading while checking auth state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-white">
                <div className="flex flex-col items-center space-y-6">
                    {/* Spinner */}
                    <div className="relative">
                        <div className="h-24 w-24 rounded-full border-4 border-gray-200"></div>
                        <div className="absolute top-0 left-0 h-24 w-24 rounded-full border-4 border-t-indigo-500 border-r-indigo-400 animate-spin"></div>
                    </div>

                    {/* Loading text */}
                    <p className="text-lg font-medium text-gray-700 animate-pulse">
                        Loading scholarships...
                    </p>
                </div>
            </div>
        );
    }

    // If not authenticated, go to login
    if (!isAuthenticated) {
        return <Navigate to="/home" replace />;
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