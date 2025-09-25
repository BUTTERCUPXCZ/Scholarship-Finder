import { createContext, useState, useContext, useEffect, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

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

            // Guard against non-JSON values being stored (e.g. the literal string "undefined")
            if (!raw) return null;
            const trimmed = raw.trim();
            if (trimmed === 'undefined' || trimmed === 'null' || trimmed === '') {
                try { localStorage.removeItem('auth'); } catch (e) { /* ignore */ }
                return null;
            }

            return JSON.parse(raw) as User;
        } catch (e) {
            // If parsing fails, remove the corrupt value so we don't repeatedly throw
            try { localStorage.removeItem('auth'); } catch (err) { /* ignore */ }
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
                const serialized = JSON.stringify(userData);
                // Avoid writing undefined/null literal strings into storage
                if (typeof serialized === 'string' && serialized !== 'undefined') {
                    localStorage.setItem('auth', serialized);
                } else {
                    try { localStorage.removeItem('auth'); } catch (e) { /* ignore */ }
                }
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
            const serialized = JSON.stringify(user);
            if (typeof serialized === 'string' && serialized !== 'undefined') {
                localStorage.setItem('auth', serialized);
            }
        } catch (e) {
            console.warn('Failed to persist auth user', e);
        }
        setInitialCheckComplete(true);
    }, [queryClient]);

    const logout = useCallback(async () => {
        // 1) Attempt server-side logout (clear http-only cookie)
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/users/logout`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            });
        } catch (err) {
            console.error("Logout request failed:", err);
        }

        // 2) Try to sign out Supabase client session (if used)
        try {
            // supabase.auth may be undefined in some builds, guard for safety
            if (supabase && typeof supabase.auth?.signOut === 'function') {
                await supabase.auth.signOut();
            }
        } catch (err) {
            console.warn('Supabase signOut failed:', err);
        }

        // 3) Clear react-query cache and cancel running queries
        try {
            await queryClient.cancelQueries();
            queryClient.removeQueries();
            queryClient.clear();
        } catch (err) {
            console.warn('Failed to fully clear query client:', err);
        }

        // 4) Clear local storage keys related to auth and any tokens
        try {
            localStorage.removeItem('auth');
            localStorage.removeItem('token');
            // remove any other keys your app may persist
            // localStorage.removeItem('persisted-react-query');
        } catch (err) {
            /* ignore */
        }

        // 5) Broadcast logout to other tabs/windows so they can clear UI state too
        try {
            if ('BroadcastChannel' in window) {
                const bc = new BroadcastChannel('auth');
                bc.postMessage({ type: 'logout' });
                bc.close();
            } else {
                // fallback: write a short-lived timestamp to localStorage which other tabs can listen for
                localStorage.setItem('auth-logout', String(Date.now()));
            }
        } catch (err) {
            /* ignore */
        }

        // 6) Finally update local UI state
        setUser(null);
        setInitialCheckComplete(false);
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
