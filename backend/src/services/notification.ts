import { prisma } from '../lib/db';
import { emitNotificationToUser, emitNotificationUpdate, emitNotificationDeleted } from './socketService';

export interface CreateNotificationData {
    userId: string;
    message: string;
    type: 'INFO' | 'SCHOLARSHIP_ACCEPTED' | 'SCHOLARSHIP_REJECTED' | 'SCHOLARSHIP_UPDATE';
}

export const createNotification = async (data: CreateNotificationData) => {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId: data.userId,
                message: data.message,
                type: data.type,
                read: false
            }
        });

        // Emit real-time notification via Socket.IO
        emitNotificationToUser(data.userId, notification);

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

export const getUserNotifications = async (userId: string, options?: { page?: number; limit?: number; onlyUnread?: boolean }) => {
    try {
        const page = options?.page || 1;
        const limit = Math.min(options?.limit || 20, 50); // Cap at 50
        const skip = (page - 1) * limit;

        const where: { userId: string; read?: boolean } = { userId };
        if (options?.onlyUnread) {
            where.read = false;
        }

        const [notifications, totalCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    userId: true,
                    message: true,
                    type: true,
                    read: true,
                    createdAt: true
                }
            }),
            prisma.notification.count({ where })
        ]);

        return {
            notifications,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
                hasNext: skip + limit < totalCount,
                hasPrev: page > 1
            }
        };
    } catch (error: unknown) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

export const markNotificationAsRead = async (notificationId: string, userId: string) => {
    try {
        const notification = await prisma.notification.updateMany({
            where: {
                id: notificationId,
                userId: userId
            },
            data: {
                read: true
            }
        });

        // Get the updated notification and emit via Socket.IO
        const updatedNotification = await prisma.notification.findFirst({
            where: { id: notificationId, userId }
        });

        if (updatedNotification) {
            emitNotificationUpdate(userId, updatedNotification);
        }

        return notification;
    } catch (error: unknown) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

export const markAllNotificationsAsRead = async (userId: string) => {
    try {
        const notifications = await prisma.notification.updateMany({
            where: {
                userId: userId,
                read: false
            },
            data: {
                read: true
            }
        });

        return notifications;
    } catch (error: unknown) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};

export const deleteNotification = async (notificationId: string, userId: string) => {
    try {
        const deletedNotification = await prisma.notification.deleteMany({
            where: {
                id: notificationId,
                userId: userId
            }
        });

        // Emit deletion event via Socket.IO
        emitNotificationDeleted(userId, notificationId);

        return deletedNotification;
    } catch (error: unknown) {
        console.error('Error deleting notification:', error);
        throw error;
    }
};