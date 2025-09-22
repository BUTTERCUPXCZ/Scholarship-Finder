import { Request, Response } from 'express';
import {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
} from '../services/notification';

export const fetchNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const notifications = await getUserNotifications(userId);
        res.status(200).json({
            success: true,
            data: notifications
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const readNotification = async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        await markNotificationAsRead(id, userId);
        res.status(200).json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const readAllNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        await markAllNotificationsAsRead(userId);
        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const removeNotification = async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        await deleteNotification(id, userId);
        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
