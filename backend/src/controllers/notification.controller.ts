import { Request, Response } from 'express';
import {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
} from '../services/notification';
import { emitNotificationUpdate, emitNotificationDeleted } from '../services/socketService';
import { withRLS } from '../lib/rls';

export const fetchNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const role = (req.user?.role as string) || 'STUDENT';
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const onlyUnread = req.query.onlyUnread === 'true';

        const result = await withRLS(userId, role, async (tx) => {
            return getUserNotifications(userId, { page, limit, onlyUnread }, tx);
        });

        res.status(200).json({
            success: true,
            data: result.notifications,
            pagination: result.pagination
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

        const role = (req.user?.role as string) || 'STUDENT';

        // Run DB update inside RLS transaction; emit Socket.IO after commit.
        const updatedNotification = await withRLS(userId, role, async (tx) => {
            return markNotificationAsRead(id, userId, tx);
        });

        if (updatedNotification) {
            emitNotificationUpdate(userId, updatedNotification);
        }

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

        const role = (req.user?.role as string) || 'STUDENT';

        await withRLS(userId, role, async (tx) => {
            return markAllNotificationsAsRead(userId, tx);
        });

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

        const role = (req.user?.role as string) || 'STUDENT';

        // Run DB delete inside RLS transaction; emit Socket.IO after commit.
        await withRLS(userId, role, async (tx) => {
            return deleteNotification(id, userId, tx);
        });

        emitNotificationDeleted(userId, id);

        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
