import {
    createContext,
    useState,
    useContext,
    useEffect,
    useMemo,
    useCallback,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

interface User {
    id: string;
    fullname: string;
    email: string;
    role: "STUDENT" | "ORGANIZATION";
    createdAt?: string;
    updatedAt?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (user: User) => void;
    logout: () => Promise<void>;
    refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/** --- Utility Helpers --- */
const persistUser = (user: User | null) => {
    try {
        if (user) {
            localStorage.setItem("auth", JSON.stringify(user));
        } else {
            localStorage.removeItem("auth");
        }
    } catch (e) {
        console.warn("Failed to persist auth state", e);
    }
};

const clearUserCache = () => {
    try {
        localStorage.removeItem("auth");
        localStorage.removeItem("token");
    } catch {
        /* ignore */
    }
};

/** --- Auth Status Check --- */
const checkAuthStatus = async (): Promise<User | null> => {
    try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        const token = localStorage.getItem("token");
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}/users/me`, {
            method: "GET",
            credentials: "include",
            headers,
        });

        if (response.status === 401) return null;

        if (response.ok) {
            const data = await response.json();
            return data?.success && data?.user ? data.user : null;
        }

        return null;
    } catch (error) {
        console.error("AuthProvider - Failed to check auth status:", error);
        return null;
    }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    /** Hydrate from cache */
    const cachedUser = (() => {
        try {
            const raw = localStorage.getItem("auth");
            if (!raw || ["null", "undefined", ""].includes(raw.trim())) return null;
            return JSON.parse(raw) as User;
        } catch {
            localStorage.removeItem("auth");
            return null;
        }
    })();

    const [user, setUser] = useState<User | null>(cachedUser);
    const [initialCheckDone, setInitialCheckDone] = useState(Boolean(cachedUser));
    const queryClient = useQueryClient();

    /** React Query - Auth check */
    const { data, isLoading: queryLoading, refetch, error } = useQuery({
        queryKey: ["auth", "currentUser"],
        queryFn: checkAuthStatus,
        enabled: true,
        initialData: cachedUser ?? undefined,
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 30,
        retry: (failureCount) => failureCount < 2,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    /** Sync state when query resolves */
    useEffect(() => {
        if (data) {
            setUser(data);
            persistUser(data);
        } else if (error || data === null) {
            setUser(null);
            clearUserCache();
        }
        setInitialCheckDone(true);
    }, [data, error]);

    /** Broadcast logout across tabs */
    useEffect(() => {
        const bc = "BroadcastChannel" in window ? new BroadcastChannel("auth") : null;

        if (bc) {
            bc.onmessage = (msg) => {
                if (msg.data?.type === "logout") {
                    setUser(null);
                    clearUserCache();
                }
            };
        } else {
            const listener = (e: StorageEvent) => {
                if (e.key === "auth-logout") {
                    setUser(null);
                    clearUserCache();
                }
            };
            window.addEventListener("storage", listener);
            return () => window.removeEventListener("storage", listener);
        }

        return () => bc?.close();
    }, []);

    /** Login */
    const login = useCallback(
        (u: User) => {
            setUser(u);
            persistUser(u);
            queryClient.setQueryData(["auth", "currentUser"], u);
            setInitialCheckDone(true);
        },
        [queryClient]
    );

    /** Logout */
    const logout = useCallback(async () => {
        try {
            await fetch(`${API_URL}/users/logout`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            });
        } catch (err) {
            console.error("Logout request failed:", err);
        }

        try {
            if (supabase?.auth?.signOut) await supabase.auth.signOut();
        } catch (err) {
            console.warn("Supabase signOut failed:", err);
        }

        await queryClient.cancelQueries({ queryKey: ["auth"] });
        queryClient.removeQueries({ queryKey: ["auth"] });
        queryClient.setQueryData(["auth", "currentUser"], null);

        clearUserCache();

        // Broadcast logout
        try {
            if ("BroadcastChannel" in window) {
                const bc = new BroadcastChannel("auth");
                bc.postMessage({ type: "logout" });
                bc.close();
            } else {
                localStorage.setItem("auth-logout", String(Date.now()));
            }
        } catch {
            /* ignore */
        }

        setUser(null);
        setInitialCheckDone(true);
    }, [queryClient]);

    const refetchUser = useCallback(() => refetch(), [refetch]);

    const isLoading = queryLoading || !initialCheckDone;
    const isAuthenticated = !!user;

    const value = useMemo(
        () => ({
            user,
            isLoading,
            isAuthenticated,
            login,
            logout,
            refetchUser,
        }),
        [user, isLoading, isAuthenticated, login, logout, refetchUser]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
    return ctx;
};
