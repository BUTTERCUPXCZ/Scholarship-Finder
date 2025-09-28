import express, { Request, Response, NextFunction } from 'express';
import { uploadFiles, uploadMiddleware, downloadFile } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth';
import { MulterError } from 'multer';

const router = express.Router();


const handleMulterError = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (err) {
        console.error('Multer error:', err);

        if (err instanceof MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
            }

            return res.status(400).json({ message: err.message });
        }

        if (err instanceof Error) {
            if (err.message === 'Only PDF, DOC, DOCX, and image files are allowed') {
                return res.status(400).json({ message: err.message });
            }
            return res.status(400).json({ message: 'File upload error: ' + err.message });
        }


        return res.status(400).json({ message: 'File upload error' });
    }
    next();
};


router.post('/files', authenticate, uploadMiddleware, handleMulterError, uploadFiles);

router.post('/download', authenticate, downloadFile);

export default router;