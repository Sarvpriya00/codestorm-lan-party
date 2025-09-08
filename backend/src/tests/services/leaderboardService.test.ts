import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { leaderboardService } from '../../services/leaderboardService';

const prisma = new PrismaClient();

describe('LeaderboardService', () => {
  let testRoleId: string;
  let testUserId1: string;
  let testUserId2: string;
  let testContestId: string;
  let testProblemId1: string;
  let testProblemId2: string;

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

    // Create test users
    const user1 = await prisma.user.create({
      data: {
        username: 'testuser1',
        displayName: 'Test User 1',
        password: 'hashedpassword',
        roleId: testRoleId
      }
    });
    testUserId1 = user1.id;

    const user2 = await prisma.user.create({
      data: {
        username: 'testuser2',
        displayName: 'Test User 2',
        password: 'hashedpassword',
        roleId: testRoleId
      }
    });
    testUserId2 = user2.id;

    // Create test contest
    const contest = await prisma.contest.create({
      data: {
        name: 'Test Contest',
        description: 'A test contest',
        status: 'RUNNING'
      }
    });
    testContestId = contest.id;

    // Create test problems
    const problem1 = await prisma.questionProblem.create({
      data: {
        questionText: 'Test problem 1',
        difficultyLevel: 'EASY',
        maxScore: 100,
        isActive: true
      }
    });
    testProblemId1 = problem1.id;

    const problem2 = await prisma.questionProblem.create({
      data: {
        questionText: 'Test problem 2',
        difficultyLevel: 'MEDIUM',
        maxScore: 150,
        isActive: true
      }
    });
    testProblemId2 = problem2.id;

    // Create contest-problem associations
    await prisma.contestProblem.create({
      data: {
        contestId: testContestId,
        problemId: testProblemId1,
        points: 100,
        order: 1
      }
    });

    await prisma.contestProblem.create({
      data: {
        contestId: testContestId,
        problemId: testProblemId2,
        points: 150,
        order: 2
      }
    });

    // Create contest users
    await prisma.contestUser.create({
      data: {
        contestId: testContestId,
        userId: testUserId1,
        status: 'ACTIVE'
      }
    });

    await prisma.contestUser.create({
      data: {
        contestId: testContestId,
        userId: testUserId2,
        status: 'ACTIVE'
      }
    });
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

  describe('updateContestLeaderboard', () => {
    it('should create leaderboard entries for participants with accepted submissions', async () => {
      // Create accepted submissions
      const submission1 = await prisma.submission.create({
        data: {
          problemId: testProblemId1,
          contestId: testContestId,
          submittedById: testUserId1,
          codeText: 'console.log("Hello World");',
          status: 'ACCEPTED'
        }
      });

      const submission2 = await prisma.submission.create({
        data: {
          problemId: testProblemId2,
          contestId: testContestId,
          submittedById: testUserId2,
          codeText: 'console.log("Hello World 2");',
          status: 'ACCEPTED'
        }
      });

      // Create reviews
      await prisma.review.create({
        data: {
          submissionId: submission1.id,
          problemId: testProblemId1,
          submittedById: testUserId1,
          reviewedById: testUserId1,
          correct: true,
          scoreAwarded: 85
        }
      });

      await prisma.review.create({
        data: {
          submissionId: submission2.id,
          problemId: testProblemId2,
          submittedById: testUserId2,
          reviewedById: testUserId2,
          correct: true,
          scoreAwarded: 120
        }
      });

      const leaderboard = await leaderboardService.updateContestLeaderboard(testContestId);

      expect(leaderboard).toHaveLength(2);
      
      // User 2 should be first (higher score)
      expect(leaderboard[0].userId).toBe(testUserId2);
      expect(leaderboard[0].rank).toBe(1);
      expect(leaderboard[0].score).toBe(120);
      expect(leaderboard[0].problemsSolved).toBe(1);

      // User 1 should be second
      expect(leaderboard[1].userId).toBe(testUserId1);
      expect(leaderboard[1].rank).toBe(2);
      expect(leaderboard[1].score).toBe(85);
      expect(leaderboard[1].problemsSolved).toBe(1);
    });

    it('should handle tie-breaking by submission time', async () => {
      const now = new Date();
      const earlier = new Date(now.getTime() - 60000); // 1 minute earlier

      // Create submissions with same score but different times
      const submission1 = await prisma.submission.create({
        data: {
          problemId: testProblemId1,
          contestId: testContestId,
          submittedById: testUserId1,
          codeText: 'console.log("Hello World");',
          status: 'ACCEPTED',
          timestamp: earlier
        }
      });

      const submission2 = await prisma.submission.create({
        data: {
          problemId: testProblemId1,
          contestId: testContestId,
          submittedById: testUserId2,
          codeText: 'console.log("Hello World 2");',
          status: 'ACCEPTED',
          timestamp: now
        }
      });

      // Create reviews with same score
      await prisma.review.create({
        data: {
          submissionId: submission1.id,
          problemId: testProblemId1,
          submittedById: testUserId1,
          reviewedById: testUserId1,
          correct: true,
          scoreAwarded: 85
        }
      });

      await prisma.review.create({
        data: {
          submissionId: submission2.id,
          problemId: testProblemId1,
          submittedById: testUserId2,
          reviewedById: testUserId2,
          correct: true,
          scoreAwarded: 85
        }
      });

      const leaderboard = await leaderboardService.updateContestLeaderboard(testContestId);

      expect(leaderboard).toHaveLength(2);
      
      // User 1 should be first (earlier submission time)
      expect(leaderboard[0].userId).toBe(testUserId1);
      expect(leaderboard[0].rank).toBe(1);
      expect(leaderboard[0].score).toBe(85);

      // User 2 should be second
      expect(leaderboard[1].userId).toBe(testUserId2);
      expect(leaderboard[1].rank).toBe(2);
      expect(leaderboard[1].score).toBe(85);
    });

    it('should count multiple problems solved correctly', async () => {
      // User 1 solves both problems
      const submission1a = await prisma.submission.create({
        data: {
          problemId: testProblemId1,
          contestId: testContestId,
          submittedById: testUserId1,
          codeText: 'console.log("Problem 1");',
          status: 'ACCEPTED'
        }
      });

      const submission1b = await prisma.submission.create({
        data: {
          problemId: testProblemId2,
          contestId: testContestId,
          submittedById: testUserId1,
          codeText: 'console.log("Problem 2");',
          status: 'ACCEPTED'
        }
      });

      // User 2 solves only one problem
      const submission2 = await prisma.submission.create({
        data: {
          problemId: testProblemId1,
          contestId: testContestId,
          submittedById: testUserId2,
          codeText: 'console.log("Problem 1 only");',
          status: 'ACCEPTED'
        }
      });

      // Create reviews
      await prisma.review.create({
        data: {
          submissionId: submission1a.id,
          problemId: testProblemId1,
          submittedById: testUserId1,
          reviewedById: testUserId1,
          correct: true,
          scoreAwarded: 80
        }
      });

      await prisma.review.create({
        data: {
          submissionId: submission1b.id,
          problemId: testProblemId2,
          submittedById: testUserId1,
          reviewedById: testUserId1,
          correct: true,
          scoreAwarded: 90
        }
      });

      await prisma.review.create({
        data: {
          submissionId: submission2.id,
          problemId: testProblemId1,
          submittedById: testUserId2,
          reviewedById: testUserId2,
          correct: true,
          scoreAwarded: 95
        }
      });

      const leaderboard = await leaderboardService.updateContestLeaderboard(testContestId);

      expect(leaderboard).toHaveLength(2);
      
      // User 1 should be first (higher total score and more problems solved)
      expect(leaderboard[0].userId).toBe(testUserId1);
      expect(leaderboard[0].score).toBe(170); // 80 + 90
      expect(leaderboard[0].problemsSolved).toBe(2);

      // User 2 should be second
      expect(leaderboard[1].userId).toBe(testUserId2);
      expect(leaderboard[1].score).toBe(95);
      expect(leaderboard[1].problemsSolved).toBe(1);
    });

    it('should exclude participants with no accepted submissions', async () => {
      // Create only pending/rejected submissions
      await prisma.submission.create({
        data: {
          problemId: testProblemId1,
          contestId: testContestId,
          submittedById: testUserId1,
          codeText: 'console.log("Pending");',
          status: 'PENDING'
        }
      });

      await prisma.submission.create({
        data: {
          problemId: testProblemId1,
          contestId: testContestId,
          submittedById: testUserId2,
          codeText: 'console.log("Rejected");',
          status: 'REJECTED'
        }
      });

      const leaderboard = await leaderboardService.updateContestLeaderboard(testContestId);

      expect(leaderboard).toHaveLength(0);
    });
  });

  describe('getContestLeaderboard', () => {
    beforeEach(async () => {
      // Set up some leaderboard data
      await leaderboardService.updateContestLeaderboard(testContestId);
    });

    it('should return leaderboard with pagination', async () => {
      const result = await leaderboardService.getContestLeaderboard(testContestId, {
        limit: 10,
        offset: 0
      });

      expect(result.entries).toBeDefined();
      expect(result.total).toBeDefined();
      expect(Array.isArray(result.entries)).toBe(true);
    });

    it('should filter by user ID', async () => {
      // Create a submission and review for user 1
      const submission = await prisma.submission.create({
        data: {
          problemId: testProblemId1,
          contestId: testContestId,
          submittedById: testUserId1,
          codeText: 'console.log("Test");',
          status: 'ACCEPTED'
        }
      });

      await prisma.review.create({
        data: {
          submissionId: submission.id,
          problemId: testProblemId1,
          submittedById: testUserId1,
          reviewedById: testUserId1,
          correct: true,
          scoreAwarded: 85
        }
      });

      await leaderboardService.updateContestLeaderboard(testContestId);

      const result = await leaderboardService.getContestLeaderboard(testContestId, {
        userId: testUserId1
      });

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].userId).toBe(testUserId1);
    });
  });

  describe('getUserLeaderboardPosition', () => {
    it('should return user position if exists', async () => {
      // Create submission and review
      const submission = await prisma.submission.create({
        data: {
          problemId: testProblemId1,
          contestId: testContestId,
          submittedById: testUserId1,
          codeText: 'console.log("Test");',
          status: 'ACCEPTED'
        }
      });

      await prisma.review.create({
        data: {
          submissionId: submission.id,
          problemId: testProblemId1,
          submittedById: testUserId1,
          reviewedById: testUserId1,
          correct: true,
          scoreAwarded: 85
        }
      });

      await leaderboardService.updateContestLeaderboard(testContestId);

      const position = await leaderboardService.getUserLeaderboardPosition(testContestId, testUserId1);

      expect(position).toBeDefined();
      expect(position?.userId).toBe(testUserId1);
      expect(position?.rank).toBe(1);
      expect(position?.score).toBe(85);
    });

    it('should return null if user not in leaderboard', async () => {
      const position = await leaderboardService.getUserLeaderboardPosition(testContestId, testUserId1);
      expect(position).toBeNull();
    });
  });

  describe('getGlobalLeaderboard', () => {
    it('should return global statistics across contests', async () => {
      // Create another contest
      const contest2 = await prisma.contest.create({
        data: {
          name: 'Test Contest 2',
          status: 'ENDED'
        }
      });

      // Add user to second contest
      await prisma.contestUser.create({
        data: {
          contestId: contest2.id,
          userId: testUserId1,
          status: 'ACTIVE'
        }
      });

      // Create submissions and reviews for both contests
      const submission1 = await prisma.submission.create({
        data: {
          problemId: testProblemId1,
          contestId: testContestId,
          submittedById: testUserId1,
          codeText: 'console.log("Contest 1");',
          status: 'ACCEPTED'
        }
      });

      const submission2 = await prisma.submission.create({
        data: {
          problemId: testProblemId1,
          contestId: contest2.id,
          submittedById: testUserId1,
          codeText: 'console.log("Contest 2");',
          status: 'ACCEPTED'
        }
      });

      await prisma.review.create({
        data: {
          submissionId: submission1.id,
          problemId: testProblemId1,
          submittedById: testUserId1,
          reviewedById: testUserId1,
          correct: true,
          scoreAwarded: 85
        }
      });

      await prisma.review.create({
        data: {
          submissionId: submission2.id,
          problemId: testProblemId1,
          submittedById: testUserId1,
          reviewedById: testUserId1,
          correct: true,
          scoreAwarded: 90
        }
      });

      // Update leaderboards
      await leaderboardService.updateContestLeaderboard(testContestId);
      await leaderboardService.updateContestLeaderboard(contest2.id);

      const globalLeaderboard = await leaderboardService.getGlobalLeaderboard(10);

      expect(globalLeaderboard.length).toBeGreaterThan(0);
      const user1Entry = globalLeaderboard.find(entry => entry.userId === testUserId1);
      expect(user1Entry).toBeDefined();
      expect(user1Entry?.totalScore).toBe(175); // 85 + 90
      expect(user1Entry?.contestsParticipated).toBe(2);
    });

    it('should return empty array when no leaderboard entries exist', async () => {
      const globalLeaderboard = await leaderboardService.getGlobalLeaderboard(10);
      expect(globalLeaderboard).toHaveLength(0);
    });
  });

  describe('updateAllContestLeaderboards', () => {
    it('should update leaderboards for all active contests', async () => {
      // Create another contest
      const contest2 = await prisma.contest.create({
        data: {
          name: 'Test Contest 2',
          status: 'ENDED'
        }
      });

      // Create a planned contest (should be skipped)
      await prisma.contest.create({
        data: {
          name: 'Planned Contest',
          status: 'PLANNED'
        }
      });

      const results = await leaderboardService.updateAllContestLeaderboards();

      expect(results).toHaveLength(2); // Only RUNNING and ENDED contests
      expect(results.some(r => r.contestId === testContestId)).toBe(true);
      expect(results.some(r => r.contestId === contest2.id)).toBe(true);
    });
  });

  describe('onSubmissionReviewed', () => {
    it('should update leaderboard when submission is reviewed', async () => {
      const submission = await prisma.submission.create({
        data: {
          problemId: testProblemId1,
          contestId: testContestId,
          submittedById: testUserId1,
          codeText: 'console.log("Test");',
          status: 'ACCEPTED'
        }
      });

      await prisma.review.create({
        data: {
          submissionId: submission.id,
          problemId: testProblemId1,
          submittedById: testUserId1,
          reviewedById: testUserId1,
          correct: true,
          scoreAwarded: 85
        }
      });

      await leaderboardService.onSubmissionReviewed(submission.id);

      const position = await leaderboardService.getUserLeaderboardPosition(testContestId, testUserId1);
      expect(position).toBeDefined();
      expect(position?.score).toBe(85);
    });

    it('should handle non-existent submission gracefully', async () => {
      // Should not throw error
      await expect(leaderboardService.onSubmissionReviewed('non-existent-id')).resolves.toBeUndefined();
    });
  });
});