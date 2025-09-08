import { PrismaClient, BackupRecord, BackupStatus } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Parser } from 'json2csv';

export interface BackupRequest {
  createdById: string;
  includeData?: boolean;
  includeFiles?: boolean;
  description?: string;
}

export interface RestoreRequest {
  backupId: string;
  restoredById: string;
  overwriteExisting?: boolean;
}

export interface ExportRequest {
  type: 'submissions' | 'users' | 'contests' | 'problems' | 'leaderboard' | 'audit_logs';
  format: 'csv' | 'json';
  filters?: any;
  createdById: string;
}

export interface BackupData {
  metadata: {
    version: string;
    timestamp: Date;
    includeData: boolean;
    includeFiles: boolean;
    description?: string;
  };
  schema?: any;
  data?: {
    users?: any[];
    roles?: any[];
    permissions?: any[];
    contests?: any[];
    problems?: any[];
    submissions?: any[];
    reviews?: any[];
    auditLogs?: any[];
    [key: string]: any[];
  };
  files?: string[];
}

export class BackupService {
  private prisma: PrismaClient;
  private backupDir: string;

  constructor(prismaClient?: PrismaClient, backupDirectory?: string) {
    this.prisma = prismaClient || new PrismaClient();
    this.backupDir = backupDirectory || path.join(process.cwd(), 'backups');
  }

  /**
   * Create a system backup
   */
  async createBackup(request: BackupRequest): Promise<BackupRecord> {
    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: request.createdById }
    });

    if (!user) {
      throw new Error(`User with id ${request.createdById} not found`);
    }

    // Ensure backup directory exists
    await this.ensureBackupDirectory();

    const timestamp = new Date();
    const backupFileName = `backup_${timestamp.toISOString().replace(/[:.]/g, '-')}.json`;
    const backupFilePath = path.join(this.backupDir, backupFileName);

    try {
      // Create backup record first
      const backupRecord = await this.prisma.backupRecord.create({
        data: {
          createdById: request.createdById,
          filePath: backupFilePath,
          status: BackupStatus.SUCCESS // Will update if backup fails
        }
      });

      // Create backup data
      const backupData: BackupData = {
        metadata: {
          version: '1.0',
          timestamp,
          includeData: request.includeData ?? true,
          includeFiles: request.includeFiles ?? false,
          description: request.description
        }
      };

      // Include database data if requested
      if (request.includeData) {
        backupData.data = await this.exportAllData();
      }

      // Include file references if requested
      if (request.includeFiles) {
        backupData.files = await this.getFileReferences();
      }

      // Write backup to file
      await fs.writeFile(backupFilePath, JSON.stringify(backupData, null, 2));

      return backupRecord;
    } catch (error) {
      // Update backup record status to failed
      await this.prisma.backupRecord.update({
        where: { id: (await this.prisma.backupRecord.findFirst({
          where: { filePath: backupFilePath }
        }))?.id },
        data: { status: BackupStatus.FAILED }
      });

      throw new Error(`Backup creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(request: RestoreRequest): Promise<void> {
    // Validate backup record exists
    const backupRecord = await this.prisma.backupRecord.findUnique({
      where: { id: request.backupId }
    });

    if (!backupRecord) {
      throw new Error(`Backup record with id ${request.backupId} not found`);
    }

    if (backupRecord.status !== BackupStatus.SUCCESS) {
      throw new Error('Cannot restore from failed backup');
    }

    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: request.restoredById }
    });

    if (!user) {
      throw new Error(`User with id ${request.restoredById} not found`);
    }

    try {
      // Read backup file
      const backupContent = await fs.readFile(backupRecord.filePath, 'utf-8');
      const backupData: BackupData = JSON.parse(backupContent);

      if (!backupData.data) {
        throw new Error('Backup does not contain data to restore');
      }

      // Perform restoration in transaction
      await this.prisma.$transaction(async (tx) => {
        if (request.overwriteExisting) {
          // Clear existing data (be very careful with this!)
          await this.clearExistingData(tx);
        }

        // Restore data in dependency order
        await this.restoreData(tx, backupData.data!);
      });

      console.log(`Backup ${request.backupId} restored successfully`);
    } catch (error) {
      throw new Error(`Backup restoration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export data in various formats
   */
  async exportData(request: ExportRequest): Promise<string> {
    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: request.createdById }
    });

    if (!user) {
      throw new Error(`User with id ${request.createdById} not found`);
    }

    // Ensure backup directory exists
    await this.ensureBackupDirectory();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `export_${request.type}_${timestamp}.${request.format}`;
    const filePath = path.join(this.backupDir, fileName);

    try {
      let data: any[];
      let content: string;

      // Get data based on type
      switch (request.type) {
        case 'submissions':
          data = await this.exportSubmissions(request.filters);
          break;
        case 'users':
          data = await this.exportUsers(request.filters);
          break;
        case 'contests':
          data = await this.exportContests(request.filters);
          break;
        case 'problems':
          data = await this.exportProblems(request.filters);
          break;
        case 'leaderboard':
          data = await this.exportLeaderboard(request.filters);
          break;
        case 'audit_logs':
          data = await this.exportAuditLogs(request.filters);
          break;
        default:
          throw new Error(`Unsupported export type: ${request.type}`);
      }

      // Format data
      if (request.format === 'csv') {
        const parser = new Parser();
        content = parser.parse(data);
      } else {
        content = JSON.stringify(data, null, 2);
      }

      // Write to file
      await fs.writeFile(filePath, content);

      return filePath;
    } catch (error) {
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all backup records
   */
  async getBackupRecords(): Promise<BackupRecord[]> {
    return await this.prisma.backupRecord.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Delete backup record and file
   */
  async deleteBackup(backupId: string): Promise<void> {
    const backupRecord = await this.prisma.backupRecord.findUnique({
      where: { id: backupId }
    });

    if (!backupRecord) {
      throw new Error(`Backup record with id ${backupId} not found`);
    }

    try {
      // Delete file if it exists
      try {
        await fs.unlink(backupRecord.filePath);
      } catch (fileError) {
        console.warn(`Could not delete backup file: ${backupRecord.filePath}`);
      }

      // Delete record
      await this.prisma.backupRecord.delete({
        where: { id: backupId }
      });
    } catch (error) {
      throw new Error(`Failed to delete backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate backup file integrity
   */
  async validateBackup(backupId: string): Promise<{ valid: boolean; errors: string[] }> {
    const backupRecord = await this.prisma.backupRecord.findUnique({
      where: { id: backupId }
    });

    if (!backupRecord) {
      return { valid: false, errors: ['Backup record not found'] };
    }

    const errors: string[] = [];

    try {
      // Check if file exists
      await fs.access(backupRecord.filePath);

      // Read and parse backup file
      const backupContent = await fs.readFile(backupRecord.filePath, 'utf-8');
      const backupData: BackupData = JSON.parse(backupContent);

      // Validate backup structure
      if (!backupData.metadata) {
        errors.push('Missing metadata');
      }

      if (backupData.metadata?.includeData && !backupData.data) {
        errors.push('Backup claims to include data but data is missing');
      }

      if (backupData.metadata?.includeFiles && !backupData.files) {
        errors.push('Backup claims to include files but file list is missing');
      }

      // Validate data integrity if present
      if (backupData.data) {
        const dataErrors = await this.validateBackupData(backupData.data);
        errors.push(...dataErrors);
      }

    } catch (error) {
      errors.push(`File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Export all database data
   */
  private async exportAllData(): Promise<BackupData['data']> {
    return {
      roles: await this.prisma.role.findMany(),
      permissions: await this.prisma.permission.findMany(),
      rolePermissions: await this.prisma.rolePermission.findMany(),
      users: await this.prisma.user.findMany({
        select: {
          id: true,
          username: true,
          displayName: true,
          roleId: true,
          pcCode: true,
          lastActive: true,
          scored: true,
          problemsSolvedCount: true
          // Exclude password for security
        }
      }),
      contests: await this.prisma.contest.findMany(),
      contestUsers: await this.prisma.contestUser.findMany(),
      problems: await this.prisma.questionProblem.findMany(),
      contestProblems: await this.prisma.contestProblem.findMany(),
      submissions: await this.prisma.submission.findMany(),
      reviews: await this.prisma.review.findMany(),
      analytics: await this.prisma.analytics.findMany(),
      leaderboard: await this.prisma.leaderboard.findMany(),
      systemControls: await this.prisma.systemControl.findMany(),
      auditLogs: await this.prisma.auditLog.findMany(),
      attendance: await this.prisma.attendance.findMany(),
      backupRecords: await this.prisma.backupRecord.findMany()
    };
  }

  /**
   * Export specific data types
   */
  private async exportSubmissions(filters?: any): Promise<any[]> {
    return await this.prisma.submission.findMany({
      where: filters,
      include: {
        submittedBy: {
          select: { username: true, displayName: true }
        },
        problem: {
          select: { questionText: true, difficultyLevel: true }
        },
        contest: {
          select: { name: true }
        },
        review: true
      }
    });
  }

  private async exportUsers(filters?: any): Promise<any[]> {
    return await this.prisma.user.findMany({
      where: filters,
      select: {
        id: true,
        username: true,
        displayName: true,
        role: { select: { name: true } },
        pcCode: true,
        lastActive: true,
        scored: true,
        problemsSolvedCount: true
      }
    });
  }

  private async exportContests(filters?: any): Promise<any[]> {
    return await this.prisma.contest.findMany({
      where: filters,
      include: {
        _count: {
          select: {
            contestUsers: true,
            submissions: true
          }
        }
      }
    });
  }

  private async exportProblems(filters?: any): Promise<any[]> {
    return await this.prisma.questionProblem.findMany({
      where: filters,
      include: {
        createdBy: {
          select: { username: true }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });
  }

  private async exportLeaderboard(filters?: any): Promise<any[]> {
    return await this.prisma.leaderboard.findMany({
      where: filters,
      include: {
        user: {
          select: { username: true, displayName: true }
        },
        contest: {
          select: { name: true }
        }
      },
      orderBy: [
        { rank: 'asc' }
      ]
    });
  }

  private async exportAuditLogs(filters?: any): Promise<any[]> {
    return await this.prisma.auditLog.findMany({
      where: filters,
      include: {
        user: {
          select: { username: true }
        },
        permission: {
          select: { name: true, code: true }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
  }

  /**
   * Get file references (placeholder for actual file management)
   */
  private async getFileReferences(): Promise<string[]> {
    // This would typically scan for uploaded files, problem attachments, etc.
    // For now, return empty array as we don't have file uploads implemented
    return [];
  }

  /**
   * Ensure backup directory exists
   */
  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  /**
   * Clear existing data (use with extreme caution!)
   */
  private async clearExistingData(tx: any): Promise<void> {
    // Delete in reverse dependency order
    await tx.auditLog.deleteMany();
    await tx.systemControl.deleteMany();
    await tx.attendance.deleteMany();
    await tx.backupRecord.deleteMany();
    await tx.leaderboard.deleteMany();
    await tx.analytics.deleteMany();
    await tx.review.deleteMany();
    await tx.submission.deleteMany();
    await tx.contestProblem.deleteMany();
    await tx.contestUser.deleteMany();
    await tx.questionProblem.deleteMany();
    await tx.contest.deleteMany();
    await tx.user.deleteMany();
    await tx.rolePermission.deleteMany();
    await tx.permission.deleteMany();
    await tx.role.deleteMany();
  }

  /**
   * Restore data from backup
   */
  private async restoreData(tx: any, data: NonNullable<BackupData['data']>): Promise<void> {
    // Restore in dependency order
    if (data.roles) {
      for (const role of data.roles) {
        await tx.role.create({ data: role });
      }
    }

    if (data.permissions) {
      for (const permission of data.permissions) {
        await tx.permission.create({ data: permission });
      }
    }

    if (data.rolePermissions) {
      for (const rolePermission of data.rolePermissions) {
        await tx.rolePermission.create({ data: rolePermission });
      }
    }

    if (data.users) {
      for (const user of data.users) {
        await tx.user.create({ data: user });
      }
    }

    if (data.contests) {
      for (const contest of data.contests) {
        await tx.contest.create({ data: contest });
      }
    }

    // Continue with other data types...
    // This is a simplified version - full implementation would handle all data types
  }

  /**
   * Validate backup data integrity
   */
  private async validateBackupData(data: NonNullable<BackupData['data']>): Promise<string[]> {
    const errors: string[] = [];

    // Basic validation - check for required fields
    if (data.users) {
      for (const user of data.users) {
        if (!user.username || !user.roleId) {
          errors.push(`Invalid user data: missing username or roleId`);
        }
      }
    }

    if (data.contests) {
      for (const contest of data.contests) {
        if (!contest.name) {
          errors.push(`Invalid contest data: missing name`);
        }
      }
    }

    // Add more validation as needed

    return errors;
  }
}

export const backupService = new BackupService();