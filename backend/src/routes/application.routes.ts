import express from 'express';
import {
    submitApplication,
    getUserApplications,
    getApplicationById,
    withdrawApplication,
    getScholarshipApplications,
    updateApplicationStatus,
    getApplicants
} from '../controllers/application.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Student routes
router.post('/submit', authenticate, submitApplication);
router.get('/my-applications', authenticate, getUserApplications);
router.get('/:id', authenticate, getApplicationById);
router.delete('/:id/withdraw', authenticate, withdrawApplication);

// Organization routes
router.get('/scholarship/:scholarshipId', authenticate, getScholarshipApplications);
router.patch('/:id/status', authenticate, updateApplicationStatus);
router.get('/get-applications', authenticate, getApplicants);

export default router;