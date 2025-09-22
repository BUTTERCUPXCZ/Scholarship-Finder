import React, { useState } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../Context/NotificationContext';
import { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../services/notification';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';

const NotificationBell: React.FC = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await markNotificationAsRead(notificationId);
            markAsRead(notificationId);
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleNotificationClick = async (notificationId: string, isRead: boolean) => {
        // Mark as read if not already read
        if (!isRead) {
            await handleMarkAsRead(notificationId);
        }

        // Close the dropdown
        setIsOpen(false);

        // Navigate to My Applications page
        navigate('/my-applications');
    };

    const handleRemoveNotification = async (notificationId: string) => {
        try {
            await deleteNotification(notificationId);
            removeNotification(notificationId);
        } catch (error) {
            console.error('Error removing notification:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllNotificationsAsRead();
            markAllAsRead();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'SCHOLARSHIP_ACCEPTED':
                return '🎉';
            case 'SCHOLARSHIP_REJECTED':
                return '📄';
            case 'SCHOLARSHIP_UPDATE':
                return '📋';
            default:
                return '📢';
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'SCHOLARSHIP_ACCEPTED':
                return 'border-l-green-500 bg-green-50';
            case 'SCHOLARSHIP_REJECTED':
                return 'border-l-red-500 bg-red-50';
            case 'SCHOLARSHIP_UPDATE':
                return 'border-l-blue-500 bg-blue-50';
            default:
                return 'border-l-gray-500 bg-gray-50';
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative p-2 hover:bg-gray-100">
                    <Bell className="h-5 w-5 text-gray-700" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] text-[10px] font-medium">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 shadow-lg">
                <div className="border-b px-4 py-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleMarkAllAsRead}
                                className="text-xs h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                                <CheckCheck className="h-3 w-3 mr-1" />
                                Mark all read
                            </Button>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                            {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                        </p>
                    )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No notifications yet</p>
                            <p className="text-xs text-gray-400 mt-1">You'll be notified when there are updates on your applications</p>
                        </div>
                    ) : (
                        <div className="py-2">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`px-4 py-3 border-l-4 ${getNotificationColor(notification.type)} ${!notification.read ? 'bg-opacity-70' : 'bg-opacity-30'
                                        } hover:bg-opacity-100 transition-colors cursor-pointer`}
                                    onClick={() => handleNotificationClick(notification.id, notification.read)}
                                >
                                    <div className="flex items-start space-x-3">
                                        <span className="text-lg flex-shrink-0 mt-0.5">
                                            {getNotificationIcon(notification.type)}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-relaxed ${!notification.read ? 'font-medium text-gray-900' : 'text-gray-700'
                                                }`}>
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center justify-between mt-2">
                                                <p className="text-xs text-gray-500">
                                                    {formatTimeAgo(notification.createdAt)}
                                                </p>
                                                <div className="flex items-center gap-1">
                                                    {!notification.read && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMarkAsRead(notification.id);
                                                            }}
                                                            className="h-6 w-6 p-0 hover:bg-gray-200 text-blue-600"
                                                            title="Mark as read"
                                                        >
                                                            <Check className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveNotification(notification.id);
                                                        }}
                                                        className="h-6 w-6 p-0 hover:bg-red-100 text-red-600 hover:text-red-700"
                                                        title="Remove notification"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {notifications.length > 0 && (
                    <div className="border-t px-4 py-2 bg-gray-50">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs text-gray-600 hover:text-gray-800"
                            onClick={() => {
                                setIsOpen(false);
                                navigate('/my-applications');
                            }}
                        >
                            View all notifications
                        </Button>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default NotificationBell;