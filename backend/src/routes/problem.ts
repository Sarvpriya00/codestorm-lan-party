import { Router } from 'express';
import { 
  getProblems, 
  getProblemById, 
  createProblem,
  updateProblem,
  deleteProblem,
  getProblemsByDifficulty,
  getProblemTags
} from '../controllers/problemController';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';


const router = Router();

// Problem CRUD operations
router.get('/problems', authenticateToken, authorizeRoles(['ADMIN', 'JUDGE', 'PARTICIPANT']), getProblems);
router.get('/problems/:id', authenticateToken, authorizeRoles(['ADMIN', 'JUDGE', 'PARTICIPANT']), getProblemById);
router.post('/problems', authenticateToken, authorizeRoles(['ADMIN']), createProblem);
router.put('/problems/:id', authenticateToken, authorizeRoles(['ADMIN']), updateProblem);
router.delete('/problems/:id', authenticateToken, authorizeRoles(['ADMIN']), deleteProblem);

// Problem metadata endpoints
router.get('/problems-by-difficulty', authenticateToken, authorizeRoles(['ADMIN', 'JUDGE']), getProblemsByDifficulty);
router.get('/problem-tags', authenticateToken, authorizeRoles(['ADMIN', 'JUDGE']), getProblemTags);

// Submission operations moved to submission.ts routes

export default router;