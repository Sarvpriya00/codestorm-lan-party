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


const router = Router();

// Queue management endpoints
router.get('/queue', authenticateToken, authorizeRoles(['JUDGE']), getJudgeQueue);
router.get('/queue/statistics', authenticateToken, authorizeRoles(['JUDGE']), getQueueStatistics);
router.get('/active', authenticateToken, authorizeRoles(['JUDGE']), getActiveSubmissions);

// Submission claiming endpoints
router.post('/claim/:submissionId', authenticateToken, authorizeRoles(['JUDGE']), claimSubmission);
router.post('/release/:submissionId', authenticateToken, authorizeRoles(['JUDGE']), releaseSubmission);

// Review and scoring endpoints
router.post('/review', authenticateToken, authorizeRoles(['JUDGE']), submitReview);
router.get('/review/:submissionId', authenticateToken, authorizeRoles(['JUDGE']), getReview);
router.get('/reviews', authenticateToken, authorizeRoles(['JUDGE']), getJudgeReviews);
router.get('/statistics', authenticateToken, authorizeRoles(['JUDGE']), getJudgeStatistics);

// Verdict posting (legacy endpoint, kept for backward compatibility)
router.post('/verdict', authenticateToken, authorizeRoles(['JUDGE']), postVerdict);

export default router;