import express from 'express';
import { authenticateToken, authorizePermissions } from '../middleware/authMiddleware';
import {
  createContest,
  updateContest,
  getContestById,
  getContests,
  deleteContest,
  updateContestStatus,
  getActiveContests,
  getUpcomingContests,
  addProblemToContest,
  removeProblemFromContest,
  updateContestProblem,
  getContestProblems,
  getContestProblem,
  reorderContestProblems,
  getContestsForProblem,
  validateContestProblemConstraints,
  joinContest,
  leaveContest,
  updateParticipantStatus,
  getContestParticipants,
  getUserContests,
  getContestUser,
  getContestParticipationStats,
  bulkUpdateParticipantStatus,
  canUserJoinContest
} from '../controllers/contestController';

const router = express.Router();

// Public routes (no authentication required)
router.get('/contests/active', getActiveContests);
router.get('/contests/upcoming', getUpcomingContests);
router.get('/contests/:id', getContestById);
router.get('/contests', getContests);
router.get('/contests/:contestId/problems', getContestProblems);
router.get('/contests/:contestId/problems/:problemId', getContestProblem);
router.get('/problems/:problemId/contests', getContestsForProblem);
router.get('/contests/:contestId/problems/:problemId/validate', validateContestProblemConstraints);
router.get('/contests/:contestId/participants', getContestParticipants);
router.get('/contests/:contestId/participants/:userId', getContestUser);
router.get('/contests/:contestId/stats', getContestParticipationStats);

// Protected routes (authentication required)
// Contest creation and management (Admin only - permission 800)
router.post('/contests', authenticateToken, authorizePermissions([800]), createContest);
router.put('/contests/:id', authenticateToken, authorizePermissions([800]), updateContest);
router.delete('/contests/:id', authenticateToken, authorizePermissions([800]), deleteContest);
router.patch('/contests/:id/status', authenticateToken, authorizePermissions([800]), updateContestStatus);

// Contest-Problem management (Admin only - permission 850 for problem control)
router.post('/contests/:contestId/problems', authenticateToken, authorizePermissions([850]), addProblemToContest);
router.delete('/contests/:contestId/problems/:problemId', authenticateToken, authorizePermissions([850]), removeProblemFromContest);
router.put('/contests/:contestId/problems/:problemId', authenticateToken, authorizePermissions([850]), updateContestProblem);
router.patch('/contests/:contestId/problems/reorder', authenticateToken, authorizePermissions([850]), reorderContestProblems);

// Contest participation (Participants can join/leave, Admins can manage participants)
router.post('/contests/:contestId/join', authenticateToken, joinContest);
router.delete('/contests/:contestId/leave', authenticateToken, leaveContest);
router.get('/contests/:contestId/eligibility', authenticateToken, canUserJoinContest);
router.get('/my-contests', authenticateToken, getUserContests);

// Participant management (Admin only - permission 860 for user control)
router.patch('/contests/:contestId/participants/:userId/status', authenticateToken, authorizePermissions([860]), updateParticipantStatus);
router.patch('/contests/:contestId/participants/bulk-status', authenticateToken, authorizePermissions([860]), bulkUpdateParticipantStatus);

export default router;