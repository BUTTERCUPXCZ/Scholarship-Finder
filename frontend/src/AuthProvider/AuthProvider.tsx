import { createContext, useState, useContext, useEffect, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';

interface User {
    id: string;
    fullname: string;
    email: string;
    role: 'STUDENT' | 'ORGANIZATION';
    createdAt?: string;
    updatedAt?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (user: User) => void;
    logout: () => void;
    refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const checkAuthStatus = async (): Promise<User | null> => {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.status === 401) {
            // Not authenticated yet → return null without error
            return null;
        }

        if (response.ok) {
            const data = await response.json();
            return data.success && data.user ? data.user : null;
        }

        return null;
    } catch (error) {
        console.error("AuthProvider - Failed to check auth status:", error);
        return null;
    }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [initialCheckComplete, setInitialCheckComplete] = useState(false);
    const queryClient = useQueryClient();
    const location = useLocation();

    // Check if current route is a public page that doesn't require auth check
    const isPublicPage = useMemo(() => {
        const publicPaths = ["/login", "/register", "/home", "/scholarship"];
        // Only the exact /scholarship path is public, not /scholarship/:id
        return publicPaths.includes(location.pathname);
    }, [location.pathname]);

    const { data: userData, isLoading: queryLoading, refetch, error } = useQuery({
        queryKey: ["auth", "currentUser"],
        queryFn: checkAuthStatus,
        // ✅ Only run auth check on pages that actually need authentication
        enabled: !isPublicPage,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        retry: false,
        refetchOnWindowFocus: false,
    });

    // Sync user state with query and mark initial check as complete
    useEffect(() => {
        if (userData) {
            setUser(userData);
            setInitialCheckComplete(true);
        } else if (error || userData === null) {
            setUser(null);
            setInitialCheckComplete(true);
        }
    }, [userData, error]);

    // On public pages, mark initial check as complete immediately
    useEffect(() => {
        if (isPublicPage) {
            setInitialCheckComplete(true);
        }
    }, [isPublicPage]);

    const login = useCallback((user: User) => {
        setUser(user);
        queryClient.setQueryData(["auth", "currentUser"], user);
        setInitialCheckComplete(true);
    }, [queryClient]);

    const logout = useCallback(async () => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/users/logout`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            });
        } catch (err) {
            console.error("Logout request failed:", err);
        } finally {
            setUser(null);
            setInitialCheckComplete(false);
            queryClient.removeQueries({ queryKey: ["auth"] });
            localStorage.removeItem("auth");
            localStorage.removeItem("token");
        }
    }, [queryClient]);

    const refetchUser = useCallback(() => {
        refetch();
    }, [refetch]);

    // Show loading only while we're still checking auth status
    const isLoading = queryLoading || !initialCheckComplete;
    const isAuthenticated = Boolean(user);

    const value = useMemo(() => ({
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        refetchUser,
    }), [user, isLoading, isAuthenticated, login, logout, refetchUser]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
