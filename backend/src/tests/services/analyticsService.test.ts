import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { analyticsService } from '../../services/analyticsService';

const prisma = new PrismaClient();

describe('AnalyticsService', () => {
  let testUserId: string;
  let testRoleId: string;
  let testContestId: string;
  let testProblemId: string;
  let testSubmissionId: string;

  beforeEach(async () => {
    // Clean up existing data
    await prisma.review.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.contestProblem.deleteMany();
    await prisma.leaderboard.deleteMany();
    await prisma.analytics.deleteMany();
    await prisma.contestUser.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.systemControl.deleteMany();
    await prisma.contest.deleteMany();
    await prisma.questionProblem.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();

    // Create test role
    const role = await prisma.role.create({
      data: {
        name: 'participant',
        description: 'Test participant role'
      }
    });
    testRoleId = role.id;

    // Create test user
    const user = await prisma.user.create({
      data: {
        username: 'testuser',
        password: 'hashedpassword',
        roleId: testRoleId
      }
    });
    testUserId = user.id;

    // Create test contest
    const contest = await prisma.contest.create({
      data: {
        name: 'Test Contest',
        description: 'A test contest',
        status: 'RUNNING'
      }
    });
    testContestId = contest.id;

    // Create test problem
    const problem = await prisma.questionProblem.create({
      data: {
        questionText: 'Test problem',
        difficultyLevel: 'EASY',
        maxScore: 100,
        isActive: true
      }
    });
    testProblemId = problem.id;

    // Create contest-problem association
    await prisma.contestProblem.create({
      data: {
        contestId: testContestId,
        problemId: testProblemId,
        points: 100,
        order: 1
      }
    });

    // Create test submission
    const submission = await prisma.submission.create({
      data: {
        problemId: testProblemId,
        contestId: testContestId,
        submittedById: testUserId,
        codeText: 'console.log("Hello World");',
        status: 'PENDING'
      }
    });
    testSubmissionId = submission.id;
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.review.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.contestProblem.deleteMany();
    await prisma.leaderboard.deleteMany();
    await prisma.analytics.deleteMany();
    await prisma.contestUser.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.systemControl.deleteMany();
    await prisma.contest.deleteMany();
    await prisma.questionProblem.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
  });

  describe('updateContestAnalytics', () => {
    it('should create new analytics for a contest', async () => {
      const analytics = await analyticsService.updateContestAnalytics(testContestId);

      expect(analytics).toBeDefined();
      expect(analytics.contestId).toBe(testContestId);
      expect(analytics.totalSubmissions).toBe(1);
      expect(analytics.correctSubmissions).toBe(0); // No accepted submissions yet
      expect(analytics.activeParticipants).toBe(1);
      expect(analytics.lastUpdated).toBeInstanceOf(Date);
    });

    it('should update existing analytics for a contest', async () => {
      // Create initial analytics
      await analyticsService.updateContestAnalytics(testContestId);

      // Add another submission
      await prisma.submission.create({
        data: {
          problemId: testProblemId,
          contestId: testContestId,
          submittedById: testUserId,
          codeText: 'console.log("Hello World 2");',
          status: 'ACCEPTED'
        }
      });

      // Update analytics
      const analytics = await analyticsService.updateContestAnalytics(testContestId);

      expect(analytics.totalSubmissions).toBe(2);
      expect(analytics.correctSubmissions).toBe(1);
      expect(analytics.activeParticipants).toBe(1);
    });

    it('should count multiple participants correctly', async () => {
      // Create another user
      const user2 = await prisma.user.create({
        data: {
          username: 'testuser2',
          password: 'hashedpassword',
          roleId: testRoleId
        }
      });

      // Add submission from second user
      await prisma.submission.create({
        data: {
          problemId: testProblemId,
          contestId: testContestId,
          submittedById: user2.id,
          codeText: 'console.log("Hello from user 2");',
          status: 'ACCEPTED'
        }
      });

      const analytics = await analyticsService.updateContestAnalytics(testContestId);

      expect(analytics.totalSubmissions).toBe(2);
      expect(analytics.correctSubmissions).toBe(1);
      expect(analytics.activeParticipants).toBe(2);
    });
  });

  describe('getContestAnalytics', () => {
    it('should return null for non-existent contest analytics', async () => {
      const analytics = await analyticsService.getContestAnalytics('non-existent-id');
      expect(analytics).toBeNull();
    });

    it('should return analytics for existing contest', async () => {
      await analyticsService.updateContestAnalytics(testContestId);
      const analytics = await analyticsService.getContestAnalytics(testContestId);

      expect(analytics).toBeDefined();
      expect(analytics?.contestId).toBe(testContestId);
      expect(analytics?.totalSubmissions).toBe(1);
    });
  });

  describe('getContestStatistics', () => {
    it('should return null for non-existent contest', async () => {
      const statistics = await analyticsService.getContestStatistics('non-existent-id');
      expect(statistics).toBeNull();
    });

    it('should return detailed statistics for existing contest', async () => {
      // Add contest user
      await prisma.contestUser.create({
        data: {
          contestId: testContestId,
          userId: testUserId,
          status: 'ACTIVE'
        }
      });

      // Create a review for the submission
      await prisma.review.create({
        data: {
          submissionId: testSubmissionId,
          problemId: testProblemId,
          submittedById: testUserId,
          reviewedById: testUserId,
          correct: true,
          scoreAwarded: 85
        }
      });

      const statistics = await analyticsService.getContestStatistics(testContestId);

      expect(statistics).toBeDefined();
      expect(statistics?.contestId).toBe(testContestId);
      expect(statistics?.contestName).toBe('Test Contest');
      expect(statistics?.totalParticipants).toBe(1);
      expect(statistics?.activeParticipants).toBe(1);
      expect(statistics?.totalSubmissions).toBe(1);
      expect(statistics?.averageScore).toBe(85);
      expect(statistics?.problemsCount).toBe(1);
      expect(statistics?.status).toBe('RUNNING');
    });
  });

  describe('getSystemMetrics', () => {
    it('should return system-wide metrics', async () => {
      const metrics = await analyticsService.getSystemMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalUsers).toBe(1);
      expect(metrics.totalProblems).toBe(1);
      expect(metrics.totalSubmissions).toBe(1);
      expect(metrics.totalContests).toBe(1);
      expect(metrics.activeContests).toBe(1); // Contest status is RUNNING
      expect(metrics.totalReviews).toBe(0);
      expect(metrics.averageScore).toBe(0);
    });

    it('should calculate average score correctly', async () => {
      // Create a review
      await prisma.review.create({
        data: {
          submissionId: testSubmissionId,
          problemId: testProblemId,
          submittedById: testUserId,
          reviewedById: testUserId,
          correct: true,
          scoreAwarded: 90
        }
      });

      const metrics = await analyticsService.getSystemMetrics();

      expect(metrics.totalReviews).toBe(1);
      expect(metrics.averageScore).toBe(90);
    });
  });

  describe('getProblemAnalytics', () => {
    it('should return problem-specific analytics', async () => {
      // Add another submission for the same problem
      await prisma.submission.create({
        data: {
          problemId: testProblemId,
          contestId: testContestId,
          submittedById: testUserId,
          codeText: 'console.log("Second attempt");',
          status: 'ACCEPTED'
        }
      });

      const analytics = await analyticsService.getProblemAnalytics(testContestId, testProblemId);

      expect(analytics).toBeDefined();
      expect(analytics.problemId).toBe(testProblemId);
      expect(analytics.contestId).toBe(testContestId);
      expect(analytics.totalSubmissions).toBe(2);
      expect(analytics.correctSubmissions).toBe(1);
      expect(analytics.uniqueParticipants).toBe(1);
      expect(analytics.successRate).toBe(50); // 1 out of 2 submissions accepted
    });

    it('should handle problems with no submissions', async () => {
      // Create another problem with no submissions
      const problem2 = await prisma.questionProblem.create({
        data: {
          questionText: 'Another test problem',
          difficultyLevel: 'MEDIUM',
          maxScore: 150,
          isActive: true
        }
      });

      const analytics = await analyticsService.getProblemAnalytics(testContestId, problem2.id);

      expect(analytics.totalSubmissions).toBe(0);
      expect(analytics.correctSubmissions).toBe(0);
      expect(analytics.uniqueParticipants).toBe(0);
      expect(analytics.successRate).toBe(0);
    });
  });

  describe('updateAllContestAnalytics', () => {
    it('should update analytics for all active contests', async () => {
      // Create another contest
      const contest2 = await prisma.contest.create({
        data: {
          name: 'Test Contest 2',
          description: 'Another test contest',
          status: 'ENDED'
        }
      });

      // Create submission for second contest
      await prisma.submission.create({
        data: {
          problemId: testProblemId,
          contestId: contest2.id,
          submittedById: testUserId,
          codeText: 'console.log("Contest 2");',
          status: 'PENDING'
        }
      });

      const results = await analyticsService.updateAllContestAnalytics();

      expect(results).toHaveLength(2); // Both RUNNING and ENDED contests
      expect(results.some(r => r.contestId === testContestId)).toBe(true);
      expect(results.some(r => r.contestId === contest2.id)).toBe(true);
    });

    it('should skip planned contests', async () => {
      // Create a planned contest
      await prisma.contest.create({
        data: {
          name: 'Planned Contest',
          description: 'A planned contest',
          status: 'PLANNED'
        }
      });

      const results = await analyticsService.updateAllContestAnalytics();

      expect(results).toHaveLength(1); // Only the RUNNING contest
      expect(results[0].contestId).toBe(testContestId);
    });
  });

  describe('getMultipleContestAnalytics', () => {
    it('should return analytics for multiple contests', async () => {
      // Update analytics for the test contest
      await analyticsService.updateContestAnalytics(testContestId);

      // Create another contest and update its analytics
      const contest2 = await prisma.contest.create({
        data: {
          name: 'Test Contest 2',
          status: 'RUNNING'
        }
      });
      await analyticsService.updateContestAnalytics(contest2.id);

      const analytics = await analyticsService.getMultipleContestAnalytics([testContestId, contest2.id]);

      expect(analytics).toHaveLength(2);
      expect(analytics.some(a => a.contestId === testContestId)).toBe(true);
      expect(analytics.some(a => a.contestId === contest2.id)).toBe(true);
    });

    it('should return empty array for non-existent contests', async () => {
      const analytics = await analyticsService.getMultipleContestAnalytics(['non-existent-1', 'non-existent-2']);
      expect(analytics).toHaveLength(0);
    });
  });
});