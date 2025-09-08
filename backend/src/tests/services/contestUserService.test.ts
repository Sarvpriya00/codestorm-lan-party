import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient, ContestStatus, Difficulty, ParticipantStatus } from '@prisma/client';
import { ContestUserService } from '../../services/contestUserService';

const prisma = new PrismaClient();
const contestUserService = new ContestUserService(prisma);

describe('ContestUserService', () => {
  let testContest: any;
  let testUser: any;
  let testRole: any;

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
        name: 'participant',
        description: 'Participant role'
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

  describe('joinContest', () => {
    it('should allow user to join a contest', async () => {
      const data = {
        contestId: testContest.id,
        userId: testUser.id
      };

      const contestUser = await contestUserService.joinContest(data);

      expect(contestUser).toBeDefined();
      expect(contestUser.contestId).toBe(testContest.id);
      expect(contestUser.userId).toBe(testUser.id);
      expect(contestUser.status).toBe(ParticipantStatus.ACTIVE);
    });

    it('should throw error for non-existent contest', async () => {
      const data = {
        contestId: 'non-existent-id',
        userId: testUser.id
      };

      await expect(contestUserService.joinContest(data))
        .rejects.toThrow('Contest with id non-existent-id not found');
    });

    it('should throw error for non-existent user', async () => {
      const data = {
        contestId: testContest.id,
        userId: 'non-existent-id'
      };

      await expect(contestUserService.joinContest(data))
        .rejects.toThrow('User with id non-existent-id not found');
    });

    it('should throw error if user is already registered', async () => {
      const data = {
        contestId: testContest.id,
        userId: testUser.id
      };

      await contestUserService.joinContest(data);

      await expect(contestUserService.joinContest(data))
        .rejects.toThrow('User is already registered for this contest');
    });

    it('should throw error for ended contests', async () => {
      // Update contest to ended status
      await prisma.contest.update({
        where: { id: testContest.id },
        data: { status: ContestStatus.ENDED }
      });

      const data = {
        contestId: testContest.id,
        userId: testUser.id
      };

      await expect(contestUserService.joinContest(data))
        .rejects.toThrow('Cannot join ended or archived contests');
    });
  });

  describe('leaveContest', () => {
    it('should allow user to leave contest without submissions', async () => {
      // Join contest first
      await contestUserService.joinContest({
        contestId: testContest.id,
        userId: testUser.id
      });

      const result = await contestUserService.leaveContest(testContest.id, testUser.id);

      expect(result).toBeDefined();

      // Verify user is no longer registered
      const contestUser = await contestUserService.getContestUser(testContest.id, testUser.id);
      expect(contestUser).toBeNull();
    });

    it('should mark as withdrawn if user has submissions', async () => {
      // Join contest first
      await contestUserService.joinContest({
        contestId: testContest.id,
        userId: testUser.id
      });

      // Create a problem and submission
      const problem = await prisma.questionProblem.create({
        data: {
          questionText: 'Test problem',
          difficultyLevel: Difficulty.EASY,
          maxScore: 100,
          createdById: testUser.id
        }
      });

      await prisma.submission.create({
        data: {
          problemId: problem.id,
          contestId: testContest.id,
          submittedById: testUser.id,
          codeText: 'test code'
        }
      });

      const result = await contestUserService.leaveContest(testContest.id, testUser.id);

      expect(result.status).toBe(ParticipantStatus.WITHDRAWN);

      // Verify user is still registered but withdrawn
      const contestUser = await contestUserService.getContestUser(testContest.id, testUser.id);
      expect(contestUser).toBeDefined();
      expect(contestUser?.status).toBe(ParticipantStatus.WITHDRAWN);
    });

    it('should throw error if user is not registered', async () => {
      await expect(contestUserService.leaveContest(testContest.id, testUser.id))
        .rejects.toThrow('User is not registered for this contest');
    });

    it('should throw error for ended contests', async () => {
      // Join contest first
      await contestUserService.joinContest({
        contestId: testContest.id,
        userId: testUser.id
      });

      // Update contest to ended status
      await prisma.contest.update({
        where: { id: testContest.id },
        data: { status: ContestStatus.ENDED }
      });

      await expect(contestUserService.leaveContest(testContest.id, testUser.id))
        .rejects.toThrow('Cannot withdraw from ended or archived contests');
    });
  });

  describe('updateParticipantStatus', () => {
    it('should update participant status with valid transition', async () => {
      // Join contest first
      await contestUserService.joinContest({
        contestId: testContest.id,
        userId: testUser.id
      });

      const result = await contestUserService.updateParticipantStatus(
        testContest.id,
        testUser.id,
        { status: ParticipantStatus.DISQUALIFIED }
      );

      expect(result.status).toBe(ParticipantStatus.DISQUALIFIED);
    });

    it('should throw error for invalid status transition', async () => {
      // Join contest first
      await contestUserService.joinContest({
        contestId: testContest.id,
        userId: testUser.id
      });

      // Update to disqualified first
      await contestUserService.updateParticipantStatus(
        testContest.id,
        testUser.id,
        { status: ParticipantStatus.DISQUALIFIED }
      );

      // Try to transition from disqualified to active (invalid)
      await expect(contestUserService.updateParticipantStatus(
        testContest.id,
        testUser.id,
        { status: ParticipantStatus.ACTIVE }
      )).rejects.toThrow('Invalid status transition from DISQUALIFIED to ACTIVE');
    });

    it('should throw error if user is not registered', async () => {
      await expect(contestUserService.updateParticipantStatus(
        testContest.id,
        testUser.id,
        { status: ParticipantStatus.DISQUALIFIED }
      )).rejects.toThrow('User is not registered for this contest');
    });
  });

  describe('getContestParticipants', () => {
    it('should return contest participants', async () => {
      // Create another user
      const user2 = await prisma.user.create({
        data: {
          username: 'testuser2',
          password: 'hashedpassword',
          roleId: testRole.id
        }
      });

      // Join both users to contest
      await contestUserService.joinContest({
        contestId: testContest.id,
        userId: testUser.id
      });

      await contestUserService.joinContest({
        contestId: testContest.id,
        userId: user2.id
      });

      const participants = await contestUserService.getContestParticipants(testContest.id);

      expect(participants).toHaveLength(2);
      expect(participants[0].user.username).toBeDefined();
      expect(participants[0].contest.name).toBeDefined();
    });

    it('should filter participants by status', async () => {
      // Join user to contest
      await contestUserService.joinContest({
        contestId: testContest.id,
        userId: testUser.id
      });

      // Update status to withdrawn
      await contestUserService.updateParticipantStatus(
        testContest.id,
        testUser.id,
        { status: ParticipantStatus.WITHDRAWN }
      );

      const activeParticipants = await contestUserService.getContestParticipants(
        testContest.id,
        { status: ParticipantStatus.ACTIVE }
      );

      const withdrawnParticipants = await contestUserService.getContestParticipants(
        testContest.id,
        { status: ParticipantStatus.WITHDRAWN }
      );

      expect(activeParticipants).toHaveLength(0);
      expect(withdrawnParticipants).toHaveLength(1);
    });
  });

  describe('getUserContests', () => {
    it('should return user contest participations', async () => {
      // Create another contest
      const contest2 = await prisma.contest.create({
        data: {
          name: 'Test Contest 2',
          status: ContestStatus.PLANNED
        }
      });

      // Join both contests
      await contestUserService.joinContest({
        contestId: testContest.id,
        userId: testUser.id
      });

      await contestUserService.joinContest({
        contestId: contest2.id,
        userId: testUser.id
      });

      const userContests = await contestUserService.getUserContests(testUser.id);

      expect(userContests).toHaveLength(2);
      expect(userContests[0].contest.name).toBeDefined();
    });
  });

  describe('getContestParticipationStats', () => {
    it('should return correct participation statistics', async () => {
      // Create additional users
      const user2 = await prisma.user.create({
        data: {
          username: 'testuser2',
          password: 'hashedpassword',
          roleId: testRole.id
        }
      });

      const user3 = await prisma.user.create({
        data: {
          username: 'testuser3',
          password: 'hashedpassword',
          roleId: testRole.id
        }
      });

      // Join users to contest
      await contestUserService.joinContest({
        contestId: testContest.id,
        userId: testUser.id
      });

      await contestUserService.joinContest({
        contestId: testContest.id,
        userId: user2.id
      });

      await contestUserService.joinContest({
        contestId: testContest.id,
        userId: user3.id
      });

      // Update statuses
      await contestUserService.updateParticipantStatus(
        testContest.id,
        user2.id,
        { status: ParticipantStatus.WITHDRAWN }
      );

      await contestUserService.updateParticipantStatus(
        testContest.id,
        user3.id,
        { status: ParticipantStatus.DISQUALIFIED }
      );

      const stats = await contestUserService.getContestParticipationStats(testContest.id);

      expect(stats.totalParticipants).toBe(3);
      expect(stats.activeParticipants).toBe(1);
      expect(stats.withdrawnParticipants).toBe(1);
      expect(stats.disqualifiedParticipants).toBe(1);
    });
  });

  describe('bulkUpdateParticipantStatus', () => {
    it('should update multiple participants status', async () => {
      // Create additional user
      const user2 = await prisma.user.create({
        data: {
          username: 'testuser2',
          password: 'hashedpassword',
          roleId: testRole.id
        }
      });

      // Join both users to contest
      await contestUserService.joinContest({
        contestId: testContest.id,
        userId: testUser.id
      });

      await contestUserService.joinContest({
        contestId: testContest.id,
        userId: user2.id
      });

      const updatedCount = await contestUserService.bulkUpdateParticipantStatus(
        testContest.id,
        [testUser.id, user2.id],
        ParticipantStatus.DISQUALIFIED
      );

      expect(updatedCount).toBe(2);

      // Verify both users are disqualified
      const participants = await contestUserService.getContestParticipants(testContest.id);
      expect(participants.every(p => p.status === ParticipantStatus.DISQUALIFIED)).toBe(true);
    });

    it('should throw error if some users are not registered', async () => {
      await expect(contestUserService.bulkUpdateParticipantStatus(
        testContest.id,
        [testUser.id, 'non-existent-id'],
        ParticipantStatus.DISQUALIFIED
      )).rejects.toThrow('Some users are not registered for this contest');
    });
  });

  describe('canUserJoinContest', () => {
    it('should return true for eligible user', async () => {
      const eligibility = await contestUserService.canUserJoinContest(testContest.id, testUser.id);

      expect(eligibility.canJoin).toBe(true);
      expect(eligibility.reasons).toHaveLength(0);
    });

    it('should return false for already registered user', async () => {
      // Join contest first
      await contestUserService.joinContest({
        contestId: testContest.id,
        userId: testUser.id
      });

      const eligibility = await contestUserService.canUserJoinContest(testContest.id, testUser.id);

      expect(eligibility.canJoin).toBe(false);
      expect(eligibility.reasons).toContain('User is already registered for this contest');
    });

    it('should return false for ended contest', async () => {
      // Update contest to ended status
      await prisma.contest.update({
        where: { id: testContest.id },
        data: { status: ContestStatus.ENDED }
      });

      const eligibility = await contestUserService.canUserJoinContest(testContest.id, testUser.id);

      expect(eligibility.canJoin).toBe(false);
      expect(eligibility.reasons).toContain('Cannot join ended or archived contests');
    });
  });
});