"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeNotification = exports.readAllNotifications = exports.readNotification = exports.fetchNotifications = void 0;
const notification_1 = require("../services/notification");
const fetchNotifications = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // Parse query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const onlyUnread = req.query.onlyUnread === 'true';
        const result = await (0, notification_1.getUserNotifications)(userId, { page, limit, onlyUnread });
        res.status(200).json({
            success: true,
            data: result.notifications,
            pagination: result.pagination
        });
    }
    catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.fetchNotifications = fetchNotifications;
const readNotification = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        await (0, notification_1.markNotificationAsRead)(id, userId);
        res.status(200).json({
            success: true,
            message: 'Notification marked as read'
        });
    }
    catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.readNotification = readNotification;
const readAllNotifications = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        await (0, notification_1.markAllNotificationsAsRead)(userId);
        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    }
    catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.readAllNotifications = readAllNotifications;
const removeNotification = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        await (0, notification_1.deleteNotification)(id, userId);
        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.removeNotification = removeNotification;
