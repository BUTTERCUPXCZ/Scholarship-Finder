import React, { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthProvider/AuthProvider';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, type Notification } from '../services/notification';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import socketService from '../services/socketService';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    refreshNotifications: () => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    removeNotification: (notificationId: string) => Promise<void>;
    isLoading: boolean;
    isPolling: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const { user, isAuthenticated } = useAuth();
    const { isOnline } = useNetworkStatus();

    // Refs for cleanup and optimization
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastFetchRef = useRef<number>(0);
    const isRefreshingRef = useRef(false);

    // Constants for polling optimization
    const POLL_INTERVAL = 30000; // 30 seconds when active
    const INACTIVE_POLL_INTERVAL = 120000; // 2 minutes when inactive
    const RETRY_DELAY = 5000; // 5 seconds retry delay
    const MIN_FETCH_INTERVAL = 10000; // Minimum 10 seconds between fetches

    const refreshNotifications = useCallback(async (force = false) => {
        if (!isAuthenticated || !user || !isOnline) return;

        // Prevent rapid successive calls
        const now = Date.now();
        if (!force && now - lastFetchRef.current < MIN_FETCH_INTERVAL) {
            return;
        }

        // Prevent concurrent requests
        if (isRefreshingRef.current) return;

        isRefreshingRef.current = true;
        setIsLoading(true);

        try {
            const fetchedNotifications = await getNotifications();
            setNotifications(fetchedNotifications);
            setUnreadCount(fetchedNotifications.filter(n => !n.read).length);
            lastFetchRef.current = now;

            // Clear any retry timeout on success
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = null;
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);

            // Implement exponential backoff retry
            if (!retryTimeoutRef.current) {
                retryTimeoutRef.current = setTimeout(() => {
                    retryTimeoutRef.current = null;
                    refreshNotifications(true);
                }, RETRY_DELAY);
            }
        } finally {
            setIsLoading(false);
            isRefreshingRef.current = false;
        }
    }, [isAuthenticated, user, isOnline]);

    const markAsRead = useCallback(async (notificationId: string) => {
        // Optimistic update
        setNotifications(prev =>
            prev.map(notification =>
                notification.id === notificationId
                    ? { ...notification, read: true }
                    : notification
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            await markNotificationAsRead(notificationId);
        } catch (error) {
            console.error('Error marking notification as read:', error);
            // Revert optimistic update on error
            setNotifications(prev =>
                prev.map(notification =>
                    notification.id === notificationId
                        ? { ...notification, read: false }
                        : notification
                )
            );
            setUnreadCount(prev => prev + 1);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        // Store previous state for rollback
        const previousNotifications = notifications;
        const previousUnreadCount = unreadCount;

        // Optimistic update
        setNotifications(prev =>
            prev.map(notification => ({ ...notification, read: true }))
        );
        setUnreadCount(0);

        try {
            await markAllNotificationsAsRead();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            // Revert optimistic update on error
            setNotifications(previousNotifications);
            setUnreadCount(previousUnreadCount);
        }
    }, [notifications, unreadCount]);

    const removeNotification = useCallback(async (notificationId: string) => {
        // Store notification for rollback
        const notificationToRemove = notifications.find(n => n.id === notificationId);
        if (!notificationToRemove) return;

        const wasUnread = !notificationToRemove.read;

        // Optimistic update
        setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
        if (wasUnread) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }

        try {
            await deleteNotification(notificationId);
        } catch (error) {
            console.error('Error deleting notification:', error);
            // Revert optimistic update on error
            setNotifications(prev => [notificationToRemove, ...prev]);
            if (wasUnread) {
                setUnreadCount(prev => prev + 1);
            }
        }
    }, [notifications]);

    // Smart polling based on document visibility and user activity
    const startPolling = useCallback(() => {
        if (pollIntervalRef.current) return;

        setIsPolling(true);
        const pollFunction = () => {
            if (document.visibilityState === 'visible') {
                refreshNotifications();
            }
        };

        // Use different intervals based on document visibility
        const interval = document.visibilityState === 'visible' ? POLL_INTERVAL : INACTIVE_POLL_INTERVAL;
        pollIntervalRef.current = setInterval(pollFunction, interval);
    }, [refreshNotifications]);

    const stopPolling = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            setIsPolling(false);
        }
    }, []);

    // Handle document visibility change for smart polling
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isAuthenticated && isOnline) {
                refreshNotifications();
                startPolling();
            } else {
                stopPolling();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isAuthenticated, isOnline, refreshNotifications, startPolling, stopPolling]);

    // Handle online/offline status
    useEffect(() => {
        if (isOnline && isAuthenticated) {
            refreshNotifications(true);
            startPolling();
        } else {
            stopPolling();
        }
    }, [isOnline, isAuthenticated, refreshNotifications, startPolling, stopPolling]);

    // Socket.IO and Supabase realtime setup
    useEffect(() => {
        if (!isAuthenticated || !user) return;

        // Initial fetch
        refreshNotifications(true);

        let socketCleanupFunction: (() => void) | null = null;

        // Set up Socket.IO for real-time notifications (primary)
        const setupSocketIO = () => {
            try {
                // Get token from localStorage or cookie (assuming JWT auth)
                const token = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('token='))
                    ?.split('=')[1];

                if (token) {
                    socketService.connect(token);

                    // Set up Socket.IO event listeners
                    const handleNewNotification = (notification: Notification) => {
                        console.log('New notification via Socket.IO:', notification);
                        setNotifications(prev => {
                            const exists = prev.some(n => n.id === notification.id);
                            if (exists) return prev;
                            return [notification, ...prev];
                        });
                        setUnreadCount(prev => prev + 1);

                        // Show browser notification
                        if (Notification.permission === 'granted') {
                            new Notification('New Scholarship Update', {
                                body: notification.message,
                                icon: '/favicon.ico'
                            });
                        }
                    };

                    const handleNotificationUpdate = (notification: Notification) => {
                        console.log('Notification updated via Socket.IO:', notification);
                        setNotifications(prev =>
                            prev.map(n =>
                                n.id === notification.id ? notification : n
                            )
                        );
                        // Recalculate unread count
                        setNotifications(current => {
                            setUnreadCount(current.filter(n => !n.read).length);
                            return current;
                        });
                    };

                    const handleNotificationDeleted = ({ notificationId }: { notificationId: string }) => {
                        console.log('Notification deleted via Socket.IO:', notificationId);
                        setNotifications(prev => {
                            const notification = prev.find(n => n.id === notificationId);
                            if (notification && !notification.read) {
                                setUnreadCount(current => Math.max(0, current - 1));
                            }
                            return prev.filter(n => n.id !== notificationId);
                        });
                    };

                    socketService.onNewNotification(handleNewNotification);
                    socketService.onNotificationUpdate(handleNotificationUpdate);
                    socketService.onNotificationDeleted(handleNotificationDeleted);

                    // Store cleanup function
                    socketCleanupFunction = () => {
                        socketService.offNewNotification(handleNewNotification);
                        socketService.offNotificationUpdate(handleNotificationUpdate);
                        socketService.offNotificationDeleted(handleNotificationDeleted);
                    };
                }
            } catch (error) {
                console.error('Socket.IO setup failed, falling back to Supabase realtime:', error);
            }
        };

        setupSocketIO();

        // Supabase realtime as fallback
        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'Notification',
                    filter: `userId=eq.${user.id}`
                },
                (payload) => {
                    // Only use if Socket.IO is not connected
                    if (!socketService.isSocketConnected()) {
                        console.log('New notification via Supabase realtime:', payload);
                        const newNotification = payload.new as Notification;

                        setNotifications(prev => {
                            const exists = prev.some(n => n.id === newNotification.id);
                            if (exists) return prev;
                            return [newNotification, ...prev];
                        });
                        setUnreadCount(prev => prev + 1);

                        if (Notification.permission === 'granted') {
                            new Notification('New Scholarship Update', {
                                body: newNotification.message,
                                icon: '/favicon.ico'
                            });
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'Notification',
                    filter: `userId=eq.${user.id}`
                },
                (payload) => {
                    if (!socketService.isSocketConnected()) {
                        console.log('Notification updated via Supabase realtime:', payload);
                        const updatedNotification = payload.new as Notification;

                        setNotifications(prev =>
                            prev.map(notification =>
                                notification.id === updatedNotification.id
                                    ? updatedNotification
                                    : notification
                            )
                        );

                        setNotifications(current => {
                            setUnreadCount(current.filter(n => !n.read).length);
                            return current;
                        });
                    }
                }
            )
            .subscribe();

        // Request notification permission
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Connection health check
        const healthCheckInterval = setInterval(() => {
            if (socketService.isSocketConnected()) {
                socketService.ping();
            }
        }, 30000); // Ping every 30 seconds

        // Cleanup
        return () => {
            supabase.removeChannel(channel);
            clearInterval(healthCheckInterval);
            if (socketCleanupFunction) {
                socketCleanupFunction();
            }
        };
    }, [isAuthenticated, user, refreshNotifications]);

    // Cleanup on unmount or auth change
    useEffect(() => {
        return () => {
            stopPolling();
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            // Disconnect Socket.IO when user logs out
            if (!isAuthenticated) {
                socketService.disconnect();
            }
        };
    }, [stopPolling, isAuthenticated]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                refreshNotifications: () => refreshNotifications(true),
                markAsRead,
                markAllAsRead,
                removeNotification,
                isLoading,
                isPolling
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};