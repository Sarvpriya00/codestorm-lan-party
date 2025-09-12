import { PrismaClient, SubmissionStatus, Submission, Review, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface SubmissionFilters {
  contestId?: string;
  problemId?: string;
  submittedById?: string;
  status?: SubmissionStatus;
  reviewedById?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface CreateSubmissionData {
  problemId: string;
  contestId: string;
  submittedById: string;
  codeText: string;
  language?: string;
}

export interface UpdateSubmissionData {
  status?: SubmissionStatus;
  reviewedById?: string;
  score?: number;
}

export interface CreateReviewData {
  submissionId: string;
  problemId: string;
  submittedById: string;
  reviewedById: string;
  correct: boolean;
  scoreAwarded: number;
  remarks?: string;
}

export class SubmissionService {
  /**
   * Create a new submission
   */
  async createSubmission(data: CreateSubmissionData): Promise<Submission> {
    // Validate that the problem exists in the contest
    const contestProblem = await prisma.contestProblem.findFirst({
      where: {
        contestId: data.contestId,
        problemId: data.problemId
      },
      include: {
        contest: true,
        problem: true
      }
    });

    if (!contestProblem) {
      throw new Error('Problem not found in this contest');
    }

    // Validate that the user is enrolled in the contest
    const contestUser = await prisma.contestUser.findFirst({
      where: {
        contestId: data.contestId,
        userId: data.submittedById,
        status: 'ACTIVE'
      }
    });

    if (!contestUser) {
      throw new Error('User is not enrolled in this contest or participation is not active');
    }

    // Check if contest is running
    if (contestProblem.contest.status !== 'RUNNING') {
      throw new Error('Contest is not currently running');
    }

    const submission = await prisma.submission.create({
      data: {
        problemId: data.problemId,
        contestId: data.contestId,
        submittedById: data.submittedById,
        codeText: data.codeText,
        status: SubmissionStatus.PENDING,
        score: 0,
        timestamp: new Date(),
        language: data.language
      },
      include: {
        problem: {
          select: {
            questionText: true,
            difficultyLevel: true,
            maxScore: true
          }
        },
        contest: {
          select: {
            name: true,
            status: true
          }
        },
        submittedBy: {
          select: {
            username: true,
            displayName: true
          }
        }
      }
    });

    return submission;
  }

  /**
   * Get submissions with filtering and pagination
   */
  async getSubmissions(
    filters: SubmissionFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    submissions: Submission[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const where: Prisma.SubmissionWhereInput = {};

    if (filters.contestId) {
      where.contestId = filters.contestId;
    }
    if (filters.problemId) {
      where.problemId = filters.problemId;
    }
    if (filters.submittedById) {
      where.submittedById = filters.submittedById;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.reviewedById) {
      where.reviewedById = filters.reviewedById;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.timestamp = {};
      if (filters.dateFrom) {
        where.timestamp.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.timestamp.lte = filters.dateTo;
      }
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          problem: {
            select: {
              id: true,
              questionText: true,
              difficultyLevel: true,
              maxScore: true,
              tags: true
            }
          },
          contest: {
            select: {
              id: true,
              name: true,
              status: true
            }
          },
          submittedBy: {
            select: {
              username: true,
              displayName: true
            }
          },
          reviewedBy: {
            select: {
              username: true,
              displayName: true
            }
          },
          review: {
            select: {
              correct: true,
              scoreAwarded: true,
              remarks: true,
              timestamp: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.submission.count({ where })
    ]);

    return {
      submissions,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get a single submission by ID
   */
  async getSubmissionById(id: string): Promise<Submission | null> {
    return await prisma.submission.findUnique({
      where: { id },
      include: {
        problem: {
          select: {
            id: true,
            questionText: true,
            difficultyLevel: true,
            maxScore: true,
            tags: true
          }
        },
        contest: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        submittedBy: {
          select: {
            username: true,
            displayName: true
          }
        },
        reviewedBy: {
          select: {
            username: true,
            displayName: true
          }
        },
        review: true
      }
    });
  }

  /**
   * Update submission status and assign judge
   */
  async updateSubmission(id: string, data: UpdateSubmissionData): Promise<Submission> {
    const submission = await prisma.submission.findUnique({
      where: { id }
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    return await prisma.submission.update({
      where: { id },
      data: {
        ...data,
        ...(data.status && { status: data.status }),
        ...(data.reviewedById && { reviewedById: data.reviewedById }),
        ...(data.score !== undefined && { score: data.score })
      },
      include: {
        problem: true,
        contest: true,
        submittedBy: true,
        reviewedBy: true,
        review: true
      }
    });
  }

  /**
   * Assign a submission to a judge for review
   */
  async assignSubmissionToJudge(submissionId: string, judgeId: string): Promise<Submission> {
    // Check if submission is available for assignment
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    if (submission.reviewedById) {
      throw new Error('Submission is already assigned to a judge');
    }

    if (submission.status !== SubmissionStatus.PENDING) {
      throw new Error('Submission is not available for assignment');
    }

    return await this.updateSubmission(submissionId, {
      status: SubmissionStatus.UNDER_REVIEW,
      reviewedById: judgeId
    });
  }

  /**
   * Get pending submissions for judge queue
   */
  async getPendingSubmissions(contestId?: string): Promise<Submission[]> {
    const where: Prisma.SubmissionWhereInput = {
      status: SubmissionStatus.PENDING,
      reviewedById: null
    };

    if (contestId) {
      where.contestId = contestId;
    }

    return await prisma.submission.findMany({
      where,
      include: {
        problem: {
          select: {
            questionText: true,
            difficultyLevel: true,
            maxScore: true
          }
        },
        contest: {
          select: {
            name: true,
            status: true
          }
        },
        submittedBy: {
          select: {
            username: true,
            displayName: true
          }
        }
      },
      orderBy: {
        timestamp: 'asc' // FIFO queue
      }
    });
  }

  /**
   * Get submissions assigned to a specific judge
   */
  async getJudgeAssignedSubmissions(judgeId: string): Promise<Submission[]> {
    return await prisma.submission.findMany({
      where: {
        reviewedById: judgeId,
        status: SubmissionStatus.UNDER_REVIEW
      },
      include: {
        problem: {
          select: {
            questionText: true,
            difficultyLevel: true,
            maxScore: true
          }
        },
        contest: {
          select: {
            name: true,
            status: true
          }
        },
        submittedBy: {
          select: {
            username: true,
            displayName: true
          }
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });
  }

  /**
   * Create a review for a submission
   */
  async createReview(data: CreateReviewData): Promise<Review> {
    // Verify the submission exists and is under review
    const submission = await prisma.submission.findUnique({
      where: { id: data.submissionId },
      include: {
        problem: true
      }
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    if (submission.status !== SubmissionStatus.UNDER_REVIEW) {
      throw new Error('Submission is not under review');
    }

    if (submission.reviewedById !== data.reviewedById) {
      throw new Error('Submission is not assigned to this judge');
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        submissionId: data.submissionId,
        problemId: data.problemId,
        submittedById: data.submittedById,
        reviewedById: data.reviewedById,
        correct: data.correct,
        scoreAwarded: data.scoreAwarded,
        remarks: data.remarks,
        timestamp: new Date()
      },
      include: {
        submission: true,
        problem: true,
        submittedBy: true,
        reviewedBy: true
      }
    });

    // Update submission status and score
    await prisma.submission.update({
      where: { id: data.submissionId },
      data: {
        status: data.correct ? SubmissionStatus.ACCEPTED : SubmissionStatus.REJECTED,
        score: data.scoreAwarded
      }
    });

    // Update user's total score and problems solved count if accepted
    if (data.correct) {
      await prisma.user.update({
        where: { id: data.submittedById },
        data: {
          scored: {
            increment: data.scoreAwarded
          },
          problemsSolvedCount: {
            increment: 1
          }
        }
      });
    }

    return review;
  }

  /**
   * Get submission statistics for a contest
   */
  async getSubmissionStats(contestId: string): Promise<{
    total: number;
    pending: number;
    underReview: number;
    accepted: number;
    rejected: number;
    averageScore: number;
  }> {
    const [stats, avgScore] = await Promise.all([
      prisma.submission.groupBy({
        by: ['status'],
        where: { contestId },
        _count: {
          id: true
        }
      }),
      prisma.submission.aggregate({
        where: { 
          contestId,
          status: SubmissionStatus.ACCEPTED
        },
        _avg: {
          score: true
        }
      })
    ]);

    const result = {
      total: 0,
      pending: 0,
      underReview: 0,
      accepted: 0,
      rejected: 0,
      averageScore: avgScore._avg.score || 0
    };

    stats.forEach(stat => {
      result.total += stat._count.id;
      switch (stat.status) {
        case SubmissionStatus.PENDING:
          result.pending = stat._count.id;
          break;
        case SubmissionStatus.UNDER_REVIEW:
          result.underReview = stat._count.id;
          break;
        case SubmissionStatus.ACCEPTED:
          result.accepted = stat._count.id;
          break;
        case SubmissionStatus.REJECTED:
          result.rejected = stat._count.id;
          break;
      }
    });

    return result;
  }

  /**
   * Get user's submission history for a contest
   */
  async getUserSubmissionHistory(
    userId: string, 
    contestId?: string
  ): Promise<Submission[]> {
    const where: Prisma.SubmissionWhereInput = {
      submittedById: userId
    };

    if (contestId) {
      where.contestId = contestId;
    }

    return await prisma.submission.findMany({
      where,
      include: {
        problem: {
          select: {
            questionText: true,
            difficultyLevel: true,
            maxScore: true
          }
        },
        contest: {
          select: {
            name: true,
            status: true
          }
        },
        review: {
          select: {
            correct: true,
            scoreAwarded: true,
            remarks: true,
            timestamp: true,
            reviewedBy: {
              select: {
                username: true,
                displayName: true
              }
            }
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
  }
}