import React from 'react'
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react'

interface OfflineNotificationProps {
    isOnline: boolean
    className?: string
}

export const OfflineNotification: React.FC<OfflineNotificationProps> = ({
    isOnline,
    className = ''
}) => {
    if (isOnline) {
        return null
    }

    return (
        <div className={`fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 shadow-lg ${className}`}>
            <div className="flex items-center justify-center gap-2 max-w-7xl mx-auto">
                <WifiOff className="h-5 w-5" />
                <span className="font-medium">No Internet Connection</span>
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Please check your connection and try again.</span>
            </div>
        </div>
    )
}

interface NetworkStatusBannerProps {
    isOnline: boolean
    showOnlineConfirmation?: boolean
    className?: string
}

export const NetworkStatusBanner: React.FC<NetworkStatusBannerProps> = ({
    isOnline,
    showOnlineConfirmation = true,
    className = ''
}) => {
    const [showOnlineBanner, setShowOnlineBanner] = React.useState(false)
    const [wasOffline, setWasOffline] = React.useState(false)

    React.useEffect(() => {
        if (!isOnline) {
            setWasOffline(true)
            setShowOnlineBanner(false)
        } else if (wasOffline && showOnlineConfirmation) {
            setShowOnlineBanner(true)
            // Hide the "back online" banner after 3 seconds
            const timer = setTimeout(() => {
                setShowOnlineBanner(false)
                setWasOffline(false)
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [isOnline, wasOffline, showOnlineConfirmation])

    // Show offline banner
    if (!isOnline) {
        return (
            <div className={`fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 shadow-lg ${className}`}>
                <div className="flex items-center justify-center gap-2 max-w-7xl mx-auto">
                    <WifiOff className="h-5 w-5" />
                    <span className="font-medium">No Internet Connection</span>
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">Please check your connection and try again.</span>
                </div>
            </div>
        )
    }

    // Show "back online" confirmation banner
    if (showOnlineBanner) {
        return (
            <div className={`fixed top-0 left-0 right-0 z-50 bg-green-600 text-white px-4 py-3 shadow-lg ${className}`}>
                <div className="flex items-center justify-center gap-2 max-w-7xl mx-auto">
                    <Wifi className="h-5 w-5" />
                    <span className="font-medium">Connection Restored</span>
                    <span className="text-sm">You're back online!</span>
                </div>
            </div>
        )
    }

    return null
}

export default NetworkStatusBanner