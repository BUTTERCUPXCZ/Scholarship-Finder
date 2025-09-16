import { useState, useEffect } from 'react'

interface NetworkStatus {
    isOnline: boolean
    isOffline: boolean
    hasNetworkError: boolean
}

export const useNetworkStatus = (): NetworkStatus => {
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)
    const [hasNetworkError, setHasNetworkError] = useState<boolean>(false)

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true)
            setHasNetworkError(false)
        }

        const handleOffline = () => {
            setIsOnline(false)
            setHasNetworkError(true)
        }

        // Add event listeners
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        // Cleanup
        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    return {
        isOnline,
        isOffline: !isOnline,
        hasNetworkError
    }
}

// Helper function to check if an error is network-related
export const isNetworkError = (error: any): boolean => {
    if (!error) return false

    // Check for common network error patterns
    const errorMessage = error.message?.toLowerCase() || ''
    const networkErrors = [
        'network error',
        'failed to fetch',
        'connection refused',
        'network request failed',
        'timeout',
        'no internet connection',
        'offline',
        'network changed'
    ]

    return networkErrors.some(networkError => errorMessage.includes(networkError))
}

// Helper function to detect if user has no internet access
export const detectNoInternet = async (): Promise<boolean> => {
    try {
        // Try to fetch a small resource from a reliable source
        await fetch('https://www.google.com/favicon.ico', {
            method: 'HEAD',
            mode: 'no-cors'
        })
        return false // Has internet
    } catch (error) {
        return true // No internet
    }
}