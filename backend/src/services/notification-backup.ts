import { prisma } from '../lib/db';
import { emitNotificationToUser } from './socketServicexport const deleteNotification = async (notificationId: string, userId: string) => {
    try {
        const deletedNotification = await prisma.notification.deleteMany({
            where: {
                id: notificationId,
                userId: userId
            }
        });

        // Emit deletion event via Socket.IO
        const { emitNotificationDeleted } = require('./socketService');
        emitNotificationDeleted(userId, notificationId);

        return deletedNotification;
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
    }
};nterface CreateNotificationData {
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
};export const getUserNotifications = async (userId: string) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to recent 50 notifications
        });

        return notifications;
    } catch (error) {
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
            const { emitNotificationUpdate } = require('./socketService');
            emitNotificationUpdate(userId, updatedNotification);
        }

        return notification;
    } catch (error) {
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
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};

export const deleteNotification = async (notificationId: string, userId: string) => {
    try {
        const notification = await prisma.notification.deleteMany({
            where: {
                id: notificationId,
                userId: userId
            }
        });

        return notification;
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
    }
};


