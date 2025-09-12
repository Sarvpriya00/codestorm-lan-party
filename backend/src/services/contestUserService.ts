import { PrismaClient, ContestUser, ParticipantStatus, ContestStatus, Prisma } from '@prisma/client';

export interface JoinContestRequest {
  contestId: string;
  userId: string;
}

export interface UpdateParticipantStatusRequest {
  status: ParticipantStatus;
  reason?: string;
}

export interface ContestUserWithDetails extends ContestUser {
  user: {
    id: string;
    username: string;
    displayName: string | null;
    scored: number;
    problemsSolvedCount: number;
  };
  contest: {
    id: string;
    name: string;
    status: ContestStatus;
    startTime: Date | null;
    endTime: Date | null;
  };
}

export interface ParticipantFilters {
  contestId?: string;
  userId?: string;
  status?: ParticipantStatus;
  joinedAfter?: Date;
  joinedBefore?: Date;
}

export class ContestUserService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient();
  }

  /**
   * Join a contest as a participant
   */
  async joinContest(data: JoinContestRequest): Promise<ContestUser> {
    // Validate contest exists
    const contest = await this.prisma.contest.findUnique({
      where: { id: data.contestId }
    });

    if (!contest) {
      throw new Error(`Contest with id ${data.contestId} not found`);
    }

    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId }
    });

    if (!user) {
      throw new Error(`User with id ${data.userId} not found`);
    }

    // Check if user is already registered for this contest
    const existingRegistration = await this.prisma.contestUser.findUnique({
      where: {
        contestId_userId: {
          contestId: data.contestId,
          userId: data.userId
        }
      }
    });

    if (existingRegistration) {
      throw new Error('User is already registered for this contest');
    }

    // Validate contest eligibility
    await this.validateContestEligibility(data.contestId, data.userId);

    return await this.prisma.contestUser.create({
      data: {
        contestId: data.contestId,
        userId: data.userId,
        status: ParticipantStatus.ACTIVE
      }
    });
  }

  /**
   * Leave a contest (withdraw participation)
   */
  async leaveContest(contestId: string, userId: string): Promise<ContestUser> {
    // Check if user is registered for this contest
    const registration = await this.prisma.contestUser.findUnique({
      where: {
        contestId_userId: {
          contestId,
          userId
        }
      }
    });

    if (!registration) {
      throw new Error('User is not registered for this contest');
    }

    // Check if contest allows withdrawal
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId }
    });

    if (contest?.status === ContestStatus.ENDED || contest?.status === ContestStatus.ARCHIVED) {
      throw new Error('Cannot withdraw from ended or archived contests');
    }

    // Check if user has submissions
    const submissionCount = await this.prisma.submission.count({
      where: {
        contestId,
        submittedById: userId
      }
    });

    if (submissionCount > 0) {
      // Don't delete, just mark as withdrawn
      return await this.prisma.contestUser.update({
        where: {
          contestId_userId: {
            contestId,
            userId
          }
        },
        data: {
          status: ParticipantStatus.WITHDRAWN
        }
      });
    } else {
      // Can safely delete if no submissions
      await this.prisma.contestUser.delete({
        where: {
          contestId_userId: {
            contestId,
            userId
          }
        }
      });

      // Return the deleted record for consistency
      return registration;
    }
  }

  /**
   * Update participant status (admin only)
   */
  async updateParticipantStatus(
    contestId: string, 
    userId: string, 
    data: UpdateParticipantStatusRequest
  ): Promise<ContestUser> {
    // Check if user is registered for this contest
    const registration = await this.prisma.contestUser.findUnique({
      where: {
        contestId_userId: {
          contestId,
          userId
        }
      }
    });

    if (!registration) {
      throw new Error('User is not registered for this contest');
    }

    // Validate status transition
    this.validateStatusTransition(registration.status, data.status);

    return await this.prisma.contestUser.update({
      where: {
        contestId_userId: {
          contestId,
          userId
        }
      },
      data: {
        status: data.status
      }
    });
  }

  /**
   * Get contest participants with filters
   */
  async getContestParticipants(contestId: string, filters: Omit<ParticipantFilters, 'contestId'> = {}): Promise<ContestUserWithDetails[]> {
    const where: Prisma.ContestUserWhereInput = { contestId };

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.joinedAfter || filters.joinedBefore) {
      where.joinedAt = {};
      if (filters.joinedAfter) {
        where.joinedAt.gte = filters.joinedAfter;
      }
      if (filters.joinedBefore) {
        where.joinedAt.lte = filters.joinedBefore;
      }
    }

    return await this.prisma.contestUser.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            scored: true,
            problemsSolvedCount: true
          }
        },
        contest: {
          select: {
            id: true,
            name: true,
            status: true,
            startTime: true,
            endTime: true
          }
        }
      },
      orderBy: {
        joinedAt: 'asc'
      }
    });
  }

  /**
   * Get user's contest participations
   */
  async getUserContests(userId: string, filters: Omit<ParticipantFilters, 'userId'> = {}): Promise<ContestUserWithDetails[]> {
    const where: Prisma.ContestUserWhereInput = { userId };

    if (filters.contestId) {
      where.contestId = filters.contestId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.joinedAfter || filters.joinedBefore) {
      where.joinedAt = {};
      if (filters.joinedAfter) {
        where.joinedAt.gte = filters.joinedAfter;
      }
      if (filters.joinedBefore) {
        where.joinedAt.lte = filters.joinedBefore;
      }
    }

    return await this.prisma.contestUser.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            scored: true,
            problemsSolvedCount: true
          }
        },
        contest: {
          select: {
            id: true,
            name: true,
            status: true,
            startTime: true,
            endTime: true
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      }
    });
  }

  /**
   * Get specific contest-user registration
   */
  async getContestUser(contestId: string, userId: string): Promise<ContestUserWithDetails | null> {
    return await this.prisma.contestUser.findUnique({
      where: {
        contestId_userId: {
          contestId,
          userId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            scored: true,
            problemsSolvedCount: true
          }
        },
        contest: {
          select: {
            id: true,
            name: true,
            status: true,
            startTime: true,
            endTime: true
          }
        }
      }
    });
  }

  /**
   * Get contest participation statistics
   */
  async getContestParticipationStats(contestId: string): Promise<{
    totalParticipants: number;
    activeParticipants: number;
    withdrawnParticipants: number;
    disqualifiedParticipants: number;
    participantsWithSubmissions: number;
  }> {
    const [
      totalParticipants,
      activeParticipants,
      withdrawnParticipants,
      disqualifiedParticipants,
      participantsWithSubmissions
    ] = await Promise.all([
      this.prisma.contestUser.count({ where: { contestId } }),
      this.prisma.contestUser.count({ where: { contestId, status: ParticipantStatus.ACTIVE } }),
      this.prisma.contestUser.count({ where: { contestId, status: ParticipantStatus.WITHDRAWN } }),
      this.prisma.contestUser.count({ where: { contestId, status: ParticipantStatus.DISQUALIFIED } }),
      this.prisma.contestUser.count({
        where: {
          contestId,
          user: {
            submissions: {
              some: {
                contestId
              }
            }
          }
        }
      })
    ]);

    return {
      totalParticipants,
      activeParticipants,
      withdrawnParticipants,
      disqualifiedParticipants,
      participantsWithSubmissions
    };
  }

  /**
   * Bulk update participant statuses
   */
  async bulkUpdateParticipantStatus(
    contestId: string, 
    userIds: string[], 
    status: ParticipantStatus
  ): Promise<number> {
    // Validate contest exists
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId }
    });

    if (!contest) {
      throw new Error(`Contest with id ${contestId} not found`);
    }

    // Validate all users are registered
    const registrations = await this.prisma.contestUser.findMany({
      where: {
        contestId,
        userId: { in: userIds }
      }
    });

    if (registrations.length !== userIds.length) {
      throw new Error('Some users are not registered for this contest');
    }

    // Update statuses
    const result = await this.prisma.contestUser.updateMany({
      where: {
        contestId,
        userId: { in: userIds }
      },
      data: { status }
    });

    return result.count;
  }

  /**
   * Validate contest eligibility for a user
   */
  private async validateContestEligibility(contestId: string, userId: string): Promise<void> {
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId }
    });

    if (!contest) {
      throw new Error('Contest not found');
    }

    // Check if contest is in a joinable state
    if (contest.status === ContestStatus.ENDED || contest.status === ContestStatus.ARCHIVED) {
      throw new Error('Cannot join ended or archived contests');
    }

    // Check if contest has started (optional - depends on business rules)
    if (contest.status === ContestStatus.RUNNING && contest.startTime && new Date() > contest.startTime) {
      // Allow joining running contests for now, but could be restricted
      // throw new Error('Cannot join contests that have already started');
    }

    // Additional eligibility checks can be added here
    // e.g., user role restrictions, contest capacity limits, etc.
  }

  /**
   * Validate participant status transitions
   */
  private validateStatusTransition(currentStatus: ParticipantStatus, newStatus: ParticipantStatus): void {
    const validTransitions: Record<ParticipantStatus, ParticipantStatus[]> = {
      [ParticipantStatus.ACTIVE]: [ParticipantStatus.WITHDRAWN, ParticipantStatus.DISQUALIFIED],
      [ParticipantStatus.WITHDRAWN]: [ParticipantStatus.ACTIVE], // Allow re-joining
      [ParticipantStatus.DISQUALIFIED]: [] // No transitions from disqualified
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  /**
   * Check if user can join a contest
   */
  async canUserJoinContest(contestId: string, userId: string): Promise<{
    canJoin: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let canJoin = true;

    try {
      await this.validateContestEligibility(contestId, userId);
    } catch (error) {
      canJoin = false;
      if (error instanceof Error) {
        reasons.push(error.message);
      }
    }

    // Check if already registered
    const existingRegistration = await this.prisma.contestUser.findUnique({
      where: {
        contestId_userId: {
          contestId,
          userId
        }
      }
    });

    if (existingRegistration) {
      canJoin = false;
      reasons.push('User is already registered for this contest');
    }

    return { canJoin, reasons };
  }
}

export const contestUserService = new ContestUserService();