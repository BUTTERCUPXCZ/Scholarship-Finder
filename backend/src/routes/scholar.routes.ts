import express from 'express'
import { createScholar } from '../controllers/scholar.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/create-scholar', authenticate, createScholar);
router.put('/update-scholar', authenticate, createScholar);

export default router; 