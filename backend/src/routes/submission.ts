import { Router } from 'express';
import {
  createSubmission,
  getSubmissions,
  getSubmissionById,
  updateSubmissionStatus,
  assignSubmissionToJudge,
  getPendingSubmissions,
  getJudgeQueue,
  createReview,
  getSubmissionStats,
  getUserSubmissionHistory,
  getMySubmissions
} from '../controllers/submissionController';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

// Submission CRUD operations
router.post('/submissions', authenticateToken, authorizeRoles([Role.PARTICIPANT]), createSubmission);
router.get('/submissions', authenticateToken, authorizeRoles([Role.ADMIN, Role.JUDGE]), getSubmissions);
router.get('/submissions/:id', authenticateToken, authorizeRoles([Role.ADMIN, Role.JUDGE, Role.PARTICIPANT]), getSubmissionById);
router.put('/submissions/:id/status', authenticateToken, authorizeRoles([Role.ADMIN, Role.JUDGE]), updateSubmissionStatus);

// Judge operations
router.put('/submissions/:id/assign', authenticateToken, authorizeRoles([Role.ADMIN, Role.JUDGE]), assignSubmissionToJudge);
router.get('/submissions/pending', authenticateToken, authorizeRoles([Role.ADMIN, Role.JUDGE]), getPendingSubmissions);
router.get('/judge/queue', authenticateToken, authorizeRoles([Role.JUDGE]), getJudgeQueue);
router.post('/reviews', authenticateToken, authorizeRoles([Role.JUDGE]), createReview);

// Statistics and history
router.get('/contests/:contestId/submission-stats', authenticateToken, authorizeRoles([Role.ADMIN, Role.JUDGE]), getSubmissionStats);
router.get('/users/:userId/submissions', authenticateToken, authorizeRoles([Role.ADMIN, Role.JUDGE, Role.PARTICIPANT]), getUserSubmissionHistory);
router.get('/my-submissions', authenticateToken, authorizeRoles([Role.PARTICIPANT]), getMySubmissions);

export default router;