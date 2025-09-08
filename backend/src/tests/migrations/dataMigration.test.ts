import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  migrateLegacyProblemsToQuestionProblems,
  migrateScoreEventsToReviewsAndLeaderboard,
  migrateContestStateToContestAndSystemControl,
  migrateUsersToRolePermissionSystem,
  runAllMigrations
} from '../../migrations/dataMigration';

const prisma = new PrismaClient();

describe('Data Migration Tests', () => {
  beforeEach(async () => {
    // Clean up test data in proper order to handle foreign key constraints
    await prisma.leaderboard.deleteMany();
    await prisma.review.deleteMany();
    await prisma.scoreEvent.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.systemControl.deleteMany();
    await prisma.contestProblem.deleteMany();
    await prisma.contestUser.deleteMany();
    await prisma.questionProblem.deleteMany();
    await prisma.contest.deleteMany();
    await prisma.contestState.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.problem.deleteMany();
  });

  afterEach(async () => {
    // Clean up after tests in proper order to handle foreign key constraints
    await prisma.leaderboard.deleteMany();
    await prisma.review.deleteMany();
    await prisma.scoreEvent.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.systemControl.deleteMany();
    await prisma.contestProblem.deleteMany();
    await prisma.contestUser.deleteMany();
    await prisma.questionProblem.deleteMany();
    await prisma.contest.deleteMany();
    await prisma.contestState.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.problem.deleteMany();
  });

  describe('Legacy Problems Migration', () => {
    it('should migrate legacy problems to QuestionProblems', async () => {
      // Create test legacy problems
      await prisma.problem.createMany({
        data: [
          {
            title: 'Test Problem 1',
            description: 'A simple test problem',
            difficulty: 'EASY',
            points: 100,
            test_cases: { input: 'test', output: 'test' }
          },
          {
            title: 'Test Problem 2',
            description: 'A medium test problem',
            difficulty: 'MEDIUM',
            points: 200,
            test_cases: { input: 'test2', output: 'test2' }
          }
        ]
      });

      const result = await migrateLegacyProblemsToQuestionProblems();

      expect(result.success).toBe(true);
      expect(result.migratedCount).toBe(2);
      expect(result.errorCount).toBe(0);

      const questionProblems = await prisma.questionProblem.findMany();
      expect(questionProblems).toHaveLength(2);
      
      const easyProblem = questionProblems.find(p => p.difficultyLevel === 'EASY');
      expect(easyProblem).toBeDefined();
      expect(easyProblem?.questionText).toContain('Test Problem 1');
      expect(easyProblem?.maxScore).toBe(100);
    });

    it('should skip already migrated problems', async () => {
      // Create legacy problem
      await prisma.problem.create({
        data: {
          title: 'Test Problem',
          description: 'A test problem',
          difficulty: 'EASY',
          points: 100,
          test_cases: { input: 'test', output: 'test' }
        }
      });

      // Create corresponding QuestionProblem
      await prisma.questionProblem.create({
        data: {
          questionText: 'Test Problem\n\nA test problem',
          difficultyLevel: 'EASY',
          maxScore: 100,
          isActive: true
        }
      });

      const result = await migrateLegacyProblemsToQuestionProblems();

      expect(result.success).toBe(true);
      expect(result.migratedCount).toBe(0);
      expect(result.skippedCount).toBe(1);
    });
  });

  describe('User Role-Permission Migration', () => {
    it('should set up roles and permissions correctly', async () => {
      const result = await migrateUsersToRolePermissionSystem();

      expect(result.success).toBe(true);

      // Check roles were created
      const roles = await prisma.role.findMany();
      expect(roles.length).toBeGreaterThanOrEqual(3);
      
      const roleNames = roles.map(r => r.name);
      expect(roleNames).toContain('admin');
      expect(roleNames).toContain('judge');
      expect(roleNames).toContain('participant');

      // Check permissions were created
      const permissions = await prisma.permission.findMany();
      expect(permissions.length).toBeGreaterThan(10);

      // Check role-permission assignments
      const adminRole = roles.find(r => r.name === 'admin');
      const adminPermissions = await prisma.rolePermission.findMany({
        where: { roleId: adminRole?.id }
      });
      expect(adminPermissions.length).toBeGreaterThan(5);
    });

    it('should migrate users to proper roles', async () => {
      // Create test users
      const adminRole = await prisma.role.create({
        data: { name: 'admin', description: 'Administrator' }
      });

      const participantRole = await prisma.role.create({
        data: { name: 'participant', description: 'Participant' }
      });

      await prisma.user.createMany({
        data: [
          {
            username: 'admin_user',
            password: 'hashed',
            roleId: adminRole.id
          },
          {
            username: 'regular_user',
            password: 'hashed',
            roleId: participantRole.id
          }
        ]
      });

      const result = await migrateUsersToRolePermissionSystem();

      expect(result.success).toBe(true);
      
      const users = await prisma.user.findMany({
        include: { role: true }
      });

      const adminUser = users.find(u => u.username === 'admin_user');
      expect(adminUser?.role.name).toBe('admin');
    });
  });

  describe('ScoreEvent Migration', () => {
    it('should migrate score events to reviews and leaderboard', async () => {
      // Set up prerequisite data
      const adminRole = await prisma.role.create({
        data: { name: 'admin', description: 'Administrator' }
      });

      const systemUser = await prisma.user.create({
        data: {
          username: 'system',
          password: 'system',
          roleId: adminRole.id
        }
      });

      const testUser = await prisma.user.create({
        data: {
          username: 'testuser',
          password: 'hashed',
          roleId: adminRole.id
        }
      });

      const contest = await prisma.contest.create({
        data: {
          name: 'Test Contest',
          status: 'RUNNING'
        }
      });

      const questionProblem = await prisma.questionProblem.create({
        data: {
          questionText: 'Test Problem\n\nDescription',
          difficultyLevel: 'EASY',
          maxScore: 100,
          isActive: true
        }
      });

      const submission = await prisma.submission.create({
        data: {
          problemId: questionProblem.id,
          contestId: contest.id,
          submittedById: testUser.id,
          codeText: 'test code',
          status: 'PENDING'
        }
      });

      await prisma.scoreEvent.create({
        data: {
          submissionId: submission.id,
          userId: testUser.id,
          points: 100,
          acceptedAt: new Date()
        }
      });

      const result = await migrateScoreEventsToReviewsAndLeaderboard();

      expect(result.success).toBe(true);
      expect(result.migratedCount).toBe(1);

      // Check review was created
      const reviews = await prisma.review.findMany();
      expect(reviews).toHaveLength(1);
      expect(reviews[0].correct).toBe(true);
      expect(reviews[0].scoreAwarded).toBe(100);

      // Check submission was updated
      const updatedSubmission = await prisma.submission.findUnique({
        where: { id: submission.id }
      });
      expect(updatedSubmission?.status).toBe('ACCEPTED');
      expect(updatedSubmission?.score).toBe(100);

      // Check leaderboard was generated
      const leaderboard = await prisma.leaderboard.findMany();
      expect(leaderboard).toHaveLength(1);
      expect(leaderboard[0].score).toBe(100);
      expect(leaderboard[0].problemsSolved).toBe(1);
    });
  });

  describe('ContestState Migration', () => {
    it('should migrate contest states to contests and system controls', async () => {
      // Set up system user
      const adminRole = await prisma.role.create({
        data: { name: 'admin', description: 'Administrator' }
      });

      const systemUser = await prisma.user.create({
        data: {
          username: 'system',
          password: 'system',
          roleId: adminRole.id
        }
      });

      // Create test contest states
      await prisma.contestState.createMany({
        data: [
          {
            phase: 'Setup',
            startTime: new Date('2024-01-01T10:00:00Z'),
            endTime: new Date('2024-01-01T12:00:00Z')
          },
          {
            phase: 'Running',
            startTime: new Date('2024-01-02T10:00:00Z'),
            endTime: new Date('2024-01-02T12:00:00Z')
          }
        ]
      });

      const result = await migrateContestStateToContestAndSystemControl();

      expect(result.success).toBe(true);
      expect(result.migratedCount).toBe(2);

      // Check contests were created
      const contests = await prisma.contest.findMany();
      expect(contests).toHaveLength(2);

      const setupContest = contests.find(c => c.name === 'Contest Setup');
      expect(setupContest?.status).toBe('PLANNED');

      const runningContest = contests.find(c => c.name === 'Contest Running');
      expect(runningContest?.status).toBe('RUNNING');

      // Check system controls were created
      const systemControls = await prisma.systemControl.findMany();
      expect(systemControls).toHaveLength(2);
      
      const setupControl = systemControls.find(sc => 
        JSON.parse(JSON.stringify(sc.value)).phase === 'Setup'
      );
      expect(setupControl).toBeDefined();
      expect(setupControl?.controlCode).toBe(820);
    });
  });

  describe('Complete Migration', () => {
    it('should run all migrations successfully', async () => {
      // Create comprehensive test data
      await prisma.problem.create({
        data: {
          title: 'Legacy Problem',
          description: 'A legacy problem',
          difficulty: 'MEDIUM',
          points: 150,
          test_cases: { input: 'test', output: 'test' }
        }
      });

      await prisma.contestState.create({
        data: {
          phase: 'Running',
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600000)
        }
      });

      // Run all migrations
      await expect(runAllMigrations()).resolves.not.toThrow();

      // Verify all data was migrated
      const questionProblems = await prisma.questionProblem.findMany();
      expect(questionProblems.length).toBeGreaterThan(0);

      const roles = await prisma.role.findMany();
      expect(roles.length).toBeGreaterThanOrEqual(3);

      const permissions = await prisma.permission.findMany();
      expect(permissions.length).toBeGreaterThan(10);

      const contests = await prisma.contest.findMany();
      expect(contests.length).toBeGreaterThan(0);
    });
  });
});