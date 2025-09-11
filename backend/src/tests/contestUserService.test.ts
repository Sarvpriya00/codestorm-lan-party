import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient, ContestStatus, ParticipantStatus } from '@prisma/client';
import { ContestUserService } from '../services/contestUserService';

// Mock Prisma Client for testing
const mockPrisma = {
  contest: {
    findUnique: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  contestUser: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    updateMany: vi.fn(),
  },
  submission: {
    count: vi.fn(),
  },
} as any;

describe('ContestUserService', () => {
  let contestUserService: ContestUserService;

  beforeEach(() => {
    contestUserService = new ContestUserService(mockPrisma);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('joinContest', () => {
    const mockContest = {
      id: 'contest-1',
      name: 'Test Contest',
      status: ContestStatus.PLANNED,
      startTime: new Date(Date.now() + 86400000), // Tomorrow
      endTime: new Date(Date.now() + 172800000), // Day after tomorrow
    };

    const mockUser = {
      id: 'user-1',
      username: 'testuser',
      displayName: 'Test User',
    };

    const mockContestUser = {
      id: 'contest-user-1',
      contestId: 'contest-1',
      userId: 'user-1',
      joinedAt: new Date(),
      status: ParticipantStatus.ACTIVE,
    };

    it('should successfully join a contest', async () => {
      mockPrisma.contest.findUnique.mockResolvedValue(mockContest);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.contestUser.findUnique.mockResolvedValue(null); // Not already registered
      mockPrisma.contestUser.create.mockResolvedValue(mockContestUser);

      const result = await contestUserService.joinContest({
        contestId: 'contest-1',
        userId: 'user-1',
      });

      expect(result).toEqual(mockContestUser);
      expect(mockPrisma.contestUser.create).toHaveBeenCalledWith({
        data: {
          contestId: 'contest-1',
          userId: 'user-1',
          status: ParticipantStatus.ACTIVE,
        },
      });
    });

    it('should throw error if contest not found', async () => {
      mockPrisma.contest.findUnique.mockResolvedValue(null);

      await expect(
        contestUserService.joinContest({
          contestId: 'contest-1',
          userId: 'user-1',
        })
      ).rejects.toThrow('Contest with id contest-1 not found');
    });

    it('should throw error if user not found', async () => {
      mockPrisma.contest.findUnique.mockResolvedValue(mockContest);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        contestUserService.joinContest({
          contestId: 'contest-1',
          userId: 'user-1',
        })
      ).rejects.toThrow('User with id user-1 not found');
    });

    it('should throw error if user already registered', async () => {
      mockPrisma.contest.findUnique.mockResolvedValue(mockContest);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.contestUser.findUnique.mockResolvedValue(mockContestUser);

      await expect(
        contestUserService.joinContest({
          contestId: 'contest-1',
          userId: 'user-1',
        })
      ).rejects.toThrow('User is already registered for this contest');
    });

    it('should throw error if contest is ended', async () => {
      const endedContest = { ...mockContest, status: ContestStatus.ENDED };
      mockPrisma.contest.findUnique.mockResolvedValue(endedContest);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.contestUser.findUnique.mockResolvedValue(null);

      await expect(
        contestUserService.joinContest({
          contestId: 'contest-1',
          userId: 'user-1',
        })
      ).rejects.toThrow('Cannot join ended or archived contests');
    });

    it('should throw error if contest is archived', async () => {
      const archivedContest = { ...mockContest, status: ContestStatus.ARCHIVED };
      mockPrisma.contest.findUnique.mockResolvedValue(archivedContest);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.contestUser.findUnique.mockResolvedValue(null);

      await expect(
        contestUserService.joinContest({
          contestId: 'contest-1',
          userId: 'user-1',
        })
      ).rejects.toThrow('Cannot join ended or archived contests');
    });
  });

  describe('leaveContest', () => {
    const mockContestUser = {
      id: 'contest-user-1',
      contestId: 'contest-1',
      userId: 'user-1',
      joinedAt: new Date(),
      status: ParticipantStatus.ACTIVE,
    };

    const mockContest = {
      id: 'contest-1',
      status: ContestStatus.PLANNED,
    };

    it('should successfully leave contest without submissions (delete registration)', async () => {
      mockPrisma.contestUser.findUnique.mockResolvedValue(mockContestUser);
      mockPrisma.contest.findUnique.mockResolvedValue(mockContest);
      mockPrisma.submission.count.mockResolvedValue(0);
      mockPrisma.contestUser.delete.mockResolvedValue(mockContestUser);

      const result = await contestUserService.leaveContest('contest-1', 'user-1');

      expect(result).toEqual(mockContestUser);
      expect(mockPrisma.contestUser.delete).toHaveBeenCalledWith({
        where: {
          contestId_userId: {
            contestId: 'contest-1',
            userId: 'user-1',
          },
        },
      });
    });

    it('should mark as withdrawn if user has submissions', async () => {
      const withdrawnContestUser = { ...mockContestUser, status: ParticipantStatus.WITHDRAWN };
      mockPrisma.contestUser.findUnique.mockResolvedValue(mockContestUser);
      mockPrisma.contest.findUnique.mockResolvedValue(mockContest);
      mockPrisma.submission.count.mockResolvedValue(1);
      mockPrisma.contestUser.update.mockResolvedValue(withdrawnContestUser);

      const result = await contestUserService.leaveContest('contest-1', 'user-1');

      expect(result).toEqual(withdrawnContestUser);
      expect(mockPrisma.contestUser.update).toHaveBeenCalledWith({
        where: {
          contestId_userId: {
            contestId: 'contest-1',
            userId: 'user-1',
          },
        },
        data: {
          status: ParticipantStatus.WITHDRAWN,
        },
      });
    });

    it('should throw error if user not registered', async () => {
      mockPrisma.contestUser.findUnique.mockResolvedValue(null);

      await expect(
        contestUserService.leaveContest('contest-1', 'user-1')
      ).rejects.toThrow('User is not registered for this contest');
    });

    it('should throw error if contest is ended', async () => {
      const endedContest = { ...mockContest, status: ContestStatus.ENDED };
      mockPrisma.contestUser.findUnique.mockResolvedValue(mockContestUser);
      mockPrisma.contest.findUnique.mockResolvedValue(endedContest);

      await expect(
        contestUserService.leaveContest('contest-1', 'user-1')
      ).rejects.toThrow('Cannot withdraw from ended or archived contests');
    });
  });

  describe('updateParticipantStatus', () => {
    const mockContestUser = {
      id: 'contest-user-1',
      contestId: 'contest-1',
      userId: 'user-1',
      joinedAt: new Date(),
      status: ParticipantStatus.ACTIVE,
    };

    it('should successfully update participant status', async () => {
      const updatedContestUser = { ...mockContestUser, status: ParticipantStatus.DISQUALIFIED };
      mockPrisma.contestUser.findUnique.mockResolvedValue(mockContestUser);
      mockPrisma.contestUser.update.mockResolvedValue(updatedContestUser);

      const result = await contestUserService.updateParticipantStatus(
        'contest-1',
        'user-1',
        { status: ParticipantStatus.DISQUALIFIED }
      );

      expect(result).toEqual(updatedContestUser);
      expect(mockPrisma.contestUser.update).toHaveBeenCalledWith({
        where: {
          contestId_userId: {
            contestId: 'contest-1',
            userId: 'user-1',
          },
        },
        data: {
          status: ParticipantStatus.DISQUALIFIED,
        },
      });
    });

    it('should throw error if user not registered', async () => {
      mockPrisma.contestUser.findUnique.mockResolvedValue(null);

      await expect(
        contestUserService.updateParticipantStatus(
          'contest-1',
          'user-1',
          { status: ParticipantStatus.DISQUALIFIED }
        )
      ).rejects.toThrow('User is not registered for this contest');
    });

    it('should throw error for invalid status transition', async () => {
      const disqualifiedUser = { ...mockContestUser, status: ParticipantStatus.DISQUALIFIED };
      mockPrisma.contestUser.findUnique.mockResolvedValue(disqualifiedUser);

      await expect(
        contestUserService.updateParticipantStatus(
          'contest-1',
          'user-1',
          { status: ParticipantStatus.ACTIVE }
        )
      ).rejects.toThrow('Invalid status transition from DISQUALIFIED to ACTIVE');
    });
  });

  describe('getContestParticipants', () => {
    const mockParticipants = [
      {
        id: 'contest-user-1',
        contestId: 'contest-1',
        userId: 'user-1',
        joinedAt: new Date(),
        status: ParticipantStatus.ACTIVE,
        user: {
          id: 'user-1',
          username: 'user1',
          displayName: 'User One',
          scored: 100,
          problemsSolvedCount: 2,
        },
        contest: {
          id: 'contest-1',
          name: 'Test Contest',
          status: ContestStatus.RUNNING,
          startTime: new Date(),
          endTime: new Date(),
        },
      },
    ];

    it('should return contest participants', async () => {
      mockPrisma.contestUser.findMany.mockResolvedValue(mockParticipants);

      const result = await contestUserService.getContestParticipants('contest-1');

      expect(result).toEqual(mockParticipants);
      expect(mockPrisma.contestUser.findMany).toHaveBeenCalledWith({
        where: { contestId: 'contest-1' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              scored: true,
              problemsSolvedCount: true,
            },
          },
          contest: {
            select: {
              id: true,
              name: true,
              status: true,
              startTime: true,
              endTime: true,
            },
          },
        },
        orderBy: {
          joinedAt: 'asc',
        },
      });
    });

    it('should filter participants by status', async () => {
      mockPrisma.contestUser.findMany.mockResolvedValue(mockParticipants);

      await contestUserService.getContestParticipants('contest-1', {
        status: ParticipantStatus.ACTIVE,
      });

      expect(mockPrisma.contestUser.findMany).toHaveBeenCalledWith({
        where: { 
          contestId: 'contest-1',
          status: ParticipantStatus.ACTIVE,
        },
        include: expect.any(Object),
        orderBy: expect.any(Object),
      });
    });
  });

  describe('canUserJoinContest', () => {
    const mockContest = {
      id: 'contest-1',
      status: ContestStatus.PLANNED,
    };

    it('should return true if user can join contest', async () => {
      mockPrisma.contest.findUnique.mockResolvedValue(mockContest);
      mockPrisma.contestUser.findUnique.mockResolvedValue(null);

      const result = await contestUserService.canUserJoinContest('contest-1', 'user-1');

      expect(result).toEqual({
        canJoin: true,
        reasons: [],
      });
    });

    it('should return false if user already registered', async () => {
      const mockContestUser = {
        id: 'contest-user-1',
        contestId: 'contest-1',
        userId: 'user-1',
      };

      mockPrisma.contest.findUnique.mockResolvedValue(mockContest);
      mockPrisma.contestUser.findUnique.mockResolvedValue(mockContestUser);

      const result = await contestUserService.canUserJoinContest('contest-1', 'user-1');

      expect(result).toEqual({
        canJoin: false,
        reasons: ['User is already registered for this contest'],
      });
    });

    it('should return false if contest is ended', async () => {
      const endedContest = { ...mockContest, status: ContestStatus.ENDED };
      mockPrisma.contest.findUnique.mockResolvedValue(endedContest);
      mockPrisma.contestUser.findUnique.mockResolvedValue(null);

      const result = await contestUserService.canUserJoinContest('contest-1', 'user-1');

      expect(result).toEqual({
        canJoin: false,
        reasons: ['Cannot join ended or archived contests'],
      });
    });
  });

  describe('getContestParticipationStats', () => {
    it('should return participation statistics', async () => {
      mockPrisma.contestUser.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8)  // active
        .mockResolvedValueOnce(1)  // withdrawn
        .mockResolvedValueOnce(1)  // disqualified
        .mockResolvedValueOnce(6); // with submissions

      const result = await contestUserService.getContestParticipationStats('contest-1');

      expect(result).toEqual({
        totalParticipants: 10,
        activeParticipants: 8,
        withdrawnParticipants: 1,
        disqualifiedParticipants: 1,
        participantsWithSubmissions: 6,
      });
    });
  });

  describe('bulkUpdateParticipantStatus', () => {
    const mockContest = {
      id: 'contest-1',
      name: 'Test Contest',
    };

    const mockRegistrations = [
      { id: 'reg-1', contestId: 'contest-1', userId: 'user-1' },
      { id: 'reg-2', contestId: 'contest-1', userId: 'user-2' },
    ];

    it('should successfully bulk update participant statuses', async () => {
      mockPrisma.contest.findUnique.mockResolvedValue(mockContest);
      mockPrisma.contestUser.findMany.mockResolvedValue(mockRegistrations);
      mockPrisma.contestUser.updateMany.mockResolvedValue({ count: 2 });

      const result = await contestUserService.bulkUpdateParticipantStatus(
        'contest-1',
        ['user-1', 'user-2'],
        ParticipantStatus.DISQUALIFIED
      );

      expect(result).toBe(2);
      expect(mockPrisma.contestUser.updateMany).toHaveBeenCalledWith({
        where: {
          contestId: 'contest-1',
          userId: { in: ['user-1', 'user-2'] },
        },
        data: { status: ParticipantStatus.DISQUALIFIED },
      });
    });

    it('should throw error if contest not found', async () => {
      mockPrisma.contest.findUnique.mockResolvedValue(null);

      await expect(
        contestUserService.bulkUpdateParticipantStatus(
          'contest-1',
          ['user-1', 'user-2'],
          ParticipantStatus.DISQUALIFIED
        )
      ).rejects.toThrow('Contest with id contest-1 not found');
    });

    it('should throw error if some users not registered', async () => {
      mockPrisma.contest.findUnique.mockResolvedValue(mockContest);
      mockPrisma.contestUser.findMany.mockResolvedValue([mockRegistrations[0]]); // Only one user found

      await expect(
        contestUserService.bulkUpdateParticipantStatus(
          'contest-1',
          ['user-1', 'user-2'],
          ParticipantStatus.DISQUALIFIED
        )
      ).rejects.toThrow('Some users are not registered for this contest');
    });
  });
});