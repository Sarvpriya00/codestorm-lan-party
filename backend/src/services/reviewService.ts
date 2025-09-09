import { PrismaClient, SubmissionStatus } from '@prisma/client';
import { leaderboardService } from './leaderboardService';

const prisma = new PrismaClient();

export interface CreateReviewRequest {
  submissionId: string;
  correct: boolean;
  scoreAwarded: number;
  remarks?: string | null;
}

export interface ReviewResult {
  id: string;
  submissionId: string;
  problemId: string;
  submittedById: string;
  reviewedById: string;
  timestamp: Date;
  correct: boolean;
  scoreAwarded: number;
  remarks?: string | null;
  submission: {
    id: string;
    status: SubmissionStatus;
    problem: {
      questionText: string;
      maxScore: number;
    };
  };
}

export interface UserScoreUpdate {
  userId: string;
  previousScore: number;
  newScore: number;
  previousProblemsSolved: number;
  newProblemsSolved: number;
}

export class ReviewService {
  /**
   * Create a review for a submission and update user scores
   */
  async createReview(
    reviewData: CreateReviewRequest,
    reviewedById: string
  ): Promise<{ review: ReviewResult; userUpdate: UserScoreUpdate }> {
    try {
      // Start a transaction to ensure data consistency
      const result = await prisma.$transaction(async (tx) => {
        // Get the submission with related data
        const submission = await tx.submission.findUnique({
          where: { id: reviewData.submissionId },
          include: {
            problem: {
              select: {
                id: true,
                questionText: true,
                maxScore: true,
              },
            },
            submittedBy: {
              select: {
                id: true,
                scored: true,
                problemsSolvedCount: true,
              },
            },
            contest: {
              select: {
                id: true,
              },
            },
          },
        });

        if (!submission) {
          throw new Error('Submission not found');
        }

        if (submission.status !== SubmissionStatus.UNDER_REVIEW) {
          throw new Error('Submission is not under review');
        }

        if (submission.reviewedById !== reviewedById) {
          throw new Error('Submission is not being reviewed by this judge');
        }

        // Validate score
        if (reviewData.scoreAwarded < 0 || reviewData.scoreAwarded > submission.problem.maxScore) {
          throw new Error(`Score must be between 0 and ${submission.problem.maxScore}`);
        }

        // Update submission status first
        const finalStatus = reviewData.correct ? SubmissionStatus.ACCEPTED : SubmissionStatus.REJECTED;
        await tx.submission.update({
          where: { id: reviewData.submissionId },
          data: {
            status: finalStatus,
            score: reviewData.scoreAwarded,
          },
        });

        // Create the review
        const review = await tx.review.create({
          data: {
            submissionId: reviewData.submissionId,
            problemId: submission.problemId,
            submittedById: submission.submittedById,
            reviewedById: reviewedById,
            correct: reviewData.correct,
            scoreAwarded: reviewData.scoreAwarded,
            remarks: reviewData.remarks,
          },
          include: {
            submission: {
              include: {
                problem: {
                  select: {
                    questionText: true,
                    maxScore: true,
                  },
                },
              },
            },
          },
        });

        // Update user scores and problem count
        const userUpdate = await this.updateUserScores(
          tx,
          submission.submittedById,
          submission.contestId,
          submission.problemId,
          reviewData.scoreAwarded,
          reviewData.correct,
          submission.submittedBy.scored,
          submission.submittedBy.problemsSolvedCount
        );

        // Create legacy ScoreEvent for backward compatibility if accepted
        if (reviewData.correct) {
          const contestProblem = await tx.contestProblem.findFirst({
            where: {
              contestId: submission.contestId,
              problemId: submission.problemId,
            },
          });

          if (contestProblem) {
            await tx.scoreEvent.create({
              data: {
                submissionId: submission.id,
                points: contestProblem.points,
                userId: submission.submittedById,
              },
            });
          }
        }

        return {
          review: {
            ...review,
            submission: {
              ...review.submission,
              status: finalStatus,
            },
          },
          userUpdate,
        };
      });

      // Update leaderboard after successful review
      try {
        await leaderboardService.onSubmissionReviewed(reviewData.submissionId);
      } catch (error) {
        console.error('Error updating leaderboard after review:', error);
        // Don't fail the review if leaderboard update fails
      }

      return result;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  /**
   * Update user scores and problem solved count
   */
  private async updateUserScores(
    tx: any,
    userId: string,
    contestId: string,
    problemId: string,
    scoreAwarded: number,
    correct: boolean,
    currentScore: number,
    currentProblemsSolved: number
  ): Promise<UserScoreUpdate> {
    let newScore = currentScore;
    let newProblemsSolved = currentProblemsSolved;

    if (correct) {
      // Get all accepted submissions for this user, contest, and problem
      // This will include the current submission since we updated its status to ACCEPTED
      const allAcceptedSubmissions = await tx.submission.findMany({
        where: {
          submittedById: userId,
          contestId: contestId,
          problemId: problemId,
          status: SubmissionStatus.ACCEPTED,
        },
        include: {
          review: true,
        },
        orderBy: {
          timestamp: 'asc', // Get them in chronological order
        },
      });

      // Calculate the best score for this problem
      const bestScore = Math.max(
        ...allAcceptedSubmissions.map((sub: any) => sub.review?.scoreAwarded || 0)
      );

      // Check if this is the first time solving this problem
      const isFirstSolve = allAcceptedSubmissions.length === 1;

      if (isFirstSolve) {
        // First time solving - add score and increment problem count
        newScore += scoreAwarded;
        newProblemsSolved += 1;
      } else {
        // Not first time - check if this is a better score
        // Find the previous best score (excluding current submission)
        const otherSubmissions = allAcceptedSubmissions.filter((sub: any) => 
          sub.review?.scoreAwarded !== scoreAwarded
        );
        
        if (otherSubmissions.length > 0) {
          const previousBestScore = Math.max(
            ...otherSubmissions.map((sub: any) => sub.review?.scoreAwarded || 0)
          );
          
          if (scoreAwarded > previousBestScore) {
            // New best score - replace the previous best
            newScore = newScore - previousBestScore + scoreAwarded;
          }
          // If not better, score stays the same
        } else {
          // This means all submissions have the same score, which is unusual
          // but we'll treat it as no change needed
        }
      }
    }

    // Update user record
    await tx.user.update({
      where: { id: userId },
      data: {
        scored: newScore,
        problemsSolvedCount: newProblemsSolved,
      },
    });

    // Update or create leaderboard entry
    await tx.leaderboard.upsert({
      where: {
        contestId_userId: {
          contestId: contestId,
          userId: userId,
        },
      },
      update: {
        score: newScore,
        problemsSolved: newProblemsSolved,
        lastSubmissionTime: new Date(),
      },
      create: {
        contestId: contestId,
        userId: userId,
        rank: 0, // Will be calculated separately
        score: newScore,
        problemsSolved: newProblemsSolved,
        lastSubmissionTime: new Date(),
      },
    });

    return {
      userId,
      previousScore: currentScore,
      newScore,
      previousProblemsSolved: currentProblemsSolved,
      newProblemsSolved,
    };
  }

  /**
   * Get review by submission ID
   */
  async getReviewBySubmissionId(submissionId: string): Promise<ReviewResult | null> {
    try {
      const review = await prisma.review.findUnique({
        where: { submissionId },
        include: {
          submission: {
            include: {
              problem: {
                select: {
                  questionText: true,
                  maxScore: true,
                },
              },
            },
          },
        },
      });

      return review;
    } catch (error) {
      console.error('Error fetching review:', error);
      throw new Error('Failed to fetch review');
    }
  }

  /**
   * Get all reviews by a specific judge
   */
  async getReviewsByJudge(judgeId: string, limit?: number): Promise<ReviewResult[]> {
    try {
      const reviews = await prisma.review.findMany({
        where: { reviewedById: judgeId },
        include: {
          submission: {
            include: {
              problem: {
                select: {
                  questionText: true,
                  maxScore: true,
                },
              },
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: limit,
      });

      return reviews;
    } catch (error) {
      console.error('Error fetching reviews by judge:', error);
      throw new Error('Failed to fetch reviews');
    }
  }

  /**
   * Get reviews for a specific user's submissions
   */
  async getReviewsForUser(userId: string, contestId?: string): Promise<ReviewResult[]> {
    try {
      const reviews = await prisma.review.findMany({
        where: {
          submittedById: userId,
          ...(contestId && {
            submission: {
              contestId: contestId,
            },
          }),
        },
        include: {
          submission: {
            include: {
              problem: {
                select: {
                  questionText: true,
                  maxScore: true,
                },
              },
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      return reviews;
    } catch (error) {
      console.error('Error fetching reviews for user:', error);
      throw new Error('Failed to fetch user reviews');
    }
  }

  /**
   * Get review statistics for a judge
   */
  async getJudgeStatistics(judgeId: string): Promise<{
    totalReviews: number;
    acceptedReviews: number;
    rejectedReviews: number;
    averageScore: number;
  }> {
    try {
      const reviews = await prisma.review.findMany({
        where: { reviewedById: judgeId },
        select: {
          correct: true,
          scoreAwarded: true,
        },
      });

      const totalReviews = reviews.length;
      const acceptedReviews = reviews.filter(r => r.correct).length;
      const rejectedReviews = totalReviews - acceptedReviews;
      const averageScore = totalReviews > 0 
        ? reviews.reduce((sum, r) => sum + r.scoreAwarded, 0) / totalReviews 
        : 0;

      return {
        totalReviews,
        acceptedReviews,
        rejectedReviews,
        averageScore: Math.round(averageScore * 100) / 100, // Round to 2 decimal places
      };
    } catch (error) {
      console.error('Error fetching judge statistics:', error);
      throw new Error('Failed to fetch judge statistics');
    }
  }

  /**
   * Recalculate leaderboard rankings for a contest
   */
  async recalculateLeaderboard(contestId: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // Get all leaderboard entries for the contest, ordered by score (desc) and last submission time (asc)
        const entries = await tx.leaderboard.findMany({
          where: { contestId },
          orderBy: [
            { score: 'desc' },
            { lastSubmissionTime: 'asc' },
          ],
        });

        // Update ranks
        for (let i = 0; i < entries.length; i++) {
          await tx.leaderboard.update({
            where: { id: entries[i].id },
            data: { rank: i + 1 },
          });
        }
      });
    } catch (error) {
      console.error('Error recalculating leaderboard:', error);
      throw new Error('Failed to recalculate leaderboard');
    }
  }
}

export const reviewService = new ReviewService();