import { Router } from 'express';
import { getMe, getUsers } from '../controllers/userController';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

router.get('/me', authenticateToken, getMe);
router.get('/users', authenticateToken, authorizeRoles(['ADMIN']), getUsers);

export default router;
