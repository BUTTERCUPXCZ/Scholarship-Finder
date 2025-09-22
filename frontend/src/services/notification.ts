const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Notification {
    id: string;
    userId: string;
    message: string;
    type: 'INFO' | 'SCHOLARSHIP_ACCEPTED' | 'SCHOLARSHIP_REJECTED' | 'SCHOLARSHIP_UPDATE';
    read: boolean;
    createdAt: string;
}

export const getNotifications = async (options?: {
    page?: number;
    limit?: number;
    onlyUnread?: boolean;
}): Promise<Notification[]> => {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.onlyUnread) params.append('onlyUnread', 'true');

    const response = await fetch(`${API_BASE_URL}/notifications?${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch notifications');
    }

    const data = await response.json();
    return data.data;
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to mark notification as read');
    }
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
    }
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to delete notification');
    }
};