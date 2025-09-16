import express from 'express'
import { createScholar, getAllScholars, getScholarshipById, updateExpiredScholarships, ArchiveScholarship, updateScholar, getArchivedScholarships } from '../controllers/scholar.controller';
import { authenticate } from '../middleware/auth';
import { deleteScholarship } from '../controllers/scholar.controller';



const router = express.Router();

router.post('/create-scholar', authenticate, createScholar);
router.get('/get-scholars', authenticate, getAllScholars);
router.get('/get-scholarship/:id', authenticate, getScholarshipById);
router.put('/update-scholar/:id', authenticate, updateScholar);
router.delete('/delete-scholar/:id', authenticate, deleteScholarship);
router.post('/archive-scholar/:id', authenticate, ArchiveScholarship);
router.post('/update-expired', authenticate, updateExpiredScholarships);
router.post('/get-archived', authenticate, getArchivedScholarships);


export default router;  