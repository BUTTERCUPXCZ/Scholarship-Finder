import { createContext, useState, useContext, useEffect } from "react";

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
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state from localStorage on mount
    useEffect(() => {
        const initializeAuth = () => {
            try {
                const storedAuth = localStorage.getItem("auth");
                if (storedAuth) {
                    const { user: storedUser, token: storedToken } = JSON.parse(storedAuth);
                    if (storedUser && storedToken) {
                        setUser(storedUser);
                        setToken(storedToken);
                    }
                }
            } catch (error) {
                console.error("Failed to restore auth state:", error);
                // Clear corrupted data
                localStorage.removeItem("auth");
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = (user: User, token: string) => {
        setUser(user);
        setToken(token);
        // Store both user and token together
        localStorage.setItem("auth", JSON.stringify({ user, token }));
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("auth");
        localStorage.removeItem("token"); // Also remove old token storage for migration
    };

    const isAuthenticated = Boolean(user && token);

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isLoading,
            isAuthenticated,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
