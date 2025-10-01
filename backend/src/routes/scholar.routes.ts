import express from 'express'
import { createScholar, getAllScholars, getScholarshipById, updateExpiredScholarshipsEndpoint, ArchiveScholarship, updateScholar, getArchivedScholarships, getOrganizationScholarships, getPublicScholars, DeleteArchivedScholarship, RestoreArchivedScholarship } from '../controllers/scholar.controller';
import { authenticate } from '../middleware/auth';
import { deleteScholarship } from '../controllers/scholar.controller';



const router = express.Router();

router.post('/create-scholar', authenticate, createScholar);

router.get('/get-scholars', getAllScholars); // Remove authentication - allow public access

router.get('/public', getPublicScholars);

router.get('/organization', authenticate, getOrganizationScholarships);

router.get('/get-scholarship/:id', authenticate, getScholarshipById);

router.put('/update-scholar/:id', authenticate, updateScholar);

router.delete('/delete-scholar/:id', authenticate, deleteScholarship);

router.post('/archive-scholar/:id', authenticate, ArchiveScholarship);

router.post('/update-expired', authenticate, updateExpiredScholarshipsEndpoint);

router.post('/get-archived', authenticate, getArchivedScholarships);

// Use the dedicated DeleteArchivedScholarship controller and accept an ID param
router.delete('/delete-archived/:id', authenticate, DeleteArchivedScholarship);

router.post('/restore-archived/:id', authenticate, RestoreArchivedScholarship);


export default router;  