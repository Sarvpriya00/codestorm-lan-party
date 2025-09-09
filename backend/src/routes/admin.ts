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

import * as bcrypt from 'bcryptjs'; // Import bcrypt for user creation

const router = Router();

// Dashboard
router.get('/dashboard', authenticateToken, authorizeRoles(['ADMIN']), getDashboardData);

// Problems
router.post('/problems', authenticateToken, authorizeRoles(['ADMIN']), createProblem);
router.put('/problems/:id', authenticateToken, authorizeRoles(['ADMIN']), updateProblem);

// Users
router.get('/users', authenticateToken, authorizeRoles(['ADMIN']), getUsers);
router.post('/users', authenticateToken, authorizeRoles(['ADMIN']), createUser);
router.put('/users/:id/role', authenticateToken, authorizeRoles(['ADMIN']), updateUserRole);

// Contest Control
router.post('/contest/state', authenticateToken, authorizeRoles(['ADMIN']), updateContestState);
router.post('/contest/emergency', authenticateToken, authorizeRoles(['ADMIN']), performEmergencyAction);
router.get('/contest/:contestId/controls', authenticateToken, authorizeRoles(['ADMIN']), getSystemControls);
router.get('/contest/:contestId/state', authenticateToken, authorizeRoles(['ADMIN']), getContestState);

// Audit Log
router.get('/audit-logs', authenticateToken, authorizeRoles(['ADMIN']), getAuditLogs);
router.get('/audit-logs/user/:userId', authenticateToken, authorizeRoles(['ADMIN']), getUserAuditLogs);
router.get('/audit-logs/statistics', authenticateToken, authorizeRoles(['ADMIN']), getAuditStatistics);
router.post('/audit-logs/cleanup', authenticateToken, authorizeRoles(['ADMIN']), cleanupAuditLogs);

// Backup and Data Management
router.post('/backups', authenticateToken, authorizeRoles(['ADMIN']), createBackup);
router.get('/backups', authenticateToken, authorizeRoles(['ADMIN']), getBackups);
router.post('/backups/:backupId/restore', authenticateToken, authorizeRoles(['ADMIN']), restoreBackup);
router.delete('/backups/:backupId', authenticateToken, authorizeRoles(['ADMIN']), deleteBackup);
router.get('/backups/:backupId/validate', authenticateToken, authorizeRoles(['ADMIN']), validateBackup);
router.post('/export', authenticateToken, authorizeRoles(['ADMIN']), exportData);

// Legacy Exports (keep for backward compatibility)
router.get('/exports/submissions', authenticateToken, authorizeRoles(['ADMIN']), exportSubmissionsCsv);
router.get('/exports/standings', authenticateToken, authorizeRoles(['ADMIN']), exportStandingsCsv);

export default router;