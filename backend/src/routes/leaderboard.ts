import express from 'express';
import { authenticateToken, authorizePermissions } from '../middleware/authMiddleware';
import {
  getContestLeaderboard,
  getUserLeaderboardPosition,
  updateContestLeaderboard,
  getGlobalLeaderboard,
  updateAllLeaderboards,
  getLeaderboard // Legacy endpoint
} from '../controllers/leaderboardController';

const router = express.Router();

// Legacy endpoint (public access for backward compatibility)
router.get('/leaderboard', getLeaderboard);

// All other leaderboard routes require authentication
router.use(authenticateToken);

// Get global leaderboard (requires dashboard permission - 100)
router.get('/leaderboard/global', authorizePermissions([100]), getGlobalLeaderboard);

// Get leaderboard for a specific contest (requires dashboard permission - 100)
router.get('/leaderboard/contest/:contestId', authorizePermissions([100]), getContestLeaderboard);

// Get user's position in contest leaderboard (requires dashboard permission - 100)
router.get('/leaderboard/contest/:contestId/user/:userId', authorizePermissions([100]), getUserLeaderboardPosition);

// Update leaderboard for a specific contest (admin only - requires analytics permission - 600)
router.post('/leaderboard/contest/:contestId/update', authorizePermissions([600]), updateContestLeaderboard);

// Update all contest leaderboards (admin only - requires analytics permission - 600)
router.post('/leaderboard/update-all', authorizePermissions([600]), updateAllLeaderboards);

export default router;