import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { AuditService, AUDIT_ACTIONS } from '../../services/auditService';

const prisma = new PrismaClient();
const auditService = new AuditService(prisma);

describe('AuditService', () => {
  let testUserId: string;
  let testPermissionId: string;
  let testRoleId: string;

  beforeEach(async () => {
    // Create test role
    const role = await prisma.role.create({
      data: {
        name: 'admin',
        description: 'Administrator role'
      }
    });
    testRoleId = role.id;

    // Create test permission
    const permission = await prisma.permission.create({
      data: {
        code: 100,
        name: 'Dashboard Access',
        description: 'Access to admin dashboard'
      }
    });
    testPermissionId = permission.id;

    // Create test user
    const user = await prisma.user.create({
      data: {
        username: 'testuser',
        password: 'hashedpassword',
        roleId: testRoleId
      }
    });
    testUserId = user.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();
  });

  describe('createAuditLog', () => {
    it('should create an audit log entry', async () => {
      const auditData = {
        userId: testUserId,
        action: AUDIT_ACTIONS.LOGIN,
        permissionId: testPermissionId,
        ipAddress: '192.168.1.1',
        details: { browser: 'Chrome', success: true }
      };

      const result = await auditService.createAuditLog(auditData);

      expect(result).toBeDefined();
      expect(result.userId).toBe(testUserId);
      expect(result.action).toBe(AUDIT_ACTIONS.LOGIN);
      expect(result.permissionId).toBe(testPermissionId);
      expect(result.ipAddress).toBe('192.168.1.1');
      expect(result.details).toEqual({ browser: 'Chrome', success: true });
    });

    it('should create audit log without user ID', async () => {
      const auditData = {
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        ipAddress: '192.168.1.1',
        details: { reason: 'Invalid credentials' }
      };

      const result = await auditService.createAuditLog(auditData);

      expect(result).toBeDefined();
      expect(result.userId).toBeNull();
      expect(result.action).toBe(AUDIT_ACTIONS.LOGIN_FAILED);
    });

    it('should throw error for non-existent permission', async () => {
      const auditData = {
        userId: testUserId,
        action: AUDIT_ACTIONS.LOGIN,
        permissionId: 'non-existent-permission-id',
        ipAddress: '192.168.1.1'
      };

      await expect(auditService.createAuditLog(auditData))
        .rejects.toThrow('Permission with id non-existent-permission-id not found');
    });

    it('should throw error for non-existent user', async () => {
      const auditData = {
        userId: 'non-existent-user-id',
        action: AUDIT_ACTIONS.LOGIN,
        ipAddress: '192.168.1.1'
      };

      await expect(auditService.createAuditLog(auditData))
        .rejects.toThrow('User with id non-existent-user-id not found');
    });
  });

  describe('logAuthentication', () => {
    it('should log successful login', async () => {
      const result = await auditService.logAuthentication(
        'LOGIN',
        testUserId,
        '192.168.1.1',
        { browser: 'Chrome' }
      );

      expect(result.action).toBe(AUDIT_ACTIONS.LOGIN);
      expect(result.userId).toBe(testUserId);
      expect(result.ipAddress).toBe('192.168.1.1');
    });

    it('should log failed login without user ID', async () => {
      const result = await auditService.logAuthentication(
        'LOGIN_FAILED',
        undefined,
        '192.168.1.1',
        { reason: 'Invalid credentials' }
      );

      expect(result.action).toBe(AUDIT_ACTIONS.LOGIN_FAILED);
      expect(result.userId).toBeNull();
    });

    it('should log logout', async () => {
      const result = await auditService.logAuthentication(
        'LOGOUT',
        testUserId,
        '192.168.1.1'
      );

      expect(result.action).toBe(AUDIT_ACTIONS.LOGOUT);
      expect(result.userId).toBe(testUserId);
    });
  });

  describe('logUserManagement', () => {
    it('should log user creation', async () => {
      const targetUserId = 'target-user-id';
      
      const result = await auditService.logUserManagement(
        'USER_CREATED',
        testUserId,
        targetUserId,
        testPermissionId,
        '192.168.1.1',
        { username: 'newuser', role: 'participant' }
      );

      expect(result.action).toBe(AUDIT_ACTIONS.USER_CREATED);
      expect(result.userId).toBe(testUserId);
      expect(result.permissionId).toBe(testPermissionId);
      
      const details = result.details as any;
      expect(details.targetUserId).toBe(targetUserId);
      expect(details.username).toBe('newuser');
    });

    it('should log role change', async () => {
      const targetUserId = 'target-user-id';
      
      const result = await auditService.logUserManagement(
        'USER_ROLE_CHANGED',
        testUserId,
        targetUserId,
        testPermissionId,
        '192.168.1.1',
        { oldRole: 'participant', newRole: 'judge' }
      );

      expect(result.action).toBe(AUDIT_ACTIONS.USER_ROLE_CHANGED);
      
      const details = result.details as any;
      expect(details.targetUserId).toBe(targetUserId);
      expect(details.oldRole).toBe('participant');
      expect(details.newRole).toBe('judge');
    });
  });

  describe('logContestManagement', () => {
    it('should log contest creation', async () => {
      const contestId = 'test-contest-id';
      
      const result = await auditService.logContestManagement(
        'CONTEST_CREATED',
        testUserId,
        contestId,
        testPermissionId,
        '192.168.1.1',
        { name: 'Test Contest', description: 'A test contest' }
      );

      expect(result.action).toBe(AUDIT_ACTIONS.CONTEST_CREATED);
      expect(result.userId).toBe(testUserId);
      
      const details = result.details as any;
      expect(details.contestId).toBe(contestId);
      expect(details.name).toBe('Test Contest');
    });

    it('should log phase change', async () => {
      const contestId = 'test-contest-id';
      
      const result = await auditService.logContestManagement(
        'CONTEST_PHASE_CHANGED',
        testUserId,
        contestId,
        testPermissionId,
        '192.168.1.1',
        { oldPhase: 'Setup', newPhase: 'Running' }
      );

      expect(result.action).toBe(AUDIT_ACTIONS.CONTEST_PHASE_CHANGED);
      
      const details = result.details as any;
      expect(details.contestId).toBe(contestId);
      expect(details.oldPhase).toBe('Setup');
      expect(details.newPhase).toBe('Running');
    });
  });

  describe('getAuditLogs', () => {
    beforeEach(async () => {
      // Create test audit logs
      await auditService.createAuditLog({
        userId: testUserId,
        action: AUDIT_ACTIONS.LOGIN,
        ipAddress: '192.168.1.1',
        details: { test: 'data1' }
      });

      await auditService.createAuditLog({
        userId: testUserId,
        action: AUDIT_ACTIONS.LOGOUT,
        ipAddress: '192.168.1.2',
        details: { test: 'data2' }
      });

      await auditService.createAuditLog({
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        ipAddress: '192.168.1.3',
        details: { test: 'data3' }
      });
    });

    it('should get all audit logs with pagination', async () => {
      const result = await auditService.getAuditLogs({}, 1, 10);

      expect(result.logs).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(result.logs[0].user).toBeDefined();
    });

    it('should filter audit logs by user ID', async () => {
      const result = await auditService.getAuditLogs({ userId: testUserId }, 1, 10);

      expect(result.logs).toHaveLength(2);
      expect(result.logs.every(log => log.userId === testUserId)).toBe(true);
    });

    it('should filter audit logs by action', async () => {
      const result = await auditService.getAuditLogs({ action: AUDIT_ACTIONS.LOGIN }, 1, 10);

      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].action).toBe(AUDIT_ACTIONS.LOGIN);
    });

    it('should filter audit logs by IP address', async () => {
      const result = await auditService.getAuditLogs({ ipAddress: '192.168.1.1' }, 1, 10);

      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].ipAddress).toBe('192.168.1.1');
    });

    it('should handle pagination correctly', async () => {
      const result = await auditService.getAuditLogs({}, 1, 2);

      expect(result.logs).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.totalPages).toBe(2);
    });
  });

  describe('getUserAuditLogs', () => {
    beforeEach(async () => {
      await auditService.createAuditLog({
        userId: testUserId,
        action: AUDIT_ACTIONS.LOGIN,
        ipAddress: '192.168.1.1'
      });

      await auditService.createAuditLog({
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        ipAddress: '192.168.1.2'
      });
    });

    it('should get audit logs for specific user', async () => {
      const result = await auditService.getUserAuditLogs(testUserId);

      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].userId).toBe(testUserId);
    });
  });

  describe('getAuditStatistics', () => {
    beforeEach(async () => {
      // Create multiple audit logs for statistics
      await auditService.createAuditLog({
        userId: testUserId,
        action: AUDIT_ACTIONS.LOGIN,
        ipAddress: '192.168.1.1'
      });

      await auditService.createAuditLog({
        userId: testUserId,
        action: AUDIT_ACTIONS.LOGIN,
        ipAddress: '192.168.1.1'
      });

      await auditService.createAuditLog({
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        ipAddress: '192.168.1.2'
      });
    });

    it('should return audit statistics', async () => {
      const stats = await auditService.getAuditStatistics();

      expect(stats.totalLogs).toBe(3);
      expect(stats.uniqueUsers).toBe(2); // testUserId and null (anonymous)
      expect(stats.topActions).toHaveLength(2);
      expect(stats.topActions[0].action).toBe(AUDIT_ACTIONS.LOGIN);
      expect(stats.topActions[0].count).toBe(2);
      expect(stats.topUsers).toHaveLength(1);
      expect(stats.logsByDate).toBeDefined();
    });
  });

  describe('cleanupOldLogs', () => {
    beforeEach(async () => {
      // Create an old audit log
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 400); // 400 days ago

      await prisma.auditLog.create({
        data: {
          userId: testUserId,
          action: AUDIT_ACTIONS.LOGIN,
          timestamp: oldDate,
          ipAddress: '192.168.1.1'
        }
      });

      // Create a recent audit log
      await auditService.createAuditLog({
        userId: testUserId,
        action: AUDIT_ACTIONS.LOGOUT,
        ipAddress: '192.168.1.1'
      });
    });

    it('should cleanup old audit logs', async () => {
      const deletedCount = await auditService.cleanupOldLogs(365);

      expect(deletedCount).toBe(1);

      // Verify only recent log remains
      const remainingLogs = await prisma.auditLog.findMany();
      expect(remainingLogs).toHaveLength(1);
      expect(remainingLogs[0].action).toBe(AUDIT_ACTIONS.LOGOUT);
    });

    it('should not delete recent logs', async () => {
      const deletedCount = await auditService.cleanupOldLogs(30);

      expect(deletedCount).toBe(1);

      const remainingLogs = await prisma.auditLog.findMany();
      expect(remainingLogs).toHaveLength(1);
    });
  });
});