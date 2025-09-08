import { Router } from 'express';
import {
  getDashboardData,
  createProblem,
  updateProblem,
  getUsers,
  createUser,
  updateUserRole,
  updateContestState,
  performEmergencyAction,
  getSystemControls,
  getContestState,
  getAuditLogs,
  getUserAuditLogs,
  getAuditStatistics,
  cleanupAuditLogs,
  createBackup,
  getBackups,
  restoreBackup,
  deleteBackup,
  validateBackup,
  exportData,
  exportSubmissionsCsv,
  exportStandingsCsv,
} from '../controllers/adminController';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs'; // Import bcrypt for user creation

const router = Router();

// Dashboard
router.get('/dashboard', authenticateToken, authorizeRoles([Role.ADMIN]), getDashboardData);

// Problems
router.post('/problems', authenticateToken, authorizeRoles([Role.ADMIN]), createProblem);
router.put('/problems/:id', authenticateToken, authorizeRoles([Role.ADMIN]), updateProblem);

// Users
router.get('/users', authenticateToken, authorizeRoles([Role.ADMIN]), getUsers);
router.post('/users', authenticateToken, authorizeRoles([Role.ADMIN]), createUser);
router.put('/users/:id/role', authenticateToken, authorizeRoles([Role.ADMIN]), updateUserRole);

// Contest Control
router.post('/contest/state', authenticateToken, authorizeRoles([Role.ADMIN]), updateContestState);
router.post('/contest/emergency', authenticateToken, authorizeRoles([Role.ADMIN]), performEmergencyAction);
router.get('/contest/:contestId/controls', authenticateToken, authorizeRoles([Role.ADMIN]), getSystemControls);
router.get('/contest/:contestId/state', authenticateToken, authorizeRoles([Role.ADMIN]), getContestState);

// Audit Log
router.get('/audit-logs', authenticateToken, authorizeRoles([Role.ADMIN]), getAuditLogs);
router.get('/audit-logs/user/:userId', authenticateToken, authorizeRoles([Role.ADMIN]), getUserAuditLogs);
router.get('/audit-logs/statistics', authenticateToken, authorizeRoles([Role.ADMIN]), getAuditStatistics);
router.post('/audit-logs/cleanup', authenticateToken, authorizeRoles([Role.ADMIN]), cleanupAuditLogs);

// Backup and Data Management
router.post('/backups', authenticateToken, authorizeRoles([Role.ADMIN]), createBackup);
router.get('/backups', authenticateToken, authorizeRoles([Role.ADMIN]), getBackups);
router.post('/backups/:backupId/restore', authenticateToken, authorizeRoles([Role.ADMIN]), restoreBackup);
router.delete('/backups/:backupId', authenticateToken, authorizeRoles([Role.ADMIN]), deleteBackup);
router.get('/backups/:backupId/validate', authenticateToken, authorizeRoles([Role.ADMIN]), validateBackup);
router.post('/export', authenticateToken, authorizeRoles([Role.ADMIN]), exportData);

// Legacy Exports (keep for backward compatibility)
router.get('/exports/submissions', authenticateToken, authorizeRoles([Role.ADMIN]), exportSubmissionsCsv);
router.get('/exports/standings', authenticateToken, authorizeRoles([Role.ADMIN]), exportStandingsCsv);

export default router;