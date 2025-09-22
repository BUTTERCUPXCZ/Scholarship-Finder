import express from 'express';
import { uploadFiles, uploadMiddleware, downloadFile } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Error handling middleware for multer
const handleMulterError = (err: any, req: any, res: any, next: any) => {
    if (err) {
        console.error('Multer error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
        }
        if (err.message === 'Only PDF, DOC, DOCX, and image files are allowed') {
            return res.status(400).json({ message: err.message });
        }
        return res.status(400).json({ message: 'File upload error: ' + err.message });
    }
    next();
};

// Upload files endpoint
router.post('/files', authenticate, uploadMiddleware, handleMulterError, uploadFiles);

// Download file endpoint - using POST to handle complex paths in request body
router.post('/download', authenticate, downloadFile);

export default router;