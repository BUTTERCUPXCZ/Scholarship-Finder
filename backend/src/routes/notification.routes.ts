import express from 'express';
import { authenticate } from '../middleware/auth';
import { fetchNotifications, readNotification, readAllNotifications, removeNotification } from '../controllers/notification.controller';


const router = express.Router();

router.get('/', authenticate, fetchNotifications);
router.patch('/:id/read', authenticate, readNotification);
router.patch('/mark-all-read', authenticate, readAllNotifications);
router.delete('/:id', authenticate, removeNotification);
export default router;