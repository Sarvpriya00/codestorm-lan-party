import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

const allRoutes = [
  { path: '/', component: 'Dashboard', title: 'Dashboard', icon: 'Home', requiredPermissions: [100] },
  { path: '/problems', component: 'Problems', title: 'Problems', icon: 'FileText', requiredPermissions: [200] },
  { path: '/leaderboard', component: 'Leaderboard', title: 'Leaderboard', icon: 'Trophy', requiredPermissions: [100] },
  { path: '/judge', component: 'JudgeQueue', title: 'Judge Queue', icon: 'Gavel', requiredPermissions: [300] },
  { path: '/submissions', component: 'MySubmissions', title: 'My Submissions', icon: 'Send', requiredPermissions: [220] },
  { path: '/admin/users', component: 'AdminUsers', title: 'Users', icon: 'Users', requiredPermissions: [500] },
  { path: '/admin/analytics', component: 'AdminAnalytics', title: 'Analytics', icon: 'BarChart3', requiredPermissions: [600] },
  { path: '/admin/control', component: 'AdminControl', title: 'Contest Control', icon: 'Settings', requiredPermissions: [800] },
];

router.get('/user/routes-and-permissions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
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
