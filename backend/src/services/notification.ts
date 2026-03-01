import { prisma } from '../lib/db';
import type { TransactionClient } from '../lib/rls';
import { emitNotificationToUser, emitNotificationUpdate, emitNotificationDeleted } from './socketService';

export interface CreateNotificationData {
    userId: string;
    message: string;
    type: 'INFO' | 'SCHOLARSHIP_ACCEPTED' | 'SCHOLARSHIP_REJECTED' | 'SCHOLARSHIP_UPDATE';
}

/**
 * Creates a notification row and emits a real-time Socket.IO event.
 *
 * When called with a transaction client (tx), the DB write is scoped to that
 * transaction but the Socket.IO emit is skipped — the caller is responsible for
 * emitting after the transaction commits so the event only fires on success.
 */
export const createNotification = async (data: CreateNotificationData, tx?: TransactionClient) => {
    try {
        const db = tx ?? prisma;
        const notification = await db.notification.create({
            data: {
                userId: data.userId,
                message: data.message,
                type: data.type,
                read: false
            }
        });

        // Only emit immediately when not inside a caller-managed transaction.
        // When tx is provided, the caller emits after withRLS() returns so the
        // event only fires if the transaction actually commits.
        if (!tx) {
            emitNotificationToUser(data.userId, notification);
        }

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

export const getUserNotifications = async (
    userId: string,
    options?: { page?: number; limit?: number; onlyUnread?: boolean },
    tx?: TransactionClient,
) => {
    try {
        const db = tx ?? prisma;
        const page = options?.page || 1;
        const limit = Math.min(options?.limit || 20, 50);
        const skip = (page - 1) * limit;

        const where: { userId: string; read?: boolean } = { userId };
        if (options?.onlyUnread) {
            where.read = false;
        }

        const [notifications, totalCount] = await Promise.all([
            db.notification.findMany({
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
            db.notification.count({ where })
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

/**
 * Marks a single notification as read.
 * Returns the updated notification so the caller can emit the Socket.IO event
 * after any wrapping transaction commits.
 */
export const markNotificationAsRead = async (
    notificationId: string,
    userId: string,
    tx?: TransactionClient,
) => {
    try {
        const db = tx ?? prisma;

        await db.notification.updateMany({
            where: { id: notificationId, userId },
            data: { read: true }
        });

        const updatedNotification = await db.notification.findFirst({
            where: { id: notificationId, userId }
        });

        // Only emit when not inside a caller-managed transaction.
        if (!tx && updatedNotification) {
            emitNotificationUpdate(userId, updatedNotification);
        }

        return updatedNotification;
    } catch (error: unknown) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

export const markAllNotificationsAsRead = async (userId: string, tx?: TransactionClient) => {
    try {
        const db = tx ?? prisma;
        return db.notification.updateMany({
            where: { userId, read: false },
            data: { read: true }
        });
    } catch (error: unknown) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};

/**
 * Deletes a single notification.
 * Returns the notificationId so the caller can emit the Socket.IO deletion event
 * after any wrapping transaction commits.
 */
export const deleteNotification = async (
    notificationId: string,
    userId: string,
    tx?: TransactionClient,
) => {
    try {
        const db = tx ?? prisma;
        const result = await db.notification.deleteMany({
            where: { id: notificationId, userId }
        });

        // Only emit when not inside a caller-managed transaction.
        if (!tx) {
            emitNotificationDeleted(userId, notificationId);
        }

        return result;
    } catch (error: unknown) {
        console.error('Error deleting notification:', error);
        throw error;
    }
};
