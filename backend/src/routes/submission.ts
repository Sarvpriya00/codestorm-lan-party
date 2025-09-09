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


const router = Router();

// Submission CRUD operations
router.post('/submissions', authenticateToken, authorizeRoles(['PARTICIPANT']), createSubmission);
router.get('/submissions', authenticateToken, authorizeRoles(['ADMIN', 'JUDGE']), getSubmissions);
router.get('/submissions/:id', authenticateToken, authorizeRoles(['ADMIN', 'JUDGE', 'PARTICIPANT']), getSubmissionById);
router.put('/submissions/:id/status', authenticateToken, authorizeRoles(['ADMIN', 'JUDGE']), updateSubmissionStatus);

// Judge operations
router.put('/submissions/:id/assign', authenticateToken, authorizeRoles(['ADMIN', 'JUDGE']), assignSubmissionToJudge);
router.get('/submissions/pending', authenticateToken, authorizeRoles(['ADMIN', 'JUDGE']), getPendingSubmissions);
router.get('/judge/queue', authenticateToken, authorizeRoles(['JUDGE']), getJudgeQueue);
router.post('/reviews', authenticateToken, authorizeRoles(['JUDGE']), createReview);

// Statistics and history
router.get('/contests/:contestId/submission-stats', authenticateToken, authorizeRoles(['ADMIN', 'JUDGE']), getSubmissionStats);
router.get('/users/:userId/submissions', authenticateToken, authorizeRoles(['ADMIN', 'JUDGE', 'PARTICIPANT']), getUserSubmissionHistory);
router.get('/my-submissions', authenticateToken, authorizeRoles(['PARTICIPANT']), getMySubmissions);

export default router;