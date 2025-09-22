import express from 'express'
import { createScholar, getAllScholars, getScholarshipById, updateExpiredScholarshipsEndpoint, ArchiveScholarship, updateScholar, getArchivedScholarships, getOrganizationScholarships } from '../controllers/scholar.controller';
import { authenticate } from '../middleware/auth';
import { deleteScholarship } from '../controllers/scholar.controller';



const router = express.Router();

router.post('/create-scholar', authenticate, createScholar);
router.get('/get-scholars', getAllScholars); // Remove authentication - allow public access
router.get('/organization', authenticate, getOrganizationScholarships); // Get scholarships for authenticated organization
router.get('/get-scholarship/:id', authenticate, getScholarshipById);
router.put('/update-scholar/:id', authenticate, updateScholar);
router.delete('/delete-scholar/:id', authenticate, deleteScholarship);
router.post('/archive-scholar/:id', authenticate, ArchiveScholarship);
router.post('/update-expired', authenticate, updateExpiredScholarshipsEndpoint); // Updated to use new endpoint
router.post('/get-archived', authenticate, getArchivedScholarships);


export default router;  