import { PrismaClient, Prisma } from '@prisma/client';
import { broadcastMessage } from './websocketService';

const prisma = new PrismaClient();

export interface LeaderboardEntry {
  contestId: string;
  userId: string;
  username: string;
  displayName?: string | null;
  rank: number;
  score: number;
  problemsSolved: number;
  lastSubmissionTime?: Date | null;
}

export interface LeaderboardFilters {
  limit?: number;
  offset?: number;
  userId?: string;
}

export interface LeaderboardUpdate {
  contestId: string;
  userId: string;
  newRank: number;
  oldRank?: number;
  newScore: number;
  oldScore: number;
}

export interface GlobalLeaderboardEntry {
  userId: string;
  username: string;
  displayName?: string | null;
  totalScore: number;
  totalProblemsSolved: number;
  contestsParticipated: number;
  averageRank: number;
}

export class LeaderboardService {
  /**
   * Calculate and update leaderboard for a specific contest
   */
  async updateContestLeaderboard(contestId: string): Promise<LeaderboardEntry[]> {
    // Get all participants with their scores and submission data
    const participants = await prisma.user.findMany({
      where: {
        contestUsers: {
          some: {
            contestId,
            status: 'ACTIVE'
          }
        },
        submissions: {
          some: {
            contestId,
            status: 'ACCEPTED'
          }
        }
      },
      include: {
        submissions: {
          where: {
            contestId,
            status: 'ACCEPTED'
          },
          include: {
            review: true
          },
          orderBy: {
            timestamp: 'desc'
          }
        }
      }
    });

    // Calculate scores and rankings
    const leaderboardData = participants.map(user => {
      const acceptedSubmissions = user.submissions.filter(s => s.status === 'ACCEPTED');
      
      // Calculate total score from reviews
      const totalScore = acceptedSubmissions.reduce((sum, submission) => {
        return sum + (submission.review?.scoreAwarded || 0);
      }, 0);

      // Count unique problems solved
      const problemsSolved = new Set(acceptedSubmissions.map(s => s.problemId)).size;

      // Get last submission time
      const lastSubmissionTime = acceptedSubmissions.length > 0 
        ? acceptedSubmissions[0].timestamp 
        : null;

      return {
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        score: totalScore,
        problemsSolved,
        lastSubmissionTime
      };
    });

    // Sort by score (descending), then by last submission time (ascending for tie-breaking)
    leaderboardData.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score; // Higher score first
      }
      
      // If scores are equal, earlier submission wins
      if (a.lastSubmissionTime && b.lastSubmissionTime) {
        return a.lastSubmissionTime.getTime() - b.lastSubmissionTime.getTime();
      }
      
      // If one has no submissions, the one with submissions wins
      if (a.lastSubmissionTime && !b.lastSubmissionTime) return -1;
      if (!a.lastSubmissionTime && b.lastSubmissionTime) return 1;
      
      return 0;
    });

    // Assign ranks and update database
    const leaderboardEntries: LeaderboardEntry[] = [];
    const updates: LeaderboardUpdate[] = [];

    for (let i = 0; i < leaderboardData.length; i++) {
      const participant = leaderboardData[i];
      const rank = i + 1;

      // Get existing leaderboard entry
      const existingEntry = await prisma.leaderboard.findUnique({
        where: {
          contestId_userId: {
            contestId,
            userId: participant.userId
          }
        }
      });

      const oldRank = existingEntry?.rank;
      const oldScore = existingEntry?.score || 0;

      // Update or create leaderboard entry
      const leaderboardEntry = await prisma.leaderboard.upsert({
        where: {
          contestId_userId: {
            contestId,
            userId: participant.userId
          }
        },
        update: {
          rank,
          score: participant.score,
          problemsSolved: participant.problemsSolved,
          lastSubmissionTime: participant.lastSubmissionTime
        },
        create: {
          contestId,
          userId: participant.userId,
          rank,
          score: participant.score,
          problemsSolved: participant.problemsSolved,
          lastSubmissionTime: participant.lastSubmissionTime
        }
      });

      const entry: LeaderboardEntry = {
        contestId,
        userId: participant.userId,
        username: participant.username,
        displayName: participant.displayName,
        rank,
        score: participant.score,
        problemsSolved: participant.problemsSolved,
        lastSubmissionTime: participant.lastSubmissionTime
      };

      leaderboardEntries.push(entry);

      // Track updates for broadcasting
      if (oldRank !== rank || oldScore !== participant.score) {
        updates.push({
          contestId,
          userId: participant.userId,
          newRank: rank,
          oldRank,
          newScore: participant.score,
          oldScore
        });
      }
    }

    // Broadcast leaderboard updates
    if (updates.length > 0) {
      broadcastMessage('leaderboard.updated', {
        contestId,
        updates,
        leaderboard: leaderboardEntries.slice(0, 10) // Top 10 for broadcast
      });
    }

    return leaderboardEntries;
  }

  /**
   * Get leaderboard for a specific contest with pagination and filtering
   */
  async getContestLeaderboard(
    contestId: string, 
    filters: LeaderboardFilters = {}
  ): Promise<{ entries: LeaderboardEntry[]; total: number }> {
    const { limit = 50, offset = 0, userId } = filters;

    // Build where clause
    const whereClause: Prisma.LeaderboardWhereInput = { contestId };
    if (userId) {
      whereClause.userId = userId;
    }

    // Get leaderboard entries
    const [entries, total] = await Promise.all([
      prisma.leaderboard.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              username: true,
              displayName: true
            }
          }
        },
        orderBy: [
          { rank: 'asc' }
        ],
        skip: offset,
        take: limit
      }),
      prisma.leaderboard.count({ where: whereClause })
    ]);

    const leaderboardEntries: LeaderboardEntry[] = entries.map(entry => ({
      contestId: entry.contestId,
      userId: entry.userId,
      username: entry.user.username,
      displayName: entry.user.displayName,
      rank: entry.rank,
      score: entry.score,
      problemsSolved: entry.problemsSolved,
      lastSubmissionTime: entry.lastSubmissionTime
    }));

    return { entries: leaderboardEntries, total };
  }

  /**
   * Get user's position in a specific contest leaderboard
   */
  async getUserLeaderboardPosition(contestId: string, userId: string): Promise<LeaderboardEntry | null> {
    const entry = await prisma.leaderboard.findUnique({
      where: {
        contestId_userId: {
          contestId,
          userId
        }
      },
      include: {
        user: {
          select: {
            username: true,
            displayName: true
          }
        }
      }
    });

    if (!entry) {
      return null;
    }

    return {
      contestId: entry.contestId,
      userId: entry.userId,
      username: entry.user.username,
      displayName: entry.user.displayName,
      rank: entry.rank,
      score: entry.score,
      problemsSolved: entry.problemsSolved,
      lastSubmissionTime: entry.lastSubmissionTime
    };
  }

  /**
   * Update leaderboard when a submission is reviewed
   */
  async onSubmissionReviewed(submissionId: string): Promise<void> {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        review: true
      }
    });

    if (!submission) {
      console.error(`Submission ${submissionId} not found for leaderboard update`);
      return;
    }

    // Update leaderboard for the contest
    await this.updateContestLeaderboard(submission.contestId);
  }

  /**
   * Get top performers across all contests
   */
  async getGlobalLeaderboard(limit: number = 20): Promise<GlobalLeaderboardEntry[]> {
    const users = await prisma.user.findMany({
      include: {
        leaderboardEntries: {
          include: {
            contest: {
              select: {
                name: true,
                status: true
              }
            }
          }
        }
      }
    });

    const globalStats = users
      .map(user => {
        const entries = user.leaderboardEntries;
        
        if (entries.length === 0) {
          return null;
        }

        const totalScore = entries.reduce((sum, entry) => sum + entry.score, 0);
        const totalProblemsSolved = entries.reduce((sum, entry) => sum + entry.problemsSolved, 0);
        const contestsParticipated = entries.length;
        const averageRank = entries.reduce((sum, entry) => sum + entry.rank, 0) / entries.length;

        return {
          userId: user.id,
          username: user.username,
          displayName: user.displayName,
          totalScore,
          totalProblemsSolved,
          contestsParticipated,
          averageRank
        };
      })
      .filter((stat): stat is NonNullable<typeof stat> => stat !== null)
      .sort((a, b) => {
        // Sort by total score, then by average rank (lower is better)
        if (a!.totalScore !== b!.totalScore) {
          return b!.totalScore - a!.totalScore;
        }
        return a!.averageRank - b!.averageRank;
      })
      .slice(0, limit);

    return globalStats as GlobalLeaderboardEntry[];
  }

  /**
   * Update leaderboards for all active contests
   */
  async updateAllContestLeaderboards(): Promise<{ contestId: string; entriesCount: number }[]> {
    const activeContests = await prisma.contest.findMany({
      where: {
        status: {
          in: ['RUNNING', 'ENDED']
        }
      },
      select: { id: true }
    });

    const results: { contestId: string; entriesCount: number }[] = [];

    for (const contest of activeContests) {
      try {
        const entries = await this.updateContestLeaderboard(contest.id);
        results.push({
          contestId: contest.id,
          entriesCount: entries.length
        });
      } catch (error) {
        console.error(`Failed to update leaderboard for contest ${contest.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Get leaderboard changes over time for analytics
   */
  async getLeaderboardHistory(contestId: string, userId?: string): Promise<{
    timestamp: Date;
    rank: number;
    score: number;
    problemsSolved: number;
  }[]> {
    // This would require storing historical leaderboard data
    // For now, we'll return current state only
    const currentEntry = userId 
      ? await this.getUserLeaderboardPosition(contestId, userId)
      : null;

    if (!currentEntry) {
      return [];
    }

    return [{
      timestamp: new Date(),
      rank: currentEntry.rank,
      score: currentEntry.score,
      problemsSolved: currentEntry.problemsSolved
    }];
  }
}

export const leaderboardService = new LeaderboardService();
