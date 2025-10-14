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
            <div className="flex items-center justify-center h-24">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full border-4 border-gray-200 relative">
                        <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-indigo-400 animate-spin"></div>
                    </div>
                    <span className="text-sm text-gray-600">Checking session...</span>
                </div>
            </div>
        );
    }

    return <Navigate to={redirectTarget!} replace />;
};

export default AuthenticatedRedirect;