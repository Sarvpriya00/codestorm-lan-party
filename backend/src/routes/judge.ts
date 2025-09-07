import { Router } from 'express';
import { getJudgeQueue, postVerdict } from '../controllers/judgeController';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

router.get('/queue', authenticateToken, authorizeRoles([Role.JUDGE]), getJudgeQueue);
router.post('/verdict', authenticateToken, authorizeRoles([Role.JUDGE]), postVerdict);

export default router;