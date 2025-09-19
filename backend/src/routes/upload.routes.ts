import express from 'express';
import { uploadFiles, uploadMiddleware, downloadFile } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Upload files endpoint
router.post('/files', authenticate, uploadMiddleware, uploadFiles);

// Download file endpoint - using POST to handle complex paths in request body
router.post('/download', authenticate, downloadFile);

export default router;