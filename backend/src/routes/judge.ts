import { Router } from 'express';
import { 
  getJudgeQueue, 
  postVerdict, 
  claimSubmission, 
  getActiveSubmissions, 
  releaseSubmission, 
  getQueueStatistics,
  submitReview,
  getReview,
  getJudgeReviews,
  getJudgeStatistics
} from '../controllers/judgeController';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

// Queue management endpoints
router.get('/queue', authenticateToken, authorizeRoles([Role.JUDGE]), getJudgeQueue);
router.get('/queue/statistics', authenticateToken, authorizeRoles([Role.JUDGE]), getQueueStatistics);
router.get('/active', authenticateToken, authorizeRoles([Role.JUDGE]), getActiveSubmissions);

// Submission claiming endpoints
router.post('/claim/:submissionId', authenticateToken, authorizeRoles([Role.JUDGE]), claimSubmission);
router.post('/release/:submissionId', authenticateToken, authorizeRoles([Role.JUDGE]), releaseSubmission);

// Review and scoring endpoints
router.post('/review', authenticateToken, authorizeRoles([Role.JUDGE]), submitReview);
router.get('/review/:submissionId', authenticateToken, authorizeRoles([Role.JUDGE]), getReview);
router.get('/reviews', authenticateToken, authorizeRoles([Role.JUDGE]), getJudgeReviews);
router.get('/statistics', authenticateToken, authorizeRoles([Role.JUDGE]), getJudgeStatistics);

// Verdict posting (legacy endpoint, kept for backward compatibility)
router.post('/verdict', authenticateToken, authorizeRoles([Role.JUDGE]), postVerdict);

export default router;