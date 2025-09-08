import { PrismaClient, SubmissionStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface QueueSubmission {
  id: string;
  problemId: string;
  contestId: string;
  submittedById: string;
  timestamp: Date;
  status: SubmissionStatus;
  codeText: string;
  problem: {
    id: string;
    questionText: string;
    difficultyLevel: string;
    maxScore: number;
  };
  contest: {
    id: string;
    name: string;
  };
  submittedBy: {
    username: string;
  };
}

export interface ClaimSubmissionResult {
  success: boolean;
  submission?: QueueSubmission;
  message: string;
}

export class JudgeQueueService {
  /**
   * Get all pending submissions for the judge queue
   * Implements fair distribution by ordering by timestamp
   */
  async getJudgeQueue(judgeId?: string): Promise<QueueSubmission[]> {
    try {
      const pendingSubmissions = await prisma.submission.findMany({
        where: { 
          status: SubmissionStatus.PENDING,
          // Exclude submissions already being reviewed by other judges
          reviewedById: null
        },
        select: {
          id: true,
          problemId: true,
          contestId: true,
          submittedById: true,
          timestamp: true,
          status: true,
          codeText: true,
          problem: {
            select: {
              id: true,
              questionText: true,
              difficultyLevel: true,
              maxScore: true,
            },
          },
          contest: {
            select: {
              id: true,
              name: true,
            },
          },
          submittedBy: {
            select: {
              username: true,
            },
          },
        },
        orderBy: {
          timestamp: 'asc', // First-in-first-out for fairness
        },
      });

      return pendingSubmissions;
    } catch (error) {
      console.error('Error fetching judge queue:', error);
      throw new Error('Failed to fetch judge queue');
    }
  }

  /**
   * Claim a submission for review by a specific judge
   * Prevents conflicts by atomically updating the submission
   */
  async claimSubmission(submissionId: string, judgeId: string): Promise<ClaimSubmissionResult> {
    try {
      // First check if submission exists and is available
      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
          problem: {
            select: {
              id: true,
              questionText: true,
              difficultyLevel: true,
              maxScore: true,
            },
          },
          contest: {
            select: {
              id: true,
              name: true,
            },
          },
          submittedBy: {
            select: {
              username: true,
            },
          },
        },
      });

      if (!submission) {
        return {
          success: false,
          message: 'Submission not found',
        };
      }

      if (submission.reviewedById && submission.reviewedById !== judgeId) {
        return {
          success: false,
          message: 'Submission is already being reviewed by another judge',
        };
      }

      if (submission.status !== SubmissionStatus.PENDING) {
        return {
          success: false,
          message: 'Submission is no longer pending',
        };
      }

      // Atomically claim the submission
      const updatedSubmission = await prisma.submission.update({
        where: { 
          id: submissionId,
          status: SubmissionStatus.PENDING,
          reviewedById: null, // Ensure it's not already claimed
        },
        data: {
          status: SubmissionStatus.UNDER_REVIEW,
          reviewedById: judgeId,
        },
        include: {
          problem: {
            select: {
              id: true,
              questionText: true,
              difficultyLevel: true,
              maxScore: true,
            },
          },
          contest: {
            select: {
              id: true,
              name: true,
            },
          },
          submittedBy: {
            select: {
              username: true,
            },
          },
        },
      });

      return {
        success: true,
        submission: updatedSubmission,
        message: 'Submission claimed successfully',
      };
    } catch (error) {
      console.error('Error claiming submission:', error);
      
      // Handle the case where the update failed due to concurrent access
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return {
          success: false,
          message: 'Submission was claimed by another judge',
        };
      }
      
      throw new Error('Failed to claim submission');
    }
  }

  /**
   * Get submissions currently being reviewed by a specific judge
   */
  async getJudgeActiveSubmissions(judgeId: string): Promise<QueueSubmission[]> {
    try {
      const activeSubmissions = await prisma.submission.findMany({
        where: {
          reviewedById: judgeId,
          status: SubmissionStatus.UNDER_REVIEW,
        },
        select: {
          id: true,
          problemId: true,
          contestId: true,
          submittedById: true,
          timestamp: true,
          status: true,
          codeText: true,
          problem: {
            select: {
              id: true,
              questionText: true,
              difficultyLevel: true,
              maxScore: true,
            },
          },
          contest: {
            select: {
              id: true,
              name: true,
            },
          },
          submittedBy: {
            select: {
              username: true,
            },
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      return activeSubmissions;
    } catch (error) {
      console.error('Error fetching judge active submissions:', error);
      throw new Error('Failed to fetch active submissions');
    }
  }

  /**
   * Release a submission back to the queue (if judge can't complete review)
   */
  async releaseSubmission(submissionId: string, judgeId: string): Promise<boolean> {
    try {
      const updatedSubmission = await prisma.submission.updateMany({
        where: {
          id: submissionId,
          reviewedById: judgeId,
          status: SubmissionStatus.UNDER_REVIEW,
        },
        data: {
          status: SubmissionStatus.PENDING,
          reviewedById: null,
        },
      });

      return updatedSubmission.count > 0;
    } catch (error) {
      console.error('Error releasing submission:', error);
      throw new Error('Failed to release submission');
    }
  }

  /**
   * Get queue statistics for monitoring
   */
  async getQueueStatistics(): Promise<{
    pendingCount: number;
    underReviewCount: number;
    totalSubmissions: number;
  }> {
    try {
      const [pendingCount, underReviewCount, totalSubmissions] = await Promise.all([
        prisma.submission.count({
          where: { status: SubmissionStatus.PENDING },
        }),
        prisma.submission.count({
          where: { status: SubmissionStatus.UNDER_REVIEW },
        }),
        prisma.submission.count(),
      ]);

      return {
        pendingCount,
        underReviewCount,
        totalSubmissions,
      };
    } catch (error) {
      console.error('Error fetching queue statistics:', error);
      throw new Error('Failed to fetch queue statistics');
    }
  }
}

export const judgeQueueService = new JudgeQueueService();