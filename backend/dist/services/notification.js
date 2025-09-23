"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getUserNotifications = exports.createNotification = void 0;
const db_1 = require("../lib/db");
const socketService_1 = require("./socketService");
const createNotification = async (data) => {
    try {
        const notification = await db_1.prisma.notification.create({
            data: {
                userId: data.userId,
                message: data.message,
                type: data.type,
                read: false
            }
        });
        (0, socketService_1.emitNotificationToUser)(data.userId, notification);
        return notification;
    }
    catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};
exports.createNotification = createNotification;
const getUserNotifications = async (userId, options) => {
    try {
        const page = options?.page || 1;
        const limit = Math.min(options?.limit || 20, 50);
        const skip = (page - 1) * limit;
        const where = { userId };
        if (options?.onlyUnread) {
            where.read = false;
        }
        const [notifications, totalCount] = await Promise.all([
            db_1.prisma.notification.findMany({
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
            db_1.prisma.notification.count({ where })
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
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};
exports.getUserNotifications = getUserNotifications;
const markNotificationAsRead = async (notificationId, userId) => {
    try {
        const notification = await db_1.prisma.notification.updateMany({
            where: {
                id: notificationId,
                userId: userId
            },
            data: {
                read: true
            }
        });
        const updatedNotification = await db_1.prisma.notification.findFirst({
            where: { id: notificationId, userId }
        });
        if (updatedNotification) {
            (0, socketService_1.emitNotificationUpdate)(userId, updatedNotification);
        }
        return notification;
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
const markAllNotificationsAsRead = async (userId) => {
    try {
        const notifications = await db_1.prisma.notification.updateMany({
            where: {
                userId: userId,
                read: false
            },
            data: {
                read: true
            }
        });
        return notifications;
    }
    catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
const deleteNotification = async (notificationId, userId) => {
    try {
        const deletedNotification = await db_1.prisma.notification.deleteMany({
            where: {
                id: notificationId,
                userId: userId
            }
        });
        (0, socketService_1.emitNotificationDeleted)(userId, notificationId);
        return deletedNotification;
    }
    catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
    }
};
exports.deleteNotification = deleteNotification;
