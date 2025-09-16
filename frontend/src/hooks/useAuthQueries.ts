import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { loginUser, registerUser } from '../services/auth'
import toast from 'react-hot-toast'

// ✅ Query keys for auth operations
export const authKeys = {
    all: ['auth'] as const,
    currentUser: () => [...authKeys.all, 'currentUser'] as const,
    sessions: () => [...authKeys.all, 'sessions'] as const,
}

// ✅ User interface
interface User {
    id: string
    fullname: string
    email: string
    role: 'STUDENT' | 'ORGANIZATION'
    createdAt: string
    updatedAt: string
}

// ✅ Check authentication status
const checkAuthStatus = async (): Promise<User | null> => {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        })

        if (response.status === 401) {
            return null
        }

        if (response.ok) {
            const data = await response.json()
            return data.success && data.user ? data.user : null
        }

        return null
    } catch (error) {
        console.error("Failed to check auth status:", error)
        return null
    }
}

// ✅ Hook for checking current authentication status
export const useAuth = () => {
    return useQuery<User | null, Error>({
        queryKey: authKeys.currentUser(),
        queryFn: checkAuthStatus,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: 'always',
    })
}

// ✅ Hook for login mutation with optimistic updates
export const useLogin = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: loginUser,
        onMutate: async () => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: authKeys.currentUser() })
        },
        onSuccess: async (data) => {
            // ✅ Update the user cache optimistically
            queryClient.setQueryData(authKeys.currentUser(), data.user)

            // Small delay to ensure cookie is set
            await new Promise(resolve => setTimeout(resolve, 100))

            toast.success('Login successful!')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Login failed')
        },
        onSettled: () => {
            // ✅ Always refetch to ensure consistency
            queryClient.invalidateQueries({ queryKey: authKeys.currentUser() })
        },
    })
}

// ✅ Hook for register mutation
export const useRegister = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: registerUser,
        onSuccess: async (data) => {
            // ✅ Update the user cache after successful registration
            queryClient.setQueryData(authKeys.currentUser(), data.user)

            // Small delay to ensure cookie is set
            await new Promise(resolve => setTimeout(resolve, 100))

            toast.success('Registration successful!')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Registration failed')
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: authKeys.currentUser() })
        },
    })
}

// ✅ Hook for logout mutation
export const useLogout = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async () => {
            try {
                await fetch(`${import.meta.env.VITE_API_URL}/users/logout`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                })
            } catch (err) {
                console.error("Logout request failed:", err)
            }
        },
        onSuccess: () => {
            // ✅ Clear all cached data
            queryClient.setQueryData(authKeys.currentUser(), null)
            queryClient.removeQueries({ queryKey: authKeys.all })

            // Clear localStorage
            localStorage.removeItem("auth")
            localStorage.removeItem("token")

            toast.success('Logged out successfully!')
        },
        onError: () => {
            // ✅ Even if logout fails on server, clear local state
            queryClient.setQueryData(authKeys.currentUser(), null)
            queryClient.removeQueries({ queryKey: authKeys.all })
            localStorage.removeItem("auth")
            localStorage.removeItem("token")

            toast.success('Logged out!')
        },
    })
}

// ✅ Hook for prefetching user data (performance optimization)
export const usePrefetchAuth = () => {
    const queryClient = useQueryClient()

    return () => {
        queryClient.prefetchQuery({
            queryKey: authKeys.currentUser(),
            queryFn: checkAuthStatus,
            staleTime: 1000 * 60 * 5,
        })
    }
}