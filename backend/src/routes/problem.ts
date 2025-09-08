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
import { Role } from '@prisma/client';

const router = Router();

// Problem CRUD operations
router.get('/problems', authenticateToken, authorizeRoles([Role.ADMIN, Role.JUDGE, Role.PARTICIPANT]), getProblems);
router.get('/problems/:id', authenticateToken, authorizeRoles([Role.ADMIN, Role.JUDGE, Role.PARTICIPANT]), getProblemById);
router.post('/problems', authenticateToken, authorizeRoles([Role.ADMIN]), createProblem);
router.put('/problems/:id', authenticateToken, authorizeRoles([Role.ADMIN]), updateProblem);
router.delete('/problems/:id', authenticateToken, authorizeRoles([Role.ADMIN]), deleteProblem);

// Problem metadata endpoints
router.get('/problems-by-difficulty', authenticateToken, authorizeRoles([Role.ADMIN, Role.JUDGE]), getProblemsByDifficulty);
router.get('/problem-tags', authenticateToken, authorizeRoles([Role.ADMIN, Role.JUDGE]), getProblemTags);

// Submission operations moved to submission.ts routes

export default router;