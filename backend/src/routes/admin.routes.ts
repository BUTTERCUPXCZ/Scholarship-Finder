import express from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';
import { getAdminStats, getAllUsers } from '../controllers/admin.controller';

const router = express.Router();

router.get('/stats', authenticate, requireAdmin, getAdminStats);
router.get('/users', authenticate, requireAdmin, getAllUsers);

export default router;
