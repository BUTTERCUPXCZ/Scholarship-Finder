import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthProvider/AuthProvider';
import { getNotifications, type Notification } from '../services/notification';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    refreshNotifications: () => Promise<void>;
    markAsRead: (notificationId: string) => void;
    markAllAsRead: () => void;
    removeNotification: (notificationId: string) => void;
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
    const { user, isAuthenticated } = useAuth();

    const refreshNotifications = async () => {
        if (!isAuthenticated || !user) return;

        try {
            const fetchedNotifications = await getNotifications();
            setNotifications(fetchedNotifications);
            setUnreadCount(fetchedNotifications.filter(n => !n.read).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = (notificationId: string) => {
        setNotifications(prev =>
            prev.map(notification =>
                notification.id === notificationId
                    ? { ...notification, read: true }
                    : notification
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(notification => ({ ...notification, read: true }))
        );
        setUnreadCount(0);
    };

    const removeNotification = (notificationId: string) => {
        setNotifications(prev => {
            const notificationToRemove = prev.find(n => n.id === notificationId);
            const wasUnread = notificationToRemove && !notificationToRemove.read;

            if (wasUnread) {
                setUnreadCount(prevCount => Math.max(0, prevCount - 1));
            }

            return prev.filter(notification => notification.id !== notificationId);
        });
    };

    // Set up Supabase realtime subscription
    useEffect(() => {
        if (!isAuthenticated || !user) return;

        // Initial fetch
        refreshNotifications();

        // Subscribe to realtime changes
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
                    console.log('New notification received:', payload);
                    const newNotification = payload.new as Notification;

                    setNotifications(prev => [newNotification, ...prev]);
                    setUnreadCount(prev => prev + 1);

                    // Optional: Show browser notification
                    if (Notification.permission === 'granted') {
                        new Notification('New Scholarship Update', {
                            body: newNotification.message,
                            icon: '/favicon.ico'
                        });
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
                    console.log('Notification updated:', payload);
                    const updatedNotification = payload.new as Notification;

                    setNotifications(prev =>
                        prev.map(notification =>
                            notification.id === updatedNotification.id
                                ? updatedNotification
                                : notification
                        )
                    );

                    // Recalculate unread count
                    setNotifications(current => {
                        setUnreadCount(current.filter(n => !n.read).length);
                        return current;
                    });
                }
            )
            .subscribe();

        // Request notification permission
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Cleanup subscription
        return () => {
            supabase.removeChannel(channel);
        };
    }, [isAuthenticated, user]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                refreshNotifications,
                markAsRead,
                markAllAsRead,
                removeNotification
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};