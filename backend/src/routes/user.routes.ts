import express from 'express';
import { userRegister, userLogin, userLogout, getCurrentUser, updateUserProfile, getOrganizationStats, verifyEmail, resendVerificationEmail } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';


const router = express.Router();

router.post('/register', userRegister);
router.post('/login', userLogin);
router.post('/logout', userLogout);
router.get('/me', authenticate, getCurrentUser);
router.patch('/profile', authenticate, updateUserProfile);
router.get('/organization/stats', authenticate, getOrganizationStats);
router.post('/resend-verification', resendVerificationEmail);
router.get('/verify', verifyEmail)


export default router;