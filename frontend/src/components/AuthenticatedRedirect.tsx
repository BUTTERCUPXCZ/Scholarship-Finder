import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider/AuthProvider';
import { useMemo } from 'react';

const AuthenticatedRedirect = () => {
    const { user, isAuthenticated, isLoading } = useAuth();

    // Memoize the redirect logic to prevent unnecessary re-renders
    const redirectTarget = useMemo(() => {
        if (isLoading) return null;

        if (!isAuthenticated) {
            return '/home';
        }

        // If authenticated, redirect based on role
        const userRole = user?.role?.toString?.() ?? '';
        return userRole === 'ORGANIZATION' ? '/orgdashboard' : '/home';
    }, [isAuthenticated, isLoading, user?.role]);

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

    return <Navigate to={redirectTarget!} replace />;
};

export default AuthenticatedRedirect;