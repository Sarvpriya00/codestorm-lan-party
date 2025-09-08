import { PrismaClient, Contest, ContestStatus } from '@prisma/client';

export interface CreateContestRequest {
  name: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  status?: ContestStatus;
}

export interface UpdateContestRequest {
  name?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  status?: ContestStatus;
}

export interface ContestFilters {
  status?: ContestStatus;
  startTimeAfter?: Date;
  startTimeBefore?: Date;
  endTimeAfter?: Date;
  endTimeBefore?: Date;
}

export class ContestService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient();
  }

  /**
   * Create a new contest
   */
  async createContest(data: CreateContestRequest): Promise<Contest> {
    // Validate contest data
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Contest name is required');
    }

    // Validate time constraints
    if (data.startTime && data.endTime && data.startTime >= data.endTime) {
      throw new Error('Contest start time must be before end time');
    }

    return await this.prisma.contest.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim(),
        startTime: data.startTime,
        endTime: data.endTime,
        status: data.status || ContestStatus.PLANNED
      }
    });
  }

  /**
   * Update an existing contest
   */
  async updateContest(contestId: string, data: UpdateContestRequest): Promise<Contest> {
    // Validate contest exists
    const existingContest = await this.prisma.contest.findUnique({
      where: { id: contestId }
    });

    if (!existingContest) {
      throw new Error(`Contest with id ${contestId} not found`);
    }

    // Validate time constraints if both times are provided
    const newStartTime = data.startTime || existingContest.startTime;
    const newEndTime = data.endTime || existingContest.endTime;
    
    if (newStartTime && newEndTime && newStartTime >= newEndTime) {
      throw new Error('Contest start time must be before end time');
    }

    // Validate status transitions
    if (data.status) {
      this.validateStatusTransition(existingContest.status, data.status);
    }

    return await this.prisma.contest.update({
      where: { id: contestId },
      data: {
        name: data.name?.trim(),
        description: data.description?.trim(),
        startTime: data.startTime,
        endTime: data.endTime,
        status: data.status
      }
    });
  }

  /**
   * Get contest by ID
   */
  async getContestById(contestId: string): Promise<Contest | null> {
    return await this.prisma.contest.findUnique({
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
        },
        contestProblems: {
          include: {
            problem: {
              select: {
                id: true,
                questionText: true,
                difficultyLevel: true,
                maxScore: true
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        },
        _count: {
          select: {
            contestUsers: true,
            submissions: true
          }
        }
      }
    });
  }

  /**
   * Get contests with filters
   */
  async getContests(filters: ContestFilters = {}): Promise<Contest[]> {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startTimeAfter || filters.startTimeBefore) {
      where.startTime = {};
      if (filters.startTimeAfter) {
        where.startTime.gte = filters.startTimeAfter;
      }
      if (filters.startTimeBefore) {
        where.startTime.lte = filters.startTimeBefore;
      }
    }

    if (filters.endTimeAfter || filters.endTimeBefore) {
      where.endTime = {};
      if (filters.endTimeAfter) {
        where.endTime.gte = filters.endTimeAfter;
      }
      if (filters.endTimeBefore) {
        where.endTime.lte = filters.endTimeBefore;
      }
    }

    return await this.prisma.contest.findMany({
      where,
      include: {
        _count: {
          select: {
            contestUsers: true,
            submissions: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    });
  }

  /**
   * Delete a contest
   */
  async deleteContest(contestId: string): Promise<void> {
    // Validate contest exists
    const existingContest = await this.prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        _count: {
          select: {
            submissions: true,
            contestUsers: true
          }
        }
      }
    });

    if (!existingContest) {
      throw new Error(`Contest with id ${contestId} not found`);
    }

    // Prevent deletion of contests with submissions or participants
    if (existingContest._count.submissions > 0) {
      throw new Error('Cannot delete contest with existing submissions');
    }

    if (existingContest._count.contestUsers > 0) {
      throw new Error('Cannot delete contest with registered participants');
    }

    // Only allow deletion of PLANNED contests
    if (existingContest.status !== ContestStatus.PLANNED) {
      throw new Error('Only planned contests can be deleted');
    }

    await this.prisma.contest.delete({
      where: { id: contestId }
    });
  }

  /**
   * Update contest status with validation
   */
  async updateContestStatus(contestId: string, newStatus: ContestStatus): Promise<Contest> {
    const existingContest = await this.prisma.contest.findUnique({
      where: { id: contestId }
    });

    if (!existingContest) {
      throw new Error(`Contest with id ${contestId} not found`);
    }

    this.validateStatusTransition(existingContest.status, newStatus);

    return await this.prisma.contest.update({
      where: { id: contestId },
      data: { status: newStatus }
    });
  }

  /**
   * Get active contests (RUNNING status)
   */
  async getActiveContests(): Promise<Contest[]> {
    return await this.getContests({ status: ContestStatus.RUNNING });
  }

  /**
   * Get upcoming contests (PLANNED status with future start time)
   */
  async getUpcomingContests(): Promise<Contest[]> {
    return await this.prisma.contest.findMany({
      where: {
        status: ContestStatus.PLANNED,
        startTime: {
          gt: new Date()
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });
  }

  /**
   * Validate contest status transitions
   */
  private validateStatusTransition(currentStatus: ContestStatus, newStatus: ContestStatus): void {
    const validTransitions: Record<ContestStatus, ContestStatus[]> = {
      [ContestStatus.PLANNED]: [ContestStatus.RUNNING, ContestStatus.ARCHIVED],
      [ContestStatus.RUNNING]: [ContestStatus.ENDED],
      [ContestStatus.ENDED]: [ContestStatus.ARCHIVED],
      [ContestStatus.ARCHIVED]: [] // No transitions from archived
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }
}

export const contestService = new ContestService();