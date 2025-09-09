import { PrismaClient, Attendance, AttendanceStatus } from '@prisma/client';

export interface AttendanceRequest {
  contestId: string;
  userId: string;
  status?: AttendanceStatus;
}

export interface CheckInRequest {
  contestId: string;
  userId: string;
  checkinTime?: Date;
}

export interface CheckOutRequest {
  contestId: string;
  userId: string;
  checkoutTime?: Date;
}

export interface AttendanceFilters {
  contestId?: string;
  userId?: string;
  status?: AttendanceStatus;
  checkinAfter?: Date;
  checkinBefore?: Date;
}

export interface AttendanceReport {
  contestId: string;
  contestName: string;
  totalParticipants: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number;
  participants: {
    userId: string;
    username: string;
    displayName?: string | null;
    status: AttendanceStatus;
    checkinTime?: Date;
    checkoutTime?: Date | null;
    duration?: number; // in minutes
  }[];
}

export interface AttendanceStatistics {
  totalSessions: number;
  averageAttendanceRate: number;
  averageSessionDuration: number; // in minutes
  mostActiveUsers: {
    userId: string;
    username: string;
    sessionsCount: number;
    totalDuration: number;
  }[];
  attendanceByContest: {
    contestId: string;
    contestName: string;
    attendanceRate: number;
    participantCount: number;
  }[];
}

export class AttendanceService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient();
  }

  /**
   * Check in a user for a contest
   */
  async checkIn(request: CheckInRequest): Promise<Attendance> {
    // Validate contest exists
    const contest = await this.prisma.contest.findUnique({
      where: { id: request.contestId }
    });

    if (!contest) {
      throw new Error(`Contest with id ${request.contestId} not found`);
    }

    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: request.userId }
    });

    if (!user) {
      throw new Error(`User with id ${request.userId} not found`);
    }

    // Check if user is registered for the contest
    const contestUser = await this.prisma.contestUser.findUnique({
      where: {
        contestId_userId: {
          contestId: request.contestId,
          userId: request.userId
        }
      }
    });

    if (!contestUser) {
      throw new Error('User is not registered for this contest');
    }

    // Check if attendance record already exists
    const existingAttendance = await this.prisma.attendance.findUnique({
      where: {
        contestId_userId: {
          contestId: request.contestId,
          userId: request.userId
        }
      }
    });

    if (existingAttendance) {
      // Update existing record
      return await this.prisma.attendance.update({
        where: {
          contestId_userId: {
            contestId: request.contestId,
            userId: request.userId
          }
        },
        data: {
          checkinTime: request.checkinTime || new Date(),
          status: AttendanceStatus.PRESENT,
          checkoutTime: null // Reset checkout time on new checkin
        }
      });
    } else {
      // Create new attendance record
      return await this.prisma.attendance.create({
        data: {
          contestId: request.contestId,
          userId: request.userId,
          checkinTime: request.checkinTime || new Date(),
          status: AttendanceStatus.PRESENT
        }
      });
    }
  }

  /**
   * Check out a user from a contest
   */
  async checkOut(request: CheckOutRequest): Promise<Attendance> {
    // Find existing attendance record
    const attendance = await this.prisma.attendance.findUnique({
      where: {
        contestId_userId: {
          contestId: request.contestId,
          userId: request.userId
        }
      }
    });

    if (!attendance) {
      throw new Error('No check-in record found for this user and contest');
    }

    if (attendance.checkoutTime) {
      throw new Error('User has already checked out');
    }

    // Update with checkout time
    return await this.prisma.attendance.update({
      where: {
        contestId_userId: {
          contestId: request.contestId,
          userId: request.userId
        }
      },
      data: {
        checkoutTime: request.checkoutTime || new Date()
      }
    });
  }

  /**
   * Update attendance status manually
   */
  async updateAttendanceStatus(
    contestId: string,
    userId: string,
    status: AttendanceStatus
  ): Promise<Attendance> {
    // Validate contest and user exist
    await this.validateContestAndUser(contestId, userId);

    // Find or create attendance record
    const existingAttendance = await this.prisma.attendance.findUnique({
      where: {
        contestId_userId: {
          contestId,
          userId
        }
      }
    });

    if (existingAttendance) {
      return await this.prisma.attendance.update({
        where: {
          contestId_userId: {
            contestId,
            userId
          }
        },
        data: { status }
      });
    } else {
      return await this.prisma.attendance.create({
        data: {
          contestId,
          userId,
          status,
          checkinTime: status === AttendanceStatus.PRESENT ? new Date() : undefined
        }
      });
    }
  }

  /**
   * Get attendance records with filters
   */
  async getAttendanceRecords(filters: AttendanceFilters = {}): Promise<Attendance[]> {
    const where: any = {};

    if (filters.contestId) {
      where.contestId = filters.contestId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.checkinAfter || filters.checkinBefore) {
      where.checkinTime = {};
      if (filters.checkinAfter) {
        where.checkinTime.gte = filters.checkinAfter;
      }
      if (filters.checkinBefore) {
        where.checkinTime.lte = filters.checkinBefore;
      }
    }

    return await this.prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        },
        contest: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        checkinTime: 'desc'
      }
    });
  }

  /**
   * Get attendance for a specific contest
   */
  async getContestAttendance(contestId: string): Promise<Attendance[]> {
    return await this.getAttendanceRecords({ contestId });
  }

  /**
   * Get attendance for a specific user
   */
  async getUserAttendance(userId: string): Promise<Attendance[]> {
    return await this.getAttendanceRecords({ userId });
  }

  /**
   * Generate attendance report for a contest
   */
  async generateAttendanceReport(contestId: string): Promise<AttendanceReport> {
    // Validate contest exists
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        contestUsers: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          }
        }
      }
    });

    if (!contest) {
      throw new Error(`Contest with id ${contestId} not found`);
    }

    // Get attendance records for the contest
    const attendanceRecords = await this.prisma.attendance.findMany({
      where: { contestId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    });

    // Create attendance map
    const attendanceMap = new Map<string, Attendance>();
    attendanceRecords.forEach(record => {
      attendanceMap.set(record.userId, record);
    });

    // Build participant list with attendance status
    const participants = contest.contestUsers.map(contestUser => {
      const attendance = attendanceMap.get(contestUser.userId);
      const duration = attendance?.checkinTime && attendance?.checkoutTime
        ? Math.floor((attendance.checkoutTime.getTime() - attendance.checkinTime.getTime()) / (1000 * 60))
        : undefined;

      return {
        userId: contestUser.userId,
        username: contestUser.user.username,
        displayName: contestUser.user.displayName,
        status: attendance?.status || AttendanceStatus.ABSENT,
        checkinTime: attendance?.checkinTime,
        checkoutTime: attendance?.checkoutTime,
        duration
      };
    });

    const totalParticipants = participants.length;
    const presentCount = participants.filter(p => p.status === AttendanceStatus.PRESENT).length;
    const absentCount = totalParticipants - presentCount;
    const attendanceRate = totalParticipants > 0 ? (presentCount / totalParticipants) * 100 : 0;

    return {
      contestId,
      contestName: contest.name,
      totalParticipants,
      presentCount,
      absentCount,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      participants
    };
  }

  /**
   * Get attendance statistics
   */
  async getAttendanceStatistics(): Promise<AttendanceStatistics> {
    // Total sessions
    const totalSessions = await this.prisma.attendance.count();

    // Get all attendance records with contest and user info
    const allAttendance = await this.prisma.attendance.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        },
        contest: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Calculate average attendance rate
    const contestAttendanceRates = await this.calculateContestAttendanceRates();
    const averageAttendanceRate = contestAttendanceRates.length > 0
      ? contestAttendanceRates.reduce((sum, rate) => sum + rate.attendanceRate, 0) / contestAttendanceRates.length
      : 0;

    // Calculate average session duration
    const sessionsWithDuration = allAttendance.filter(a => a.checkinTime && a.checkoutTime);
    const totalDuration = sessionsWithDuration.reduce((sum, attendance) => {
      const duration = attendance.checkoutTime!.getTime() - attendance.checkinTime!.getTime();
      return sum + (duration / (1000 * 60)); // Convert to minutes
    }, 0);
    const averageSessionDuration = sessionsWithDuration.length > 0
      ? totalDuration / sessionsWithDuration.length
      : 0;

    // Most active users
    const userActivityMap = new Map<string, { username: string; sessionsCount: number; totalDuration: number }>();
    
    allAttendance.forEach(attendance => {
      const userId = attendance.userId;
      const username = attendance.user.username;
      const duration = attendance.checkinTime && attendance.checkoutTime
        ? (attendance.checkoutTime.getTime() - attendance.checkinTime.getTime()) / (1000 * 60)
        : 0;

      if (!userActivityMap.has(userId)) {
        userActivityMap.set(userId, { username, sessionsCount: 0, totalDuration: 0 });
      }

      const userActivity = userActivityMap.get(userId)!;
      userActivity.sessionsCount++;
      userActivity.totalDuration += duration;
    });

    const mostActiveUsers = Array.from(userActivityMap.entries())
      .map(([userId, activity]) => ({
        userId,
        username: activity.username,
        sessionsCount: activity.sessionsCount,
        totalDuration: Math.round(activity.totalDuration)
      }))
      .sort((a, b) => b.sessionsCount - a.sessionsCount)
      .slice(0, 10);

    return {
      totalSessions,
      averageAttendanceRate: Math.round(averageAttendanceRate * 100) / 100,
      averageSessionDuration: Math.round(averageSessionDuration),
      mostActiveUsers,
      attendanceByContest: contestAttendanceRates
    };
  }

  /**
   * Track user activity automatically (called when user performs actions)
   */
  async trackUserActivity(userId: string, contestId?: string): Promise<void> {
    if (!contestId) {
      // Find active contest for the user
      const activeContest = await this.prisma.contest.findFirst({
        where: {
          status: 'RUNNING',
          contestUsers: {
            some: {
              userId: userId
            }
          }
        }
      });

      if (!activeContest) {
        return; // No active contest to track
      }

      contestId = activeContest.id;
    }

    // Update user's last active time
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastActive: new Date() }
    });

    // Check if user has attendance record for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await this.prisma.attendance.findFirst({
      where: {
        userId,
        contestId,
        checkinTime: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    if (!todayAttendance) {
      // Auto check-in user
      try {
        await this.checkIn({ contestId, userId });
      } catch (error) {
        // Ignore errors for auto check-in (user might not be registered)
        console.warn(`Auto check-in failed for user ${userId} in contest ${contestId}:`, error);
      }
    }
  }

  /**
   * Mark users as absent if they haven't checked in
   */
  async markAbsentUsers(contestId: string): Promise<number> {
    // Get all registered users for the contest
    const contestUsers = await this.prisma.contestUser.findMany({
      where: { contestId }
    });

    let markedAbsentCount = 0;

    for (const contestUser of contestUsers) {
      // Check if user has attendance record
      const attendance = await this.prisma.attendance.findUnique({
        where: {
          contestId_userId: {
            contestId,
            userId: contestUser.userId
          }
        }
      });

      if (!attendance) {
        // Create absent record
        await this.prisma.attendance.create({
          data: {
            contestId,
            userId: contestUser.userId,
            status: AttendanceStatus.ABSENT
          }
        });
        markedAbsentCount++;
      }
    }

    return markedAbsentCount;
  }

  /**
   * Calculate attendance rates for all contests
   */
  private async calculateContestAttendanceRates(): Promise<{
    contestId: string;
    contestName: string;
    attendanceRate: number;
    participantCount: number;
  }[]> {
    const contests = await this.prisma.contest.findMany({
      include: {
        _count: {
          select: {
            contestUsers: true
          }
        }
      }
    });

    const results = [];

    for (const contest of contests) {
      const presentCount = await this.prisma.attendance.count({
        where: {
          contestId: contest.id,
          status: AttendanceStatus.PRESENT
        }
      });

      const totalParticipants = contest._count.contestUsers;
      const attendanceRate = totalParticipants > 0 ? (presentCount / totalParticipants) * 100 : 0;

      results.push({
        contestId: contest.id,
        contestName: contest.name,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        participantCount: totalParticipants
      });
    }

    return results;
  }

  /**
   * Validate contest and user exist
   */
  private async validateContestAndUser(contestId: string, userId: string): Promise<void> {
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId }
    });

    if (!contest) {
      throw new Error(`Contest with id ${contestId} not found`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
  }
}

export const attendanceService = new AttendanceService();