import {
    createContext,
    useState,
    useContext,
    useEffect,
    useMemo,
    useCallback,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import {type Session } from "@supabase/supabase-js";

interface User {
    id: string;
    fullname: string;
    email: string;
    role: "STUDENT" | "ORGANIZATION";
    createdAt?: string;
    updatedAt?: string;
    [key: string]: any;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (user: User) => void;
    logout: () => Promise<void>;
    refetchUser: () => Promise<void>;
    getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const queryClient = useQueryClient();

    // Fetch user profile from backend using the Supabase token
    const fetchUserProfile = async (token: string) => {
        try {
            const response = await fetch(`${API_URL}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.user) {
                    return data.user;
                }
            }
            return null;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            return null;
        }
    };

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                // Get initial session
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                
                if (mounted) {
                    setSession(initialSession);
                    
                    if (initialSession?.access_token) {
                        const userProfile = await fetchUserProfile(initialSession.access_token);
                        if (mounted) setUser(userProfile);
                    }
                }
            } catch (error) {
                console.error("Auth initialization error:", error);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (!mounted) return;
            
            setSession(newSession);

            if (newSession?.access_token) {
                // Only fetch profile if we don't have it or if it's a SIGN_IN event or TOKEN_REFRESHED
                if (!user || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    const userProfile = await fetchUserProfile(newSession.access_token);
                    if (mounted) setUser(userProfile);
                }
            } else if (event === 'SIGNED_OUT') {
                if (mounted) setUser(null);
                queryClient.clear();
            }
            
            if (mounted) setIsLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [queryClient]);

    const logout = useCallback(async () => {
        try {
            await supabase.auth.signOut();
            // Backend logout to clear cookies if any
            try {
                await fetch(`${API_URL}/users/logout`, { method: 'POST' });
            } catch (e) {
                // Ignore backend logout error if network fails
            }
            setUser(null);
            setSession(null);
            queryClient.clear();
        } catch (error) {
            console.error("Logout error:", error);
        }
    }, [queryClient]);

    // Helper to get current token
    const getToken = useCallback(async () => {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token || null;
    }, []);

    // Compatibility login function
    const login = useCallback((u: User) => {
        setUser(u);
    }, []);

    const refetchUser = useCallback(async () => {
        const token = await getToken();
        if (token) {
            const userProfile = await fetchUserProfile(token);
            setUser(userProfile);
        }
    }, [getToken]);

    const value = useMemo(() => ({
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refetchUser,
        getToken
    }), [user, session, isLoading, login, logout, refetchUser, getToken]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
