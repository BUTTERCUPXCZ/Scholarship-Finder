import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";

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
  loading: boolean;
  isAuthenticated: boolean;
  mfaEnrolled: boolean;
  mfaVerified: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  refetchUser: () => Promise<void>;
  getToken: () => Promise<string | null>;
  refreshMfaStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mfaEnrolled, setMfaEnrolled] = useState(false);
  const [mfaVerified, setMfaVerified] = useState(false);
  const queryClient = useQueryClient();

  // Fetch user profile from backend using the Supabase token
  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/users/me`, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
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

  const checkMfaStatus = useCallback(async (currentSession: Session | null) => {
    if (!currentSession) {
      setMfaEnrolled(false);
      setMfaVerified(false);
      return;
    }
    try {
      const { data, error } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) {
        console.warn(
          "MFA status check failed (MFA may not be enabled in Supabase):",
          error.message,
        );
        setMfaEnrolled(false);
        setMfaVerified(false);
        return;
      }
      if (data) {
        const enrolled = data.nextLevel === "aal2";
        const verified = data.currentLevel === "aal2";
        setMfaEnrolled(enrolled);
        setMfaVerified(verified);
      }
    } catch {
      console.warn("MFA status check error");
      setMfaEnrolled(false);
      setMfaVerified(false);
    }
  }, []);

  const refreshMfaStatus = useCallback(async () => {
    await checkMfaStatus(session);
  }, [session, checkMfaStatus]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (mounted) {
          setSession(initialSession);

          if (initialSession?.access_token) {
            const userProfile = await fetchUserProfile(
              initialSession.access_token,
            );
            if (mounted) setUser(userProfile);
            // Check MFA status in parallel, don't block loading
            checkMfaStatus(initialSession).catch(console.warn);
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      setSession(newSession);

      if (newSession?.access_token) {
        if (!user || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          const userProfile = await fetchUserProfile(newSession.access_token);
          if (mounted) setUser(userProfile);
        }
        // Fire and forget MFA check
        checkMfaStatus(newSession).catch(console.warn);
      } else if (event === "SIGNED_OUT") {
        if (mounted) {
          setUser(null);
          setMfaEnrolled(false);
          setMfaVerified(false);
        }
        queryClient.clear();
      }

      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]); // eslint-disable-line react-hooks/exhaustive-deps

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      try {
        await fetch(`${API_URL}/users/logout`, { method: "POST" });
      } catch {
        // Ignore backend logout error if network fails
      }
      setUser(null);
      setSession(null);
      setMfaEnrolled(false);
      setMfaVerified(false);
      queryClient.clear();
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [queryClient]);

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      return data.session.access_token;
    }
    // Fallback: token stored by completeLogin during the login flow.
    // Covers the brief window after setSession() before onAuthStateChange
    // has fired and the Supabase client's internal cache is warm.
    return localStorage.getItem("token");
  }, []);

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

  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      loading: isLoading,
      isAuthenticated: !!user,
      mfaEnrolled,
      mfaVerified,
      login,
      logout,
      signOut: logout,
      refetchUser,
      getToken,
      refreshMfaStatus,
    }),
    [
      user,
      session,
      isLoading,
      mfaEnrolled,
      mfaVerified,
      login,
      logout,
      refetchUser,
      getToken,
      refreshMfaStatus,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthProvider;
