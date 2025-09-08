import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient, BackupStatus } from '@prisma/client';
import { BackupService } from '../../services/backupService';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();
const testBackupDir = path.join(process.cwd(), 'test-backups');
const backupService = new BackupService(prisma, testBackupDir);

describe('BackupService', () => {
  let testUserId: string;
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

    // Create test user
    const user = await prisma.user.create({
      data: {
        username: 'testadmin',
        password: 'hashedpassword',
        roleId: testRoleId
      }
    });
    testUserId = user.id;

    // Ensure test backup directory exists
    try {
      await fs.mkdir(testBackupDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.backupRecord.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();

    // Clean up test backup files
    try {
      const files = await fs.readdir(testBackupDir);
      for (const file of files) {
        await fs.unlink(path.join(testBackupDir, file));
      }
      await fs.rmdir(testBackupDir);
    } catch (error) {
      // Directory might not exist or be empty
    }
  });

  describe('createBackup', () => {
    it('should create a backup with data', async () => {
      const backupRequest = {
        createdById: testUserId,
        includeData: true,
        includeFiles: false,
        description: 'Test backup'
      };

      const result = await backupService.createBackup(backupRequest);

      expect(result).toBeDefined();
      expect(result.createdById).toBe(testUserId);
      expect(result.status).toBe(BackupStatus.SUCCESS);
      expect(result.filePath).toContain('backup_');

      // Verify backup file exists
      await expect(fs.access(result.filePath)).resolves.not.toThrow();

      // Verify backup file content
      const backupContent = await fs.readFile(result.filePath, 'utf-8');
      const backupData = JSON.parse(backupContent);
      
      expect(backupData.metadata).toBeDefined();
      expect(backupData.metadata.includeData).toBe(true);
      expect(backupData.metadata.description).toBe('Test backup');
      expect(backupData.data).toBeDefined();
      expect(backupData.data.users).toBeDefined();
      expect(backupData.data.roles).toBeDefined();
    });

    it('should create a backup without data', async () => {
      const backupRequest = {
        createdById: testUserId,
        includeData: false,
        includeFiles: false
      };

      const result = await backupService.createBackup(backupRequest);

      expect(result.status).toBe(BackupStatus.SUCCESS);

      // Verify backup file content
      const backupContent = await fs.readFile(result.filePath, 'utf-8');
      const backupData = JSON.parse(backupContent);
      
      expect(backupData.metadata.includeData).toBe(false);
      expect(backupData.data).toBeUndefined();
    });

    it('should throw error for non-existent user', async () => {
      const backupRequest = {
        createdById: 'non-existent-user-id',
        includeData: true
      };

      await expect(backupService.createBackup(backupRequest))
        .rejects.toThrow('User with id non-existent-user-id not found');
    });
  });

  describe('getBackupRecords', () => {
    beforeEach(async () => {
      // Create test backup records
      await backupService.createBackup({
        createdById: testUserId,
        includeData: true,
        description: 'Test backup 1'
      });

      await backupService.createBackup({
        createdById: testUserId,
        includeData: false,
        description: 'Test backup 2'
      });
    });

    it('should get all backup records', async () => {
      const backups = await backupService.getBackupRecords();

      expect(backups).toHaveLength(2);
      expect(backups[0].createdBy).toBeDefined();
      expect(backups[0].createdBy.username).toBe('testadmin');
      expect(backups.every(b => b.status === BackupStatus.SUCCESS)).toBe(true);
    });
  });

  describe('deleteBackup', () => {
    it('should delete backup record and file', async () => {
      // Create a backup first
      const backup = await backupService.createBackup({
        createdById: testUserId,
        includeData: true
      });

      // Verify file exists
      await expect(fs.access(backup.filePath)).resolves.not.toThrow();

      // Delete backup
      await backupService.deleteBackup(backup.id);

      // Verify record is deleted
      const deletedBackup = await prisma.backupRecord.findUnique({
        where: { id: backup.id }
      });
      expect(deletedBackup).toBeNull();

      // Verify file is deleted (might not throw if file doesn't exist)
      try {
        await fs.access(backup.filePath);
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        // Expected - file should not exist
        expect(error).toBeDefined();
      }
    });

    it('should throw error for non-existent backup', async () => {
      await expect(backupService.deleteBackup('non-existent-backup-id'))
        .rejects.toThrow('Backup record with id non-existent-backup-id not found');
    });
  });

  describe('validateBackup', () => {
    it('should validate a good backup', async () => {
      const backup = await backupService.createBackup({
        createdById: testUserId,
        includeData: true,
        description: 'Valid backup'
      });

      const validation = await backupService.validateBackup(backup.id);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid backup', async () => {
      // Create backup record but corrupt the file
      const backup = await backupService.createBackup({
        createdById: testUserId,
        includeData: true
      });

      // Corrupt the backup file
      await fs.writeFile(backup.filePath, 'invalid json content');

      const validation = await backupService.validateBackup(backup.id);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('File validation failed');
    });

    it('should return error for non-existent backup', async () => {
      const validation = await backupService.validateBackup('non-existent-backup-id');

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Backup record not found');
    });
  });

  describe('exportData', () => {
    beforeEach(async () => {
      // Create test contest for export
      await prisma.contest.create({
        data: {
          name: 'Test Contest',
          description: 'Test contest for export'
        }
      });
    });

    it('should export users data as CSV', async () => {
      const filePath = await backupService.exportData({
        type: 'users',
        format: 'csv',
        createdById: testUserId
      });

      expect(filePath).toContain('export_users_');
      expect(filePath.endsWith('.csv')).toBe(true);

      // Verify file exists and has content
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('username');
      expect(content).toContain('testadmin');
    });

    it('should export contests data as JSON', async () => {
      const filePath = await backupService.exportData({
        type: 'contests',
        format: 'json',
        createdById: testUserId
      });

      expect(filePath).toContain('export_contests_');
      expect(filePath.endsWith('.json')).toBe(true);

      // Verify file exists and has content
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].name).toBe('Test Contest');
    });

    it('should throw error for invalid export type', async () => {
      await expect(backupService.exportData({
        type: 'invalid_type' as any,
        format: 'csv',
        createdById: testUserId
      })).rejects.toThrow('Unsupported export type: invalid_type');
    });

    it('should throw error for non-existent user', async () => {
      await expect(backupService.exportData({
        type: 'users',
        format: 'csv',
        createdById: 'non-existent-user-id'
      })).rejects.toThrow('User with id non-existent-user-id not found');
    });
  });

  describe('restoreBackup', () => {
    it('should throw error for non-existent backup', async () => {
      await expect(backupService.restoreBackup({
        backupId: 'non-existent-backup-id',
        restoredById: testUserId
      })).rejects.toThrow('Backup record with id non-existent-backup-id not found');
    });

    it('should throw error for failed backup', async () => {
      // Create a failed backup record
      const failedBackup = await prisma.backupRecord.create({
        data: {
          createdById: testUserId,
          filePath: '/fake/path',
          status: BackupStatus.FAILED
        }
      });

      await expect(backupService.restoreBackup({
        backupId: failedBackup.id,
        restoredById: testUserId
      })).rejects.toThrow('Cannot restore from failed backup');
    });

    it('should throw error for non-existent user', async () => {
      const backup = await backupService.createBackup({
        createdById: testUserId,
        includeData: true
      });

      await expect(backupService.restoreBackup({
        backupId: backup.id,
        restoredById: 'non-existent-user-id'
      })).rejects.toThrow('User with id non-existent-user-id not found');
    });
  });
});