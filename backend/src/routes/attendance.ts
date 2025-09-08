import { Router } from 'express';
import {
  checkIn,
  checkOut,
  updateAttendanceStatus,
  getAttendanceRecords,
  getContestAttendance,
  getUserAttendance,
  generateAttendanceReport,
  getAttendanceStatistics,
  markAbsentUsers,
  trackActivity
} from '../controllers/attendanceController';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

// Self-service attendance (for participants)
router.post('/checkin', authenticateToken, checkIn);
router.post('/checkout', authenticateToken, checkOut);
router.post('/track-activity', authenticateToken, trackActivity);

// Attendance management (for admins and judges)
router.put('/status', authenticateToken, authorizeRoles([Role.ADMIN, Role.JUDGE]), updateAttendanceStatus);
router.get('/records', authenticateToken, authorizeRoles([Role.ADMIN, Role.JUDGE]), getAttendanceRecords);
router.get('/contest/:contestId', authenticateToken, authorizeRoles([Role.ADMIN, Role.JUDGE]), getContestAttendance);
router.get('/user/:userId', authenticateToken, authorizeRoles([Role.ADMIN, Role.JUDGE]), getUserAttendance);

// Reporting (admin only)
router.get('/report/:contestId', authenticateToken, authorizeRoles([Role.ADMIN]), generateAttendanceReport);
router.get('/statistics', authenticateToken, authorizeRoles([Role.ADMIN]), getAttendanceStatistics);
router.post('/contest/:contestId/mark-absent', authenticateToken, authorizeRoles([Role.ADMIN]), markAbsentUsers);

export default router;