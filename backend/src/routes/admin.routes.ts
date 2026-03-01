import express from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';
import { getAdminStats, getAllUsers } from '../controllers/admin.controller';
import {
  getApplicationsOverTime,
  getScholarshipPerformance,
  getUserRegistrationsOverTime,
  getApplicationFunnel,
} from '../controllers/analytics.controller';
import {
  exportApplicationsCSV,
  exportScholarshipsCSV,
  exportUsersCSV,
  exportSummaryPDF,
} from '../controllers/reports.controller';

const router = express.Router();

// ── Existing ──────────────────────────────────────────────────────────────────
router.get('/stats', authenticate, requireAdmin, getAdminStats);
router.get('/users', authenticate, requireAdmin, getAllUsers);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics/applications-over-time', authenticate, requireAdmin, getApplicationsOverTime);
router.get('/analytics/scholarship-performance', authenticate, requireAdmin, getScholarshipPerformance);
router.get('/analytics/user-registrations', authenticate, requireAdmin, getUserRegistrationsOverTime);
router.get('/analytics/application-funnel', authenticate, requireAdmin, getApplicationFunnel);

// ── Reports / Exports ─────────────────────────────────────────────────────────
router.get('/reports/applications.csv', authenticate, requireAdmin, exportApplicationsCSV);
router.get('/reports/scholarships.csv', authenticate, requireAdmin, exportScholarshipsCSV);
router.get('/reports/users.csv', authenticate, requireAdmin, exportUsersCSV);
router.get('/reports/summary.pdf', authenticate, requireAdmin, exportSummaryPDF);

export default router;
