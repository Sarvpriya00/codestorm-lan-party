import express from 'express';
import { authenticateToken, authorizePermissions } from '../middleware/authMiddleware';
import {
  getContestAnalytics,
  getContestStatistics,
  getSystemMetrics,
  updateContestAnalytics,
  updateAllContestAnalytics,
  getMultipleContestAnalytics,
  getProblemAnalytics,
  getAnalyticsDashboard
} from '../controllers/analyticsController';

const router = express.Router();

// All analytics routes require authentication
router.use(authenticateToken);

// Get analytics dashboard (requires dashboard permission - 100)
router.get('/dashboard', authorizePermissions([100]), getAnalyticsDashboard);

// Get system-wide metrics (requires analytics permission - 600)
router.get('/system', authorizePermissions([600]), getSystemMetrics);

// Get analytics for a specific contest (requires analytics permission - 600)
router.get('/contest/:contestId', authorizePermissions([600]), getContestAnalytics);

// Get detailed statistics for a specific contest (requires analytics permission - 600)
router.get('/contest/:contestId/statistics', authorizePermissions([600]), getContestStatistics);

// Get problem-specific analytics (requires analytics permission - 600)
router.get('/contest/:contestId/problem/:problemId', authorizePermissions([600]), getProblemAnalytics);

// Update analytics for a specific contest (requires analytics permission - 600)
router.post('/contest/:contestId/update', authorizePermissions([600]), updateContestAnalytics);

// Update analytics for all active contests (requires analytics permission - 600)
router.post('/update-all', authorizePermissions([600]), updateAllContestAnalytics);

// Get analytics for multiple contests (requires analytics permission - 600)
router.post('/contests', authorizePermissions([600]), getMultipleContestAnalytics);

export default router;