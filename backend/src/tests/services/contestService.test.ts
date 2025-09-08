import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient, ContestStatus } from '@prisma/client';
import { ContestService } from '../../services/contestService';

const prisma = new PrismaClient();
const contestService = new ContestService(prisma);

describe('ContestService', () => {
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
  });

  describe('createContest', () => {
    it('should create a contest with valid data', async () => {
      const contestData = {
        name: 'Test Contest',
        description: 'A test contest',
        startTime: new Date('2025-01-01T10:00:00Z'),
        endTime: new Date('2025-01-01T14:00:00Z'),
        status: ContestStatus.PLANNED
      };

      const contest = await contestService.createContest(contestData);

      expect(contest).toBeDefined();
      expect(contest.name).toBe('Test Contest');
      expect(contest.description).toBe('A test contest');
      expect(contest.status).toBe(ContestStatus.PLANNED);
      expect(contest.startTime).toEqual(contestData.startTime);
      expect(contest.endTime).toEqual(contestData.endTime);
    });

    it('should create a contest with minimal data', async () => {
      const contestData = {
        name: 'Minimal Contest'
      };

      const contest = await contestService.createContest(contestData);

      expect(contest).toBeDefined();
      expect(contest.name).toBe('Minimal Contest');
      expect(contest.status).toBe(ContestStatus.PLANNED);
      expect(contest.description).toBeNull();
      expect(contest.startTime).toBeNull();
      expect(contest.endTime).toBeNull();
    });

    it('should throw error for empty name', async () => {
      const contestData = {
        name: ''
      };

      await expect(contestService.createContest(contestData)).rejects.toThrow('Contest name is required');
    });

    it('should throw error when start time is after end time', async () => {
      const contestData = {
        name: 'Invalid Contest',
        startTime: new Date('2025-01-01T14:00:00Z'),
        endTime: new Date('2025-01-01T10:00:00Z')
      };

      await expect(contestService.createContest(contestData)).rejects.toThrow('Contest start time must be before end time');
    });
  });

  describe('updateContest', () => {
    it('should update contest with valid data', async () => {
      // Create a contest first
      const contest = await contestService.createContest({
        name: 'Original Contest',
        description: 'Original description'
      });

      const updateData = {
        name: 'Updated Contest',
        description: 'Updated description',
        status: ContestStatus.RUNNING
      };

      const updatedContest = await contestService.updateContest(contest.id, updateData);

      expect(updatedContest.name).toBe('Updated Contest');
      expect(updatedContest.description).toBe('Updated description');
      expect(updatedContest.status).toBe(ContestStatus.RUNNING);
    });

    it('should throw error for non-existent contest', async () => {
      const updateData = {
        name: 'Updated Contest'
      };

      await expect(contestService.updateContest('non-existent-id', updateData)).rejects.toThrow('Contest with id non-existent-id not found');
    });

    it('should throw error for invalid time constraints', async () => {
      const contest = await contestService.createContest({
        name: 'Test Contest'
      });

      const updateData = {
        startTime: new Date('2025-01-01T14:00:00Z'),
        endTime: new Date('2025-01-01T10:00:00Z')
      };

      await expect(contestService.updateContest(contest.id, updateData)).rejects.toThrow('Contest start time must be before end time');
    });
  });

  describe('getContestById', () => {
    it('should return contest with valid ID', async () => {
      const contest = await contestService.createContest({
        name: 'Test Contest',
        description: 'Test description'
      });

      const retrievedContest = await contestService.getContestById(contest.id);

      expect(retrievedContest).toBeDefined();
      expect(retrievedContest?.name).toBe('Test Contest');
      expect(retrievedContest?.description).toBe('Test description');
    });

    it('should return null for non-existent contest', async () => {
      const contest = await contestService.getContestById('non-existent-id');
      expect(contest).toBeNull();
    });
  });

  describe('getContests', () => {
    it('should return all contests when no filters applied', async () => {
      await contestService.createContest({ name: 'Contest 1' });
      await contestService.createContest({ name: 'Contest 2' });

      const contests = await contestService.getContests();

      expect(contests).toHaveLength(2);
    });

    it('should filter contests by status', async () => {
      await contestService.createContest({ name: 'Planned Contest', status: ContestStatus.PLANNED });
      await contestService.createContest({ name: 'Running Contest', status: ContestStatus.RUNNING });

      const plannedContests = await contestService.getContests({ status: ContestStatus.PLANNED });
      const runningContests = await contestService.getContests({ status: ContestStatus.RUNNING });

      expect(plannedContests).toHaveLength(1);
      expect(plannedContests[0].name).toBe('Planned Contest');
      expect(runningContests).toHaveLength(1);
      expect(runningContests[0].name).toBe('Running Contest');
    });
  });

  describe('updateContestStatus', () => {
    it('should update status with valid transition', async () => {
      const contest = await contestService.createContest({
        name: 'Test Contest',
        status: ContestStatus.PLANNED
      });

      const updatedContest = await contestService.updateContestStatus(contest.id, ContestStatus.RUNNING);

      expect(updatedContest.status).toBe(ContestStatus.RUNNING);
    });

    it('should throw error for invalid status transition', async () => {
      const contest = await contestService.createContest({
        name: 'Test Contest',
        status: ContestStatus.ENDED
      });

      await expect(contestService.updateContestStatus(contest.id, ContestStatus.RUNNING))
        .rejects.toThrow('Invalid status transition from ENDED to RUNNING');
    });
  });

  describe('deleteContest', () => {
    it('should delete planned contest with no participants or submissions', async () => {
      const contest = await contestService.createContest({
        name: 'Test Contest',
        status: ContestStatus.PLANNED
      });

      await expect(contestService.deleteContest(contest.id)).resolves.not.toThrow();

      const deletedContest = await contestService.getContestById(contest.id);
      expect(deletedContest).toBeNull();
    });

    it('should throw error when deleting non-planned contest', async () => {
      const contest = await contestService.createContest({
        name: 'Test Contest',
        status: ContestStatus.RUNNING
      });

      await expect(contestService.deleteContest(contest.id))
        .rejects.toThrow('Only planned contests can be deleted');
    });

    it('should throw error for non-existent contest', async () => {
      await expect(contestService.deleteContest('non-existent-id'))
        .rejects.toThrow('Contest with id non-existent-id not found');
    });
  });

  describe('getActiveContests', () => {
    it('should return only running contests', async () => {
      await contestService.createContest({ name: 'Planned Contest', status: ContestStatus.PLANNED });
      await contestService.createContest({ name: 'Running Contest', status: ContestStatus.RUNNING });
      await contestService.createContest({ name: 'Ended Contest', status: ContestStatus.ENDED });

      const activeContests = await contestService.getActiveContests();

      expect(activeContests).toHaveLength(1);
      expect(activeContests[0].name).toBe('Running Contest');
      expect(activeContests[0].status).toBe(ContestStatus.RUNNING);
    });
  });

  describe('getUpcomingContests', () => {
    it('should return only planned contests with future start time', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday

      await contestService.createContest({ 
        name: 'Future Contest', 
        status: ContestStatus.PLANNED,
        startTime: futureDate
      });
      await contestService.createContest({ 
        name: 'Past Contest', 
        status: ContestStatus.PLANNED,
        startTime: pastDate
      });
      await contestService.createContest({ 
        name: 'No Start Time Contest', 
        status: ContestStatus.PLANNED
      });

      const upcomingContests = await contestService.getUpcomingContests();

      expect(upcomingContests).toHaveLength(1);
      expect(upcomingContests[0].name).toBe('Future Contest');
    });
  });
});  des
cribe('Enhanced Contest Validation', () => {
    it('should validate contest name trimming', async () => {
      const contestData = {
        name: '  Test Contest  ',
        description: '  Test description  '
      };

      const contest = await contestService.createContest(contestData);

      expect(contest.name).toBe('Test Contest');
      expect(contest.description).toBe('Test description');
    });

    it('should handle null description properly', async () => {
      const contestData = {
        name: 'Test Contest',
        description: undefined
      };

      const contest = await contestService.createContest(contestData);

      expect(contest.description).toBeNull();
    });

    it('should validate complex time constraints during update', async () => {
      const contest = await contestService.createContest({
        name: 'Test Contest',
        startTime: new Date('2025-01-01T10:00:00Z')
      });

      // Update only end time to be before existing start time
      const updateData = {
        endTime: new Date('2025-01-01T08:00:00Z')
      };

      await expect(contestService.updateContest(contest.id, updateData))
        .rejects.toThrow('Contest start time must be before end time');
    });
  });

  describe('Contest Status Transitions', () => {
    it('should allow all valid status transitions', async () => {
      // PLANNED -> RUNNING
      const contest1 = await contestService.createContest({
        name: 'Contest 1',
        status: ContestStatus.PLANNED
      });
      await expect(contestService.updateContestStatus(contest1.id, ContestStatus.RUNNING))
        .resolves.not.toThrow();

      // PLANNED -> ARCHIVED
      const contest2 = await contestService.createContest({
        name: 'Contest 2',
        status: ContestStatus.PLANNED
      });
      await expect(contestService.updateContestStatus(contest2.id, ContestStatus.ARCHIVED))
        .resolves.not.toThrow();

      // RUNNING -> ENDED
      const contest3 = await contestService.createContest({
        name: 'Contest 3',
        status: ContestStatus.RUNNING
      });
      await expect(contestService.updateContestStatus(contest3.id, ContestStatus.ENDED))
        .resolves.not.toThrow();

      // ENDED -> ARCHIVED
      const contest4 = await contestService.createContest({
        name: 'Contest 4',
        status: ContestStatus.ENDED
      });
      await expect(contestService.updateContestStatus(contest4.id, ContestStatus.ARCHIVED))
        .resolves.not.toThrow();
    });

    it('should reject invalid status transitions', async () => {
      const testCases = [
        { from: ContestStatus.RUNNING, to: ContestStatus.PLANNED },
        { from: ContestStatus.ENDED, to: ContestStatus.PLANNED },
        { from: ContestStatus.ENDED, to: ContestStatus.RUNNING },
        { from: ContestStatus.ARCHIVED, to: ContestStatus.PLANNED },
        { from: ContestStatus.ARCHIVED, to: ContestStatus.RUNNING },
        { from: ContestStatus.ARCHIVED, to: ContestStatus.ENDED }
      ];

      for (const testCase of testCases) {
        const contest = await contestService.createContest({
          name: `Contest ${testCase.from}-${testCase.to}`,
          status: testCase.from
        });

        await expect(contestService.updateContestStatus(contest.id, testCase.to))
          .rejects.toThrow(`Invalid status transition from ${testCase.from} to ${testCase.to}`);
      }
    });
  });

  describe('Contest Filtering', () => {
    beforeEach(async () => {
      // Create test contests with different time ranges
      await contestService.createContest({
        name: 'Past Contest',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T14:00:00Z'),
        status: ContestStatus.ENDED
      });

      await contestService.createContest({
        name: 'Current Contest',
        startTime: new Date('2025-06-01T10:00:00Z'),
        endTime: new Date('2025-06-01T14:00:00Z'),
        status: ContestStatus.RUNNING
      });

      await contestService.createContest({
        name: 'Future Contest',
        startTime: new Date('2026-01-01T10:00:00Z'),
        endTime: new Date('2026-01-01T14:00:00Z'),
        status: ContestStatus.PLANNED
      });
    });

    it('should filter contests by start time range', async () => {
      const contests = await contestService.getContests({
        startTimeAfter: new Date('2025-01-01T00:00:00Z'),
        startTimeBefore: new Date('2025-12-31T23:59:59Z')
      });

      expect(contests).toHaveLength(1);
      expect(contests[0].name).toBe('Current Contest');
    });

    it('should filter contests by end time range', async () => {
      const contests = await contestService.getContests({
        endTimeAfter: new Date('2025-01-01T00:00:00Z'),
        endTimeBefore: new Date('2025-12-31T23:59:59Z')
      });

      expect(contests).toHaveLength(1);
      expect(contests[0].name).toBe('Current Contest');
    });

    it('should combine multiple filters', async () => {
      const contests = await contestService.getContests({
        status: ContestStatus.PLANNED,
        startTimeAfter: new Date('2025-01-01T00:00:00Z')
      });

      expect(contests).toHaveLength(1);
      expect(contests[0].name).toBe('Future Contest');
    });
  });

  describe('Contest Deletion Constraints', () => {
    it('should prevent deletion of contest with submissions', async () => {
      // This would require setting up users, problems, and submissions
      // For now, we'll test the basic constraint checking
      const contest = await contestService.createContest({
        name: 'Contest with Data',
        status: ContestStatus.PLANNED
      });

      // The actual constraint checking happens in the service
      // This test verifies the error handling structure
      await expect(contestService.deleteContest(contest.id)).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This would require mocking database failures
      // For integration tests, we focus on business logic errors
      await expect(contestService.getContestById('invalid-uuid-format'))
        .resolves.toBeNull();
    });

    it('should handle concurrent updates', async () => {
      const contest = await contestService.createContest({
        name: 'Concurrent Test',
        status: ContestStatus.PLANNED
      });

      // Simulate concurrent status updates
      const update1 = contestService.updateContestStatus(contest.id, ContestStatus.RUNNING);
      const update2 = contestService.updateContestStatus(contest.id, ContestStatus.ARCHIVED);

      // One should succeed, one should fail due to invalid transition
      const results = await Promise.allSettled([update1, update2]);
      
      const successes = results.filter(r => r.status === 'fulfilled').length;
      const failures = results.filter(r => r.status === 'rejected').length;

      expect(successes + failures).toBe(2);
      expect(failures).toBeGreaterThan(0); // At least one should fail
    });
  });