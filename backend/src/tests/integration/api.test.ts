import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import express from 'express';

// Import your app or create a test app
const app = express();

const prisma = new PrismaClient();

describe('API Integration Tests - Enhanced', () => {
  let adminToken: string;
  let judgeToken: string;
  let participantToken: string;
  let adminUser: any;
  let judgeUser: any;
  let participantUser: any;
  let testContest: any;

  beforeAll(async () => {
    // Set up test database with roles and permissions
    await setupTestDatabase();
    
    // Create test users with different roles
    const testUsers = await createTestUsers();
    adminUser = testUsers.admin;
    judgeUser = testUsers.judge;
    participantUser = testUsers.participant;

    // Generate JWT tokens for testing
    adminToken = generateTestToken(adminUser);
    judgeToken = generateTestToken(judgeUser);
    participantToken = generateTestToken(participantUser);

    // Create a test contest
    testContest = await createTestContest();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await cleanupTestData();
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/login', () => {
      it('should authenticate user with valid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: 'admin',
            password: 'password123'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.token).toBeDefined();
        expect(response.body.data.user.username).toBe('admin');
      });

      it('should reject invalid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: 'admin',
            password: 'wrongpassword'
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
      });

      it('should reject non-existent user', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: 'nonexistent',
            password: 'password123'
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });

      it('should handle missing credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('POST /api/auth/register', () => {
      it('should register new user with valid data', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'newuser',
            password: 'password123',
            displayName: 'New User'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user.username).toBe('newuser');
      });

      it('should reject duplicate username', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'admin', // Already exists
            password: 'password123'
          });

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('USER_ALREADY_EXISTS');
      });
    });
  });

  describe('Permission-based Access Control', () => {
    describe('Admin Endpoints', () => {
      it('should allow admin access to user management', async () => {
        const response = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should deny non-admin access to user management', async () => {
        const response = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${participantToken}`);

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('ACCESS_DENIED_PERMISSION');
      });

      it('should allow admin to create contests', async () => {
        const response = await request(app)
          .post('/api/admin/contests')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Test Contest',
            description: 'A test contest',
            startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString()
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Test Contest');
      });

      it('should validate contest data', async () => {
        const response = await request(app)
          .post('/api/admin/contests')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: '', // Invalid empty name
            description: 'A test contest'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('Judge Endpoints', () => {
      it('should allow judge access to queue', async () => {
        const response = await request(app)
          .get('/api/judge/queue')
          .set('Authorization', `Bearer ${judgeToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should deny participant access to judge queue', async () => {
        const response = await request(app)
          .get('/api/judge/queue')
          .set('Authorization', `Bearer ${participantToken}`);

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
      });

      it('should allow judge to claim submissions', async () => {
        // First create a submission
        const submission = await createTestSubmission(participantUser.id, testContest.id);

        const response = await request(app)
          .post(`/api/judge/submissions/${submission.id}/claim`)
          .set('Authorization', `Bearer ${judgeToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.reviewedById).toBe(judgeUser.id);
      });

      it('should allow judge to submit reviews', async () => {
        const submission = await createTestSubmission(participantUser.id, testContest.id);
        
        // Claim the submission first
        await request(app)
          .post(`/api/judge/submissions/${submission.id}/claim`)
          .set('Authorization', `Bearer ${judgeToken}`);

        const response = await request(app)
          .post(`/api/judge/submissions/${submission.id}/review`)
          .set('Authorization', `Bearer ${judgeToken}`)
          .send({
            correct: true,
            scoreAwarded: 100,
            remarks: 'Good solution'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.correct).toBe(true);
      });
    });

    describe('Participant Endpoints', () => {
      it('should allow participant to view problems', async () => {
        const response = await request(app)
          .get(`/api/contests/${testContest.id}/problems`)
          .set('Authorization', `Bearer ${participantToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should allow participant to submit solutions', async () => {
        const problem = await createTestProblem(testContest.id);

        const response = await request(app)
          .post(`/api/contests/${testContest.id}/problems/${problem.id}/submit`)
          .set('Authorization', `Bearer ${participantToken}`)
          .send({
            codeText: 'console.log("Hello World");'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.submittedById).toBe(participantUser.id);
      });

      it('should allow participant to view own submissions', async () => {
        const response = await request(app)
          .get('/api/submissions/my')
          .set('Authorization', `Bearer ${participantToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should deny participant access to other users submissions', async () => {
        const response = await request(app)
          .get(`/api/users/${judgeUser.id}/submissions`)
          .set('Authorization', `Bearer ${participantToken}`);

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Contest Management', () => {
    it('should handle contest lifecycle', async () => {
      // Create contest
      const createResponse = await request(app)
        .post('/api/admin/contests')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Lifecycle Test Contest',
          description: 'Testing contest lifecycle'
        });

      expect(createResponse.status).toBe(201);
      const contestId = createResponse.body.data.id;

      // Update contest status to RUNNING
      const updateResponse = await request(app)
        .patch(`/api/admin/contests/${contestId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'RUNNING' });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.status).toBe('RUNNING');

      // End contest
      const endResponse = await request(app)
        .patch(`/api/admin/contests/${contestId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ENDED' });

      expect(endResponse.status).toBe(200);
      expect(endResponse.body.data.status).toBe('ENDED');
    });

    it('should validate contest status transitions', async () => {
      const contest = await createTestContest('ENDED');

      const response = await request(app)
        .patch(`/api/admin/contests/${contest.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'RUNNING' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid status transition');
    });
  });

  describe('Real-time Features', () => {
    it('should update leaderboard after submission review', async () => {
      const problem = await createTestProblem(testContest.id);
      const submission = await createTestSubmission(participantUser.id, testContest.id, problem.id);

      // Submit review
      await request(app)
        .post(`/api/judge/submissions/${submission.id}/claim`)
        .set('Authorization', `Bearer ${judgeToken}`);

      await request(app)
        .post(`/api/judge/submissions/${submission.id}/review`)
        .set('Authorization', `Bearer ${judgeToken}`)
        .send({
          correct: true,
          scoreAwarded: 100,
          remarks: 'Excellent solution'
        });

      // Check leaderboard
      const leaderboardResponse = await request(app)
        .get(`/api/contests/${testContest.id}/leaderboard`)
        .set('Authorization', `Bearer ${participantToken}`);

      expect(leaderboardResponse.status).toBe(200);
      expect(leaderboardResponse.body.data.length).toBeGreaterThan(0);
      
      const userEntry = leaderboardResponse.body.data.find(
        (entry: any) => entry.userId === participantUser.id
      );
      expect(userEntry).toBeDefined();
      expect(userEntry.score).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_JSON');
    });

    it('should handle missing authentication', async () => {
      const response = await request(app)
        .get('/api/admin/users');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_TOKEN_REQUIRED');
    });

    it('should handle invalid resource IDs', async () => {
      const response = await request(app)
        .get('/api/contests/invalid-uuid')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ID_FORMAT');
    });

    it('should handle non-existent resources', async () => {
      const response = await request(app)
        .get('/api/contests/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/contests')
          .set('Authorization', `Bearer ${participantToken}`)
      );

      const responses = await Promise.all(requests);
      
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  // Helper functions
  async function setupTestDatabase() {
    // Create roles
    const adminRole = await prisma.role.create({
      data: { name: 'ADMIN', description: 'Administrator role' }
    });

    const judgeRole = await prisma.role.create({
      data: { name: 'JUDGE', description: 'Judge role' }
    });

    const participantRole = await prisma.role.create({
      data: { name: 'PARTICIPANT', description: 'Participant role' }
    });

    // Create permissions
    const permissions = [
      { code: 100, name: 'Dashboard', description: 'Access dashboard' },
      { code: 200, name: 'Problems', description: 'Access problems' },
      { code: 300, name: 'Judge Queue', description: 'Access judge queue' },
      { code: 500, name: 'Users', description: 'Manage users' },
      { code: 600, name: 'Analytics', description: 'View analytics' }
    ];

    for (const perm of permissions) {
      await prisma.permission.create({ data: perm });
    }

    // Assign permissions to roles
    const adminPermissions = [100, 200, 300, 500, 600];
    const judgePermissions = [300];
    const participantPermissions = [200];

    for (const code of adminPermissions) {
      const permission = await prisma.permission.findUnique({ where: { code } });
      await prisma.rolePermission.create({
        data: { roleId: adminRole.id, permissionId: permission!.id }
      });
    }

    for (const code of judgePermissions) {
      const permission = await prisma.permission.findUnique({ where: { code } });
      await prisma.rolePermission.create({
        data: { roleId: judgeRole.id, permissionId: permission!.id }
      });
    }

    for (const code of participantPermissions) {
      const permission = await prisma.permission.findUnique({ where: { code } });
      await prisma.rolePermission.create({
        data: { roleId: participantRole.id, permissionId: permission!.id }
      });
    }
  }

  async function createTestUsers() {
    const hashedPassword = await bcrypt.hash('password123', 10);

    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    const judgeRole = await prisma.role.findUnique({ where: { name: 'JUDGE' } });
    const participantRole = await prisma.role.findUnique({ where: { name: 'PARTICIPANT' } });

    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        roleId: adminRole!.id,
        displayName: 'Admin User'
      }
    });

    const judge = await prisma.user.create({
      data: {
        username: 'judge',
        password: hashedPassword,
        roleId: judgeRole!.id,
        displayName: 'Judge User'
      }
    });

    const participant = await prisma.user.create({
      data: {
        username: 'participant',
        password: hashedPassword,
        roleId: participantRole!.id,
        displayName: 'Participant User'
      }
    });

    return { admin, judge, participant };
  }

  function generateTestToken(user: any) {
    return jwt.sign(
      {
        userId: user.id,
        role: { id: user.roleId, name: user.role?.name },
        roleId: user.roleId
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  }

  async function createTestContest(status = 'PLANNED') {
    return await prisma.contest.create({
      data: {
        name: 'Test Contest',
        description: 'A test contest for integration testing',
        status: status as any
      }
    });
  }

  async function createTestProblem(contestId: string) {
    const problem = await prisma.questionProblem.create({
      data: {
        questionText: 'Test Problem\n\nSolve this test problem.',
        difficultyLevel: 'EASY',
        maxScore: 100,
        createdById: adminUser.id
      }
    });

    await prisma.contestProblem.create({
      data: {
        contestId,
        problemId: problem.id,
        order: 1,
        points: 100
      }
    });

    return problem;
  }

  async function createTestSubmission(userId: string, contestId: string, problemId?: string) {
    if (!problemId) {
      const problem = await createTestProblem(contestId);
      problemId = problem.id;
    }

    return await prisma.submission.create({
      data: {
        problemId,
        contestId,
        submittedById: userId,
        codeText: 'console.log("Test solution");',
        status: 'PENDING'
      }
    });
  }

  async function cleanupTestData() {
    // Clean up in correct order due to foreign key constraints
    await prisma.review.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.contestProblem.deleteMany();
    await prisma.questionProblem.deleteMany();
    await prisma.contestUser.deleteMany();
    await prisma.leaderboard.deleteMany();
    await prisma.analytics.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.systemControl.deleteMany();
    await prisma.auditLog.deleteMany();
  }

  async function cleanupTestDatabase() {
    await cleanupTestData();
    await prisma.contest.deleteMany();
    await prisma.user.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();
  }
});