import { PrismaClient, AuditLog } from '@prisma/client';

export interface AuditLogRequest {
  userId?: string;
  action: string;
  permissionId?: string;
  ipAddress?: string;
  details?: any;
}

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  permissionId?: string;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
}

export interface AuditLogResponse extends AuditLog {
  user?: {
    id: string;
    username: string;
    displayName?: string | null;
  } | null;
  permission?: {
    id: string;
    code: number;
    name: string;
  } | null;
}

// Audit Action Types
export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  
  // User Management
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  
  // Contest Management
  CONTEST_CREATED: 'CONTEST_CREATED',
  CONTEST_UPDATED: 'CONTEST_UPDATED',
  CONTEST_DELETED: 'CONTEST_DELETED',
  CONTEST_PHASE_CHANGED: 'CONTEST_PHASE_CHANGED',
  CONTEST_EMERGENCY_ACTION: 'CONTEST_EMERGENCY_ACTION',
  
  // Problem Management
  PROBLEM_CREATED: 'PROBLEM_CREATED',
  PROBLEM_UPDATED: 'PROBLEM_UPDATED',
  PROBLEM_DELETED: 'PROBLEM_DELETED',
  PROBLEM_ASSIGNED: 'PROBLEM_ASSIGNED',
  PROBLEM_REMOVED: 'PROBLEM_REMOVED',
  
  // Submission Management
  SUBMISSION_CREATED: 'SUBMISSION_CREATED',
  SUBMISSION_REVIEWED: 'SUBMISSION_REVIEWED',
  SUBMISSION_STATUS_CHANGED: 'SUBMISSION_STATUS_CHANGED',
  
  // Judge Actions
  SUBMISSION_CLAIMED: 'SUBMISSION_CLAIMED',
  REVIEW_SUBMITTED: 'REVIEW_SUBMITTED',
  VERDICT_POSTED: 'VERDICT_POSTED',
  
  // System Administration
  BACKUP_CREATED: 'BACKUP_CREATED',
  BACKUP_RESTORED: 'BACKUP_RESTORED',
  DATA_EXPORTED: 'DATA_EXPORTED',
  SYSTEM_CONTROL_UPDATED: 'SYSTEM_CONTROL_UPDATED',
  
  // Permission Management
  PERMISSION_GRANTED: 'PERMISSION_GRANTED',
  PERMISSION_REVOKED: 'PERMISSION_REVOKED',
  ROLE_PERMISSION_UPDATED: 'ROLE_PERMISSION_UPDATED',
  
  // Attendance
  ATTENDANCE_CHECKED_IN: 'ATTENDANCE_CHECKED_IN',
  ATTENDANCE_CHECKED_OUT: 'ATTENDANCE_CHECKED_OUT',
  ATTENDANCE_UPDATED: 'ATTENDANCE_UPDATED'
} as const;

export class AuditService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient();
  }

  /**
   * Create an audit log entry
   */
  async createAuditLog(data: AuditLogRequest): Promise<AuditLog> {
    // Validate permission exists if provided
    if (data.permissionId) {
      const permission = await this.prisma.permission.findUnique({
        where: { id: data.permissionId }
      });
      
      if (!permission) {
        throw new Error(`Permission with id ${data.permissionId} not found`);
      }
    }

    // Validate user exists if provided
    if (data.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId }
      });
      
      if (!user) {
        throw new Error(`User with id ${data.userId} not found`);
      }
    }

    return await this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        permissionId: data.permissionId,
        ipAddress: data.ipAddress,
        details: data.details,
        timestamp: new Date()
      }
    });
  }

  /**
   * Log authentication events
   */
  async logAuthentication(
    action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED',
    userId?: string,
    ipAddress?: string,
    details?: any
  ): Promise<AuditLog> {
    return await this.createAuditLog({
      userId,
      action: AUDIT_ACTIONS[action],
      ipAddress,
      details: {
        ...details,
        timestamp: new Date()
      }
    });
  }

  /**
   * Log user management events
   */
  async logUserManagement(
    action: 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED' | 'USER_ROLE_CHANGED',
    performedById: string,
    targetUserId: string,
    permissionId?: string,
    ipAddress?: string,
    details?: any
  ): Promise<AuditLog> {
    return await this.createAuditLog({
      userId: performedById,
      action: AUDIT_ACTIONS[action],
      permissionId,
      ipAddress,
      details: {
        targetUserId,
        ...details
      }
    });
  }

  /**
   * Log contest management events
   */
  async logContestManagement(
    action: 'CONTEST_CREATED' | 'CONTEST_UPDATED' | 'CONTEST_DELETED' | 'CONTEST_PHASE_CHANGED' | 'CONTEST_EMERGENCY_ACTION',
    userId: string,
    contestId: string,
    permissionId?: string,
    ipAddress?: string,
    details?: any
  ): Promise<AuditLog> {
    return await this.createAuditLog({
      userId,
      action: AUDIT_ACTIONS[action],
      permissionId,
      ipAddress,
      details: {
        contestId,
        ...details
      }
    });
  }

  /**
   * Log submission and review events
   */
  async logSubmissionActivity(
    action: 'SUBMISSION_CREATED' | 'SUBMISSION_REVIEWED' | 'SUBMISSION_CLAIMED' | 'REVIEW_SUBMITTED' | 'VERDICT_POSTED',
    userId: string,
    submissionId: string,
    permissionId?: string,
    ipAddress?: string,
    details?: any
  ): Promise<AuditLog> {
    return await this.createAuditLog({
      userId,
      action: AUDIT_ACTIONS[action],
      permissionId,
      ipAddress,
      details: {
        submissionId,
        ...details
      }
    });
  }

  /**
   * Log system administration events
   */
  async logSystemAdministration(
    action: 'BACKUP_CREATED' | 'BACKUP_RESTORED' | 'DATA_EXPORTED' | 'SYSTEM_CONTROL_UPDATED',
    userId: string,
    permissionId?: string,
    ipAddress?: string,
    details?: any
  ): Promise<AuditLog> {
    return await this.createAuditLog({
      userId,
      action: AUDIT_ACTIONS[action],
      permissionId,
      ipAddress,
      details
    });
  }

  /**
   * Get audit logs with filters and pagination
   */
  async getAuditLogs(
    filters: AuditLogFilters = {},
    page: number = 1,
    pageSize: number = 50
  ): Promise<{
    logs: AuditLogResponse[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * pageSize;
    const where: any = {};

    // Apply filters
    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.permissionId) {
      where.permissionId = filters.permissionId;
    }

    if (filters.ipAddress) {
      where.ipAddress = filters.ipAddress;
    }

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    // Get logs with related data
    const logs = await this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        },
        permission: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      skip,
      take: pageSize
    });

    // Get total count
    const total = await this.prisma.auditLog.count({ where });

    return {
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(
    userId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    logs: AuditLogResponse[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    return await this.getAuditLogs({ userId }, page, pageSize);
  }

  /**
   * Get audit logs for a specific action
   */
  async getActionAuditLogs(
    action: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    logs: AuditLogResponse[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    return await this.getAuditLogs({ action }, page, pageSize);
  }

  /**
   * Get audit logs for a specific permission
   */
  async getPermissionAuditLogs(
    permissionId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    logs: AuditLogResponse[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    return await this.getAuditLogs({ permissionId }, page, pageSize);
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalLogs: number;
    uniqueUsers: number;
    topActions: { action: string; count: number }[];
    topUsers: { userId: string; username: string; count: number }[];
    logsByDate: { date: string; count: number }[];
  }> {
    const where: any = {};
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = startDate;
      }
      if (endDate) {
        where.timestamp.lte = endDate;
      }
    }

    // Total logs
    const totalLogs = await this.prisma.auditLog.count({ where });

    // Unique users
    const uniqueUsers = await this.prisma.auditLog.findMany({
      where,
      select: { userId: true },
      distinct: ['userId']
    });

    // Top actions
    const actionCounts = await this.prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
      take: 10
    });

    const topActions = actionCounts.map(item => ({
      action: item.action,
      count: item._count.action
    }));

    // Top users
    const userCounts = await this.prisma.auditLog.groupBy({
      by: ['userId'],
      where: { ...where, userId: { not: null } },
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 10
    });

    const userIds = userCounts.map(item => item.userId).filter(Boolean) as string[];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true }
    });

    const topUsers = userCounts.map(item => {
      const user = users.find(u => u.id === item.userId);
      return {
        userId: item.userId || 'anonymous',
        username: user?.username || 'anonymous',
        count: item._count.userId
      };
    });

    // Logs by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logsByDate = await this.prisma.$queryRaw<{ date: string; count: number }[]>`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as count
      FROM AuditLog 
      WHERE timestamp >= ${thirtyDaysAgo}
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `;

    return {
      totalLogs,
      uniqueUsers: uniqueUsers.length,
      topActions,
      topUsers,
      logsByDate
    };
  }

  /**
   * Clean up old audit logs (retention policy)
   */
  async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate
        }
      }
    });

    return result.count;
  }
}

export const auditService = new AuditService();