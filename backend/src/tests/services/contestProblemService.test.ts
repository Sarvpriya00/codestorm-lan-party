import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient, ContestStatus, Difficulty } from '@prisma/client';
import { ContestProblemService } from '../../services/contestProblemService';

const prisma = new PrismaClient();
const contestProblemService = new ContestProblemService(prisma);

describe('ContestProblemService', () => {
  let testContest: any;
  let testProblem: any;
  let testRole: any;
  let testUser: any;

  beforeEach(async () => {
    // Clean up test data in correct order due to foreign key constraints
    await prisma.submission.deleteMany();
    await prisma.contestUser.deleteMany();
    await prisma.contestProblem.deleteMany();
    await prisma.leaderboard.deleteMany();
    await prisma.analytics.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.systemControl.deleteMany();
    await prisma.contest.deleteMany();
    await prisma.questionProblem.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();

    // Create test role
    testRole = await prisma.role.create({
      data: {
        name: 'admin',
        description: 'Administrator role'
      }
    });

    // Create test user
    testUser = await prisma.user.create({
      data: {
        username: 'testuser',
        password: 'hashedpassword',
        roleId: testRole.id
      }
    });

    // Create test contest
    testContest = await prisma.contest.create({
      data: {
        name: 'Test Contest',
        description: 'A test contest',
        status: ContestStatus.PLANNED
      }
    });

    // Create test problem
    testProblem = await prisma.questionProblem.create({
      data: {
        questionText: 'Test problem',
        difficultyLevel: Difficulty.EASY,
        maxScore: 100,
        createdById: testUser.id
      }
    });
  });

  afterEach(async () => {
    // Clean up test data in correct order due to foreign key constraints
    await prisma.submission.deleteMany();
    await prisma.contestUser.deleteMany();
    await prisma.contestProblem.deleteMany();
    await prisma.leaderboard.deleteMany();
    await prisma.analytics.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.systemControl.deleteMany();
    await prisma.contest.deleteMany();
    await prisma.questionProblem.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();
  });

  describe('addProblemToContest', () => {
    it('should add a problem to a contest with valid data', async () => {
      const data = {
        contestId: testContest.id,
        problemId: testProblem.id,
        order: 1,
        points: 50
      };

      const contestProblem = await contestProblemService.addProblemToContest(data);

      expect(contestProblem).toBeDefined();
      expect(contestProblem.contestId).toBe(testContest.id);
      expect(contestProblem.problemId).toBe(testProblem.id);
      expect(contestProblem.order).toBe(1);
      expect(contestProblem.points).toBe(50);
    });

    it('should auto-assign order when not provided', async () => {
      const data = {
        contestId: testContest.id,
        problemId: testProblem.id,
        points: 50
      };

      const contestProblem = await contestProblemService.addProblemToContest(data);

      expect(contestProblem.order).toBe(1);
    });

    it('should throw error for non-existent contest', async () => {
      const data = {
        contestId: 'non-existent-id',
        problemId: testProblem.id,
        points: 50
      };

      await expect(contestProblemService.addProblemToContest(data))
        .rejects.toThrow('Contest with id non-existent-id not found');
    });

    it('should throw error for non-existent problem', async () => {
      const data = {
        contestId: testContest.id,
        problemId: 'non-existent-id',
        points: 50
      };

      await expect(contestProblemService.addProblemToContest(data))
        .rejects.toThrow('Problem with id non-existent-id not found');
    });

    it('should throw error for duplicate problem in contest', async () => {
      const data = {
        contestId: testContest.id,
        problemId: testProblem.id,
        points: 50
      };

      await contestProblemService.addProblemToContest(data);

      await expect(contestProblemService.addProblemToContest(data))
        .rejects.toThrow('Problem is already associated with this contest');
    });

    it('should throw error for invalid points', async () => {
      const data = {
        contestId: testContest.id,
        problemId: testProblem.id,
        points: 0
      };

      await expect(contestProblemService.addProblemToContest(data))
        .rejects.toThrow('Points must be greater than 0');
    });

    it('should throw error for duplicate order', async () => {
      // Create another problem
      const problem2 = await prisma.questionProblem.create({
        data: {
          questionText: 'Test problem 2',
          difficultyLevel: Difficulty.MEDIUM,
          maxScore: 100,
          createdById: testUser.id
        }
      });

      // Add first problem with order 1
      await contestProblemService.addProblemToContest({
        contestId: testContest.id,
        problemId: testProblem.id,
        order: 1,
        points: 50
      });

      // Try to add second problem with same order
      await expect(contestProblemService.addProblemToContest({
        contestId: testContest.id,
        problemId: problem2.id,
        order: 1,
        points: 60
      })).rejects.toThrow('Order 1 is already used in this contest');
    });
  });

  describe('removeProblemFromContest', () => {
    it('should remove a problem from contest', async () => {
      // Add problem first
      await contestProblemService.addProblemToContest({
        contestId: testContest.id,
        problemId: testProblem.id,
        points: 50
      });

      await expect(contestProblemService.removeProblemFromContest(testContest.id, testProblem.id))
        .resolves.not.toThrow();

      // Verify it's removed
      const contestProblem = await contestProblemService.getContestProblem(testContest.id, testProblem.id);
      expect(contestProblem).toBeNull();
    });

    it('should throw error for non-associated problem', async () => {
      await expect(contestProblemService.removeProblemFromContest(testContest.id, testProblem.id))
        .rejects.toThrow('Problem is not associated with this contest');
    });

    it('should throw error when problem has submissions', async () => {
      // Add problem to contest
      await contestProblemService.addProblemToContest({
        contestId: testContest.id,
        problemId: testProblem.id,
        points: 50
      });

      // Create a submission
      await prisma.submission.create({
        data: {
          problemId: testProblem.id,
          contestId: testContest.id,
          submittedById: testUser.id,
          codeText: 'test code'
        }
      });

      await expect(contestProblemService.removeProblemFromContest(testContest.id, testProblem.id))
        .rejects.toThrow('Cannot remove problem with existing submissions');
    });
  });

  describe('updateContestProblem', () => {
    it('should update contest problem with valid data', async () => {
      // Add problem first
      await contestProblemService.addProblemToContest({
        contestId: testContest.id,
        problemId: testProblem.id,
        order: 1,
        points: 50
      });

      const updatedContestProblem = await contestProblemService.updateContestProblem(
        testContest.id,
        testProblem.id,
        { order: 2, points: 75 }
      );

      expect(updatedContestProblem.order).toBe(2);
      expect(updatedContestProblem.points).toBe(75);
    });

    it('should throw error for non-associated problem', async () => {
      await expect(contestProblemService.updateContestProblem(
        testContest.id,
        testProblem.id,
        { points: 75 }
      )).rejects.toThrow('Problem is not associated with this contest');
    });

    it('should throw error for invalid points', async () => {
      // Add problem first
      await contestProblemService.addProblemToContest({
        contestId: testContest.id,
        problemId: testProblem.id,
        points: 50
      });

      await expect(contestProblemService.updateContestProblem(
        testContest.id,
        testProblem.id,
        { points: 0 }
      )).rejects.toThrow('Points must be greater than 0');
    });
  });

  describe('getContestProblems', () => {
    it('should return problems ordered by order field', async () => {
      // Create another problem
      const problem2 = await prisma.questionProblem.create({
        data: {
          questionText: 'Test problem 2',
          difficultyLevel: Difficulty.MEDIUM,
          maxScore: 100,
          createdById: testUser.id
        }
      });

      // Add problems with different orders
      await contestProblemService.addProblemToContest({
        contestId: testContest.id,
        problemId: testProblem.id,
        order: 2,
        points: 50
      });

      await contestProblemService.addProblemToContest({
        contestId: testContest.id,
        problemId: problem2.id,
        order: 1,
        points: 60
      });

      const problems = await contestProblemService.getContestProblems(testContest.id);

      expect(problems).toHaveLength(2);
      expect(problems[0].order).toBe(1);
      expect(problems[0].problemId).toBe(problem2.id);
      expect(problems[1].order).toBe(2);
      expect(problems[1].problemId).toBe(testProblem.id);
    });
  });

  describe('reorderContestProblems', () => {
    it('should reorder problems successfully', async () => {
      // Create another problem
      const problem2 = await prisma.questionProblem.create({
        data: {
          questionText: 'Test problem 2',
          difficultyLevel: Difficulty.MEDIUM,
          maxScore: 100,
          createdById: testUser.id
        }
      });

      // Add problems
      await contestProblemService.addProblemToContest({
        contestId: testContest.id,
        problemId: testProblem.id,
        order: 1,
        points: 50
      });

      await contestProblemService.addProblemToContest({
        contestId: testContest.id,
        problemId: problem2.id,
        order: 2,
        points: 60
      });

      // Reorder
      await contestProblemService.reorderContestProblems(testContest.id, [
        { problemId: testProblem.id, order: 3 },
        { problemId: problem2.id, order: 1 }
      ]);

      const problems = await contestProblemService.getContestProblems(testContest.id);
      expect(problems[0].problemId).toBe(problem2.id);
      expect(problems[0].order).toBe(1);
      expect(problems[1].problemId).toBe(testProblem.id);
      expect(problems[1].order).toBe(3);
    });

    it('should throw error for non-existent contest', async () => {
      await expect(contestProblemService.reorderContestProblems('non-existent-id', []))
        .rejects.toThrow('Contest with id non-existent-id not found');
    });

    it('should throw error for duplicate orders', async () => {
      // Add problems
      await contestProblemService.addProblemToContest({
        contestId: testContest.id,
        problemId: testProblem.id,
        points: 50
      });

      await expect(contestProblemService.reorderContestProblems(testContest.id, [
        { problemId: testProblem.id, order: 1 },
        { problemId: testProblem.id, order: 1 }
      ])).rejects.toThrow('Order values must be unique');
    });
  });

  describe('validateContestProblemConstraints', () => {
    it('should return validation results for valid scenario', async () => {
      const validation = await contestProblemService.validateContestProblemConstraints(
        testContest.id,
        testProblem.id
      );

      expect(validation.canAdd).toBe(true);
      expect(validation.canRemove).toBe(false);
      expect(validation.canModify).toBe(false);
      expect(validation.reasons).toContain('Problem is not associated with this contest');
    });

    it('should return validation results for associated problem', async () => {
      // Add problem first
      await contestProblemService.addProblemToContest({
        contestId: testContest.id,
        problemId: testProblem.id,
        points: 50
      });

      const validation = await contestProblemService.validateContestProblemConstraints(
        testContest.id,
        testProblem.id
      );

      expect(validation.canAdd).toBe(false);
      expect(validation.canRemove).toBe(true);
      expect(validation.canModify).toBe(true);
      expect(validation.reasons).toContain('Problem is already associated with this contest');
    });
  });
});