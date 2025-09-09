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


const router = Router();

// Self-service attendance (for participants)
router.post('/checkin', authenticateToken, checkIn);
router.post('/checkout', authenticateToken, checkOut);
router.post('/track-activity', authenticateToken, trackActivity);

// Attendance management (for admins and judges)
router.put('/status', authenticateToken, authorizeRoles(['ADMIN', 'JUDGE']), updateAttendanceStatus);
router.get('/records', authenticateToken, authorizeRoles(['ADMIN', 'JUDGE']), getAttendanceRecords);
router.get('/contest/:contestId', authenticateToken, authorizeRoles(['ADMIN', 'JUDGE']), getContestAttendance);
router.get('/user/:userId', authenticateToken, authorizeRoles(['ADMIN', 'JUDGE']), getUserAttendance);

// Reporting (admin only)
router.get('/report/:contestId', authenticateToken, authorizeRoles(['ADMIN']), generateAttendanceReport);
router.get('/statistics', authenticateToken, authorizeRoles(['ADMIN']), getAttendanceStatistics);
router.post('/contest/:contestId/mark-absent', authenticateToken, authorizeRoles(['ADMIN']), markAbsentUsers);

export default router;