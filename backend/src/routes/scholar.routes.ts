import express from 'express'
import * as scholarController from '../controllers/scholar.controller';
import { authenticate } from '../middleware/auth';



const router = express.Router();

router.post('/create-scholar', authenticate, scholarController.createScholar);

router.get('/get-scholars', scholarController.getAllScholars); // Remove authentication - allow public access

router.get('/public', scholarController.getPublicScholars);

router.get('/organization', authenticate, scholarController.getOrganizationScholarships);

router.get('/get-scholarship/:id', authenticate, scholarController.getScholarshipById);

router.put('/update-scholar/:id', authenticate, scholarController.updateScholar);

router.delete('/delete-scholar/:id', authenticate, scholarController.deleteScholarship);

router.post('/archive-scholar/:id', authenticate, scholarController.ArchiveScholarship);

router.post('/update-expired', authenticate, scholarController.updateExpiredScholarshipsEndpoint);

router.post('/get-archived', authenticate, scholarController.getArchivedScholarships);

// Use the dedicated DeleteArchivedScholarship controller and accept an ID param
router.delete('/delete-archived/:id', authenticate, scholarController.DeleteArchivedScholarship);

router.post('/restore-archived/:id', authenticate, scholarController.RestoreArchivedScholarship);


export default router;  