import { Router } from 'express';
import { getProblems, getProblemById, submitSubmission, getMySubmissions } from '../controllers/problemController';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

router.get('/problems', authenticateToken, authorizeRoles([Role.ADMIN, Role.JUDGE, Role.PARTICIPANT]), getProblems);
router.get('/problems/:id', authenticateToken, authorizeRoles([Role.ADMIN, Role.JUDGE, Role.PARTICIPANT]), getProblemById);

router.post('/submissions', authenticateToken, authorizeRoles([Role.PARTICIPANT]), submitSubmission);
router.get('/mysubmissions', authenticateToken, authorizeRoles([Role.PARTICIPANT]), getMySubmissions);

export default router;