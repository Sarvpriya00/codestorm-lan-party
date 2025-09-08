import { PrismaClient, ContestProblem, QuestionProblem } from '@prisma/client';

export interface AddProblemToContestRequest {
  contestId: string;
  problemId: string;
  order?: number;
  points: number;
}

export interface UpdateContestProblemRequest {
  order?: number;
  points?: number;
}

export interface ContestProblemWithDetails extends ContestProblem {
  problem: QuestionProblem;
}

export class ContestProblemService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient();
  }

  /**
   * Add a problem to a contest
   */
  async addProblemToContest(data: AddProblemToContestRequest): Promise<ContestProblem> {
    // Validate contest exists
    const contest = await this.prisma.contest.findUnique({
      where: { id: data.contestId }
    });

    if (!contest) {
      throw new Error(`Contest with id ${data.contestId} not found`);
    }

    // Validate problem exists
    const problem = await this.prisma.questionProblem.findUnique({
      where: { id: data.problemId }
    });

    if (!problem) {
      throw new Error(`Problem with id ${data.problemId} not found`);
    }

    // Check if problem is already in contest
    const existingAssociation = await this.prisma.contestProblem.findUnique({
      where: {
        contestId_problemId: {
          contestId: data.contestId,
          problemId: data.problemId
        }
      }
    });

    if (existingAssociation) {
      throw new Error('Problem is already associated with this contest');
    }

    // Validate points
    if (data.points <= 0) {
      throw new Error('Points must be greater than 0');
    }

    // If no order specified, set it to the next available order
    let order = data.order;
    if (order === undefined) {
      const maxOrder = await this.prisma.contestProblem.aggregate({
        where: { contestId: data.contestId },
        _max: { order: true }
      });
      order = (maxOrder._max.order || 0) + 1;
    }

    // Validate order is unique within contest
    if (order !== null) {
      const existingOrder = await this.prisma.contestProblem.findFirst({
        where: {
          contestId: data.contestId,
          order: order
        }
      });

      if (existingOrder) {
        throw new Error(`Order ${order} is already used in this contest`);
      }
    }

    return await this.prisma.contestProblem.create({
      data: {
        contestId: data.contestId,
        problemId: data.problemId,
        order: order,
        points: data.points
      }
    });
  }

  /**
   * Remove a problem from a contest
   */
  async removeProblemFromContest(contestId: string, problemId: string): Promise<void> {
    // Check if association exists
    const association = await this.prisma.contestProblem.findUnique({
      where: {
        contestId_problemId: {
          contestId,
          problemId
        }
      }
    });

    if (!association) {
      throw new Error('Problem is not associated with this contest');
    }

    // Check if there are submissions for this problem in this contest
    const submissionCount = await this.prisma.submission.count({
      where: {
        contestId,
        problemId
      }
    });

    if (submissionCount > 0) {
      throw new Error('Cannot remove problem with existing submissions');
    }

    await this.prisma.contestProblem.delete({
      where: {
        contestId_problemId: {
          contestId,
          problemId
        }
      }
    });
  }

  /**
   * Update contest-problem association
   */
  async updateContestProblem(
    contestId: string, 
    problemId: string, 
    data: UpdateContestProblemRequest
  ): Promise<ContestProblem> {
    // Check if association exists
    const existingAssociation = await this.prisma.contestProblem.findUnique({
      where: {
        contestId_problemId: {
          contestId,
          problemId
        }
      }
    });

    if (!existingAssociation) {
      throw new Error('Problem is not associated with this contest');
    }

    // Validate points if provided
    if (data.points !== undefined && data.points <= 0) {
      throw new Error('Points must be greater than 0');
    }

    // Validate order if provided
    if (data.order !== undefined && data.order !== null) {
      const existingOrder = await this.prisma.contestProblem.findFirst({
        where: {
          contestId,
          order: data.order,
          problemId: { not: problemId } // Exclude current problem
        }
      });

      if (existingOrder) {
        throw new Error(`Order ${data.order} is already used in this contest`);
      }
    }

    return await this.prisma.contestProblem.update({
      where: {
        contestId_problemId: {
          contestId,
          problemId
        }
      },
      data: {
        order: data.order,
        points: data.points
      }
    });
  }

  /**
   * Get all problems for a contest
   */
  async getContestProblems(contestId: string): Promise<ContestProblemWithDetails[]> {
    return await this.prisma.contestProblem.findMany({
      where: { contestId },
      include: {
        problem: true
      },
      orderBy: {
        order: 'asc'
      }
    });
  }

  /**
   * Get contest-problem association details
   */
  async getContestProblem(contestId: string, problemId: string): Promise<ContestProblemWithDetails | null> {
    return await this.prisma.contestProblem.findUnique({
      where: {
        contestId_problemId: {
          contestId,
          problemId
        }
      },
      include: {
        problem: true
      }
    });
  }

  /**
   * Reorder problems in a contest
   */
  async reorderContestProblems(contestId: string, problemOrders: { problemId: string; order: number }[]): Promise<void> {
    // Validate contest exists
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId }
    });

    if (!contest) {
      throw new Error(`Contest with id ${contestId} not found`);
    }

    // Validate all problems exist in the contest
    const existingProblems = await this.prisma.contestProblem.findMany({
      where: { contestId },
      select: { problemId: true }
    });

    const existingProblemIds = existingProblems.map(p => p.problemId);
    const providedProblemIds = problemOrders.map(p => p.problemId);

    for (const problemId of providedProblemIds) {
      if (!existingProblemIds.includes(problemId)) {
        throw new Error(`Problem ${problemId} is not associated with contest ${contestId}`);
      }
    }

    // Validate orders are unique and positive
    const orders = problemOrders.map(p => p.order);
    const uniqueOrders = new Set(orders);
    
    if (uniqueOrders.size !== orders.length) {
      throw new Error('Order values must be unique');
    }

    for (const order of orders) {
      if (order <= 0) {
        throw new Error('Order values must be greater than 0');
      }
    }

    // Update orders in a transaction
    await this.prisma.$transaction(async (tx) => {
      for (const { problemId, order } of problemOrders) {
        await tx.contestProblem.update({
          where: {
            contestId_problemId: {
              contestId,
              problemId
            }
          },
          data: { order }
        });
      }
    });
  }

  /**
   * Get contests that contain a specific problem
   */
  async getContestsForProblem(problemId: string): Promise<ContestProblem[]> {
    return await this.prisma.contestProblem.findMany({
      where: { problemId },
      include: {
        contest: true
      },
      orderBy: {
        contest: {
          startTime: 'desc'
        }
      }
    });
  }

  /**
   * Validate contest-problem constraints
   */
  async validateContestProblemConstraints(contestId: string, problemId: string): Promise<{
    canAdd: boolean;
    canRemove: boolean;
    canModify: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let canAdd = true;
    let canRemove = true;
    let canModify = true;

    // Check if contest exists
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId }
    });

    if (!contest) {
      reasons.push('Contest not found');
      return { canAdd: false, canRemove: false, canModify: false, reasons };
    }

    // Check if problem exists
    const problem = await this.prisma.questionProblem.findUnique({
      where: { id: problemId }
    });

    if (!problem) {
      reasons.push('Problem not found');
      canAdd = false;
    }

    // Check if problem is active
    if (problem && !problem.isActive) {
      reasons.push('Problem is not active');
      canAdd = false;
    }

    // Check if association already exists
    const existingAssociation = await this.prisma.contestProblem.findUnique({
      where: {
        contestId_problemId: {
          contestId,
          problemId
        }
      }
    });

    if (existingAssociation) {
      canAdd = false;
      reasons.push('Problem is already associated with this contest');
    } else {
      canRemove = false;
      canModify = false;
      reasons.push('Problem is not associated with this contest');
    }

    // Check for existing submissions
    if (existingAssociation) {
      const submissionCount = await this.prisma.submission.count({
        where: {
          contestId,
          problemId
        }
      });

      if (submissionCount > 0) {
        canRemove = false;
        reasons.push('Problem has existing submissions');
      }
    }

    // Check contest status
    if (contest.status === 'RUNNING' || contest.status === 'ENDED') {
      canAdd = false;
      canRemove = false;
      reasons.push('Cannot modify problems in running or ended contests');
    }

    return { canAdd, canRemove, canModify, reasons };
  }
}

export const contestProblemService = new ContestProblemService();