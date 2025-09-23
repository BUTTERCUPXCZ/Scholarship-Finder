import { createContext, useState, useContext, useEffect, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
    // Try to hydrate from a cached user to avoid a flash-logout on reload.
    const cachedUser: User | null = (() => {
        try {
            const raw = localStorage.getItem('auth');
            return raw ? (JSON.parse(raw) as User) : null;
        } catch (e) {
            console.warn('Failed to parse cached auth user', e);
            return null;
        }
    })();

    const [user, setUser] = useState<User | null>(() => cachedUser);
    // If we have a cached user, consider the initial check 'complete' for UI purposes
    // so we don't show a logged-out flash while the real check runs in the background.
    const [initialCheckComplete, setInitialCheckComplete] = useState<boolean>(() => Boolean(cachedUser));
    const queryClient = useQueryClient();

    const { data: userData, isLoading: queryLoading, refetch, error } = useQuery({
        queryKey: ["auth", "currentUser"],
        queryFn: checkAuthStatus,
        // ✅ Always check auth status to maintain login state across all pages
        enabled: true,
        // Use cached user so the UI stays authenticated instantly on reload while
        // the real request validates the session in the background.
        initialData: cachedUser ?? undefined,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        retry: false,
        refetchOnWindowFocus: false,
    });

    // Sync user state with query and mark initial check as complete
    useEffect(() => {
        // When the server responds, sync state and the cached copy.
        if (userData) {
            setUser(userData);
            try {
                localStorage.setItem('auth', JSON.stringify(userData));
            } catch (e) {
                console.warn('Failed to cache auth user', e);
            }
            setInitialCheckComplete(true);
        } else if (error || userData === null) {
            // Server says unauthenticated -> clear cache and show logged out state.
            setUser(null);
            try {
                localStorage.removeItem('auth');
            } catch (e) {
                /* ignore */
            }
            setInitialCheckComplete(true);
        }
    }, [userData, error]);

    const login = useCallback((user: User) => {
        setUser(user);
        queryClient.setQueryData(["auth", "currentUser"], user);
        try {
            localStorage.setItem('auth', JSON.stringify(user));
        } catch (e) {
            console.warn('Failed to persist auth user', e);
        }
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
