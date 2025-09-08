import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ContestAnalytics {
  contestId: string;
  totalSubmissions: number;
  correctSubmissions: number;
  activeParticipants: number;
  lastUpdated: Date;
}

export interface SystemMetrics {
  totalUsers: number;
  totalProblems: number;
  totalSubmissions: number;
  totalContests: number;
  activeContests: number;
  totalReviews: number;
  averageScore: number;
}

export interface ContestStatistics {
  contestId: string;
  contestName: string;
  totalParticipants: number;
  activeParticipants: number;
  totalSubmissions: number;
  correctSubmissions: number;
  averageScore: number;
  problemsCount: number;
  startTime?: Date;
  endTime?: Date;
  status: string;
}

export class AnalyticsService {
  /**
   * Calculate and update analytics for a specific contest
   */
  async updateContestAnalytics(contestId: string): Promise<ContestAnalytics> {
    // Get total submissions for the contest
    const totalSubmissions = await prisma.submission.count({
      where: { contestId }
    });

    // Get correct submissions (accepted status)
    const correctSubmissions = await prisma.submission.count({
      where: { 
        contestId,
        status: 'ACCEPTED'
      }
    });

    // Get active participants (users who have made submissions)
    const activeParticipants = await prisma.submission.groupBy({
      by: ['submittedById'],
      where: { contestId },
      _count: true
    }).then(results => results.length);

    // Update or create analytics record
    const existingAnalytics = await prisma.analytics.findFirst({
      where: { contestId }
    });

    let analytics;
    if (existingAnalytics) {
      analytics = await prisma.analytics.update({
        where: { id: existingAnalytics.id },
        data: {
          totalSubmissions,
          correctSubmissions,
          activeParticipants,
          lastUpdated: new Date()
        }
      });
    } else {
      analytics = await prisma.analytics.create({
        data: {
          contestId,
          totalSubmissions,
          correctSubmissions,
          activeParticipants,
          lastUpdated: new Date()
        }
      });
    }

    return {
      contestId: analytics.contestId,
      totalSubmissions: analytics.totalSubmissions,
      correctSubmissions: analytics.correctSubmissions,
      activeParticipants: analytics.activeParticipants,
      lastUpdated: analytics.lastUpdated
    };
  }

  /**
   * Get analytics for a specific contest
   */
  async getContestAnalytics(contestId: string): Promise<ContestAnalytics | null> {
    const analytics = await prisma.analytics.findFirst({
      where: { contestId }
    });

    if (!analytics) {
      return null;
    }

    return {
      contestId: analytics.contestId,
      totalSubmissions: analytics.totalSubmissions,
      correctSubmissions: analytics.correctSubmissions,
      activeParticipants: analytics.activeParticipants,
      lastUpdated: analytics.lastUpdated
    };
  }

  /**
   * Get detailed contest statistics including contest information
   */
  async getContestStatistics(contestId: string): Promise<ContestStatistics | null> {
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        analytics: true,
        contestUsers: true,
        contestProblems: true,
        submissions: {
          include: {
            review: true
          }
        }
      }
    });

    if (!contest) {
      return null;
    }

    // Calculate statistics
    const totalParticipants = contest.contestUsers.length;
    const activeParticipants = contest.submissions
      .map(s => s.submittedById)
      .filter((value, index, self) => self.indexOf(value) === index)
      .length;

    const totalSubmissions = contest.submissions.length;
    const correctSubmissions = contest.submissions.filter(s => s.status === 'ACCEPTED').length;
    
    const reviewedSubmissions = contest.submissions.filter(s => s.review);
    const averageScore = reviewedSubmissions.length > 0 
      ? reviewedSubmissions.reduce((sum, s) => sum + (s.review?.scoreAwarded || 0), 0) / reviewedSubmissions.length
      : 0;

    const problemsCount = contest.contestProblems.length;

    return {
      contestId: contest.id,
      contestName: contest.name,
      totalParticipants,
      activeParticipants,
      totalSubmissions,
      correctSubmissions,
      averageScore,
      problemsCount,
      startTime: contest.startTime || undefined,
      endTime: contest.endTime || undefined,
      status: contest.status
    };
  }

  /**
   * Get system-wide metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const [
      totalUsers,
      totalProblems,
      totalSubmissions,
      totalContests,
      activeContests,
      totalReviews,
      reviewedSubmissions
    ] = await Promise.all([
      prisma.user.count(),
      prisma.questionProblem.count({ where: { isActive: true } }),
      prisma.submission.count(),
      prisma.contest.count(),
      prisma.contest.count({ where: { status: 'RUNNING' } }),
      prisma.review.count(),
      prisma.submission.findMany({
        where: { review: { isNot: null } },
        include: { review: true }
      })
    ]);

    const averageScore = reviewedSubmissions.length > 0
      ? reviewedSubmissions.reduce((sum, s) => sum + (s.review?.scoreAwarded || 0), 0) / reviewedSubmissions.length
      : 0;

    return {
      totalUsers,
      totalProblems,
      totalSubmissions,
      totalContests,
      activeContests,
      totalReviews,
      averageScore
    };
  }

  /**
   * Update analytics for all active contests
   */
  async updateAllContestAnalytics(): Promise<ContestAnalytics[]> {
    const activeContests = await prisma.contest.findMany({
      where: {
        status: {
          in: ['RUNNING', 'ENDED']
        }
      },
      select: { id: true }
    });

    const results: ContestAnalytics[] = [];
    
    for (const contest of activeContests) {
      try {
        const analytics = await this.updateContestAnalytics(contest.id);
        results.push(analytics);
      } catch (error) {
        console.error(`Failed to update analytics for contest ${contest.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Get analytics for multiple contests
   */
  async getMultipleContestAnalytics(contestIds: string[]): Promise<ContestAnalytics[]> {
    const analytics = await prisma.analytics.findMany({
      where: {
        contestId: {
          in: contestIds
        }
      }
    });

    return analytics.map(a => ({
      contestId: a.contestId,
      totalSubmissions: a.totalSubmissions,
      correctSubmissions: a.correctSubmissions,
      activeParticipants: a.activeParticipants,
      lastUpdated: a.lastUpdated
    }));
  }

  /**
   * Get problem-specific analytics for a contest
   */
  async getProblemAnalytics(contestId: string, problemId: string) {
    const submissions = await prisma.submission.findMany({
      where: {
        contestId,
        problemId
      },
      include: {
        review: true
      }
    });

    const totalSubmissions = submissions.length;
    const correctSubmissions = submissions.filter(s => s.status === 'ACCEPTED').length;
    const averageScore = submissions
      .filter(s => s.review)
      .reduce((sum, s) => sum + (s.review?.scoreAwarded || 0), 0) / Math.max(1, submissions.filter(s => s.review).length);

    const uniqueParticipants = submissions
      .map(s => s.submittedById)
      .filter((value, index, self) => self.indexOf(value) === index)
      .length;

    return {
      problemId,
      contestId,
      totalSubmissions,
      correctSubmissions,
      averageScore,
      uniqueParticipants,
      successRate: totalSubmissions > 0 ? (correctSubmissions / totalSubmissions) * 100 : 0
    };
  }
}

export const analyticsService = new AnalyticsService();