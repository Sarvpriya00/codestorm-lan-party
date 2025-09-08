import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { runAllMigrations } from '../../migrations/dataMigration';

const prisma = new PrismaClient();

describe('System Integration Tests', () => {
  beforeAll(async () => {
    // Clean up any existing test data
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

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Complete System Setup', () => {
    it('should set up the complete system from scratch', async () => {
      // Step 1: Create some legacy data to migrate
      await prisma.problem.create({
        data: {
          title: 'Integration Test Problem',
          description: 'A test problem for integration testing',
          difficulty: 'MEDIUM',
          points: 100,
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

      // Step 2: Run complete migration
      await expect(runAllMigrations()).resolves.not.toThrow();

      // Step 3: Verify system state
      const roles = await prisma.role.findMany();
      expect(roles.length).toBeGreaterThanOrEqual(3);
      
      const roleNames = roles.map(r => r.name);
      expect(roleNames).toContain('admin');
      expect(roleNames).toContain('judge');
      expect(roleNames).toContain('participant');

      const permissions = await prisma.permission.findMany();
      expect(permissions.length).toBeGreaterThan(10);

      const questionProblems = await prisma.questionProblem.findMany();
      expect(questionProblems.length).toBeGreaterThan(0);

      const contests = await prisma.contest.findMany();
      expect(contests.length).toBeGreaterThan(0);

      // Step 4: Verify role-permission assignments
      const adminRole = roles.find(r => r.name === 'admin');
      expect(adminRole).toBeDefined();

      const adminPermissions = await prisma.rolePermission.findMany({
        where: { roleId: adminRole!.id },
        include: { permission: true }
      });
      expect(adminPermissions.length).toBeGreaterThan(5);

      // Verify admin has key permissions
      const adminPermissionCodes = adminPermissions.map(rp => rp.permission.code);
      expect(adminPermissionCodes).toContain(100); // Dashboard
      expect(adminPermissionCodes).toContain(500); // Users
      expect(adminPermissionCodes).toContain(800); // Contest Control

      // Step 5: Test user creation and role assignment
      const adminRole2 = await prisma.role.findFirst({ where: { name: 'admin' } });
      const testUser = await prisma.user.create({
        data: {
          username: 'integration_test_user',
          displayName: 'Integration Test User',
          password: 'hashed_password',
          roleId: adminRole2!.id
        }
      });

      expect(testUser.roleId).toBe(adminRole2!.id);

      // Step 6: Test contest and problem creation
      const contest = await prisma.contest.create({
        data: {
          name: 'Integration Test Contest',
          description: 'A test contest for integration testing',
          status: 'PLANNED'
        }
      });

      const problem = await prisma.questionProblem.create({
        data: {
          questionText: 'Integration Test Problem\n\nSolve this problem',
          difficultyLevel: 'EASY',
          maxScore: 100,
          isActive: true
        }
      });

      // Link problem to contest
      await prisma.contestProblem.create({
        data: {
          contestId: contest.id,
          problemId: problem.id,
          order: 1,
          points: 100
        }
      });

      // Step 7: Test submission and review workflow
      const participantRole = await prisma.role.findFirst({ where: { name: 'participant' } });
      const participant = await prisma.user.create({
        data: {
          username: 'test_participant',
          displayName: 'Test Participant',
          password: 'hashed_password',
          roleId: participantRole!.id
        }
      });

      const submission = await prisma.submission.create({
        data: {
          problemId: problem.id,
          contestId: contest.id,
          submittedById: participant.id,
          codeText: 'console.log("Hello World");',
          status: 'PENDING'
        }
      });

      const judgeRole = await prisma.role.findFirst({ where: { name: 'judge' } });
      const judge = await prisma.user.create({
        data: {
          username: 'test_judge',
          displayName: 'Test Judge',
          password: 'hashed_password',
          roleId: judgeRole!.id
        }
      });

      // Judge reviews submission
      const review = await prisma.review.create({
        data: {
          submissionId: submission.id,
          problemId: problem.id,
          submittedById: participant.id,
          reviewedById: judge.id,
          correct: true,
          scoreAwarded: 100,
          remarks: 'Good solution!'
        }
      });

      // Update submission status
      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          status: 'ACCEPTED',
          score: 100,
          reviewedById: judge.id
        }
      });

      // Step 8: Test leaderboard generation
      await prisma.leaderboard.create({
        data: {
          contestId: contest.id,
          userId: participant.id,
          rank: 1,
          score: 100,
          problemsSolved: 1,
          lastSubmissionTime: new Date()
        }
      });

      // Step 9: Test analytics
      await prisma.analytics.create({
        data: {
          contestId: contest.id,
          totalSubmissions: 1,
          correctSubmissions: 1,
          activeParticipants: 1
        }
      });

      // Step 10: Test audit logging
      await prisma.auditLog.create({
        data: {
          userId: testUser.id,
          action: 'INTEGRATION_TEST',
          timestamp: new Date(),
          ipAddress: '127.0.0.1'
        }
      });

      // Step 11: Verify all components work together
      const finalVerification = await prisma.user.findMany({
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true
                }
              }
            }
          },
          submissions: {
            include: {
              review: true
            }
          },
          leaderboardEntries: true
        }
      });

      expect(finalVerification.length).toBeGreaterThanOrEqual(3);
      
      const adminUser = finalVerification.find(u => u.role.name === 'admin');
      expect(adminUser).toBeDefined();
      expect(adminUser!.role.rolePermissions.length).toBeGreaterThan(5);

      const participantUser = finalVerification.find(u => u.role.name === 'participant');
      expect(participantUser).toBeDefined();
      expect(participantUser!.submissions.length).toBe(1);
      expect(participantUser!.submissions[0].review).toBeDefined();
      expect(participantUser!.leaderboardEntries.length).toBe(1);

      console.log('✅ Complete system integration test passed!');
    }, 30000); // 30 second timeout for comprehensive test

    it('should handle system configuration correctly', async () => {
      // Test environment configuration
      expect(process.env.DATABASE_URL).toBeDefined();
      expect(process.env.JWT_SECRET).toBeDefined();
      expect(process.env.NODE_ENV).toBeDefined();

      // Test database connection
      await expect(prisma.$queryRaw`SELECT 1`).resolves.toBeDefined();

      // Test schema integrity
      const tables = await prisma.$queryRaw`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'
        ORDER BY name
      ` as Array<{ name: string }>;

      const expectedTables = [
        'Analytics', 'Attendance', 'AuditLog', 'BackupRecord', 'Contest',
        'ContestProblem', 'ContestState', 'ContestUser', 'Leaderboard',
        'Permission', 'Problem', 'QuestionProblem', 'Review', 'Role',
        'RolePermission', 'ScoreEvent', 'Seat', 'Submission', 'SystemControl', 'User'
      ];

      const tableNames = tables.map(t => t.name);
      for (const expectedTable of expectedTables) {
        expect(tableNames).toContain(expectedTable);
      }

      console.log('✅ System configuration test passed!');
    });
  });
});