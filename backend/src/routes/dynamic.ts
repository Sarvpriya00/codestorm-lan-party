import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { PrismaClient, User } from '@prisma/client';
import cors from 'cors';

const prisma = new PrismaClient();
const router = Router();

interface AuthRequest extends Request {
  user?: User;
}

const allRoutes = [
  { path: '/', component: 'Dashboard', title: 'Dashboard', icon: 'Home', requiredPermissions: [100], isDefault: true, priority: 5 },
  { path: '/problems', component: 'Problems', title: 'Problems', icon: 'FileText', requiredPermissions: [200], isDefault: true, priority: 4 },
  { path: '/leaderboard', component: 'Leaderboard', title: 'Leaderboard', icon: 'Trophy', requiredPermissions: [100], priority: 3 },
  { path: '/judge', component: 'JudgeQueue', title: 'Judge Queue', icon: 'Gavel', requiredPermissions: [300], isDefault: true, priority: 2 },
  { path: '/submissions', component: 'MySubmissions', title: 'My Submissions', icon: 'Send', requiredPermissions: [220], priority: 6 },
  { path: '/admin/users', component: 'AdminUsers', title: 'Users', icon: 'Users', requiredPermissions: [500], isDefault: true, priority: 1 },
  { path: '/admin/analytics', component: 'AdminAnalytics', title: 'Analytics', icon: 'BarChart3', requiredPermissions: [600], priority: 7 },
  { path: '/admin/control', component: 'AdminControl', title: 'Contest Control', icon: 'Settings', requiredPermissions: [800], isDefault: true, priority: 1 },
];

router.get('/user/routes-and-permissions', cors(), authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || !user.roleId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const roleWithPermissions = await prisma.role.findUnique({
      where: { id: user.roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!roleWithPermissions) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const userPermissions = roleWithPermissions.rolePermissions.map(
      (rp) => rp.permission.code
    );

    const dynamicRoutes = allRoutes.filter(route =>
      route.requiredPermissions.every(p => userPermissions.includes(p))
    );

    res.json({ dynamicRoutes, userPermissions });
  } catch (error) {
    console.error('Failed to fetch routes and permissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
