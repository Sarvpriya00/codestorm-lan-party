import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient, SubmissionStatus, Difficulty, ContestStatus, ParticipantStatus } from '@prisma/client';
import { JudgeQueueService } from '../../services/judgeQueueService';

const prisma = new PrismaClient();
const judgeQueueService = new JudgeQueueService();

describe('JudgeQueueService', () => {
  let testUserId: string;
  let testJudgeId: string;
  let testContestId: string;
  let testProblemId: string;
  let testSubmissionId: string;
  let testRoleId: string;

  beforeEach(async () => {
    // Create test role
    const role = await prisma.role.create({
      data: {
        name: 'TEST_PARTICIPANT',
        description: 'Test participant role',
      },
    });
    testRoleId = role.id;

    // Create test users
    const user = await prisma.user.create({
      data: {
        username: 'testuser',
        password: 'hashedpassword',
        roleId: testRoleId,
      },
    });
    testUserId = user.id;

    const judge = await prisma.user.create({
      data: {
        username: 'testjudge',
        password: 'hashedpassword',
        roleId: testRoleId,
      },
    });
    testJudgeId = judge.id;

    // Create test contest
    const contest = await prisma.contest.create({
      data: {
        name: 'Test Contest',
        description: 'A test contest',
        status: ContestStatus.RUNNING,
      },
    });
    testContestId = contest.id;

    // Create test problem
    const problem = await prisma.questionProblem.create({
      data: {
        questionText: 'Test problem',
        difficultyLevel: Difficulty.EASY,
        maxScore: 100,
        createdById: testUserId,
      },
    });
    testProblemId = problem.id;

    // Create contest-problem association
    await prisma.contestProblem.create({
      data: {
        contestId: testContestId,
        problemId: testProblemId,
        points: 100,
        order: 1,
      },
    });

    // Create test submission
    const submission = await prisma.submission.create({
      data: {
        problemId: testProblemId,
        contestId: testContestId,
        submittedById: testUserId,
        codeText: 'console.log("Hello World");',
        status: SubmissionStatus.PENDING,
      },
    });
    testSubmissionId = submission.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.submission.deleteMany({});
    await prisma.contestProblem.deleteMany({});
    await prisma.questionProblem.deleteMany({});
    await prisma.contest.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.role.deleteMany({});
  });

  describe('getJudgeQueue', () => {
    it('should return pending submissions ordered by timestamp', async () => {
      const queue = await judgeQueueService.getJudgeQueue();
      
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe(testSubmissionId);
      expect(queue[0].status).toBe(SubmissionStatus.PENDING);
      expect(queue[0].problem.questionText).toBe('Test problem');
      expect(queue[0].submittedBy.username).toBe('testuser');
    });

    it('should not return submissions that are under review', async () => {
      // Update submission to under review
      await prisma.submission.update({
        where: { id: testSubmissionId },
        data: { 
          status: SubmissionStatus.UNDER_REVIEW,
          reviewedById: testJudgeId,
        },
      });

      const queue = await judgeQueueService.getJudgeQueue();
      expect(queue).toHaveLength(0);
    });

    it('should not return completed submissions', async () => {
      // Update submission to accepted
      await prisma.submission.update({
        where: { id: testSubmissionId },
        data: { status: SubmissionStatus.ACCEPTED },
      });

      const queue = await judgeQueueService.getJudgeQueue();
      expect(queue).toHaveLength(0);
    });
  });

  describe('claimSubmission', () => {
    it('should successfully claim a pending submission', async () => {
      const result = await judgeQueueService.claimSubmission(testSubmissionId, testJudgeId);
      
      expect(result.success).toBe(true);
      expect(result.submission?.id).toBe(testSubmissionId);
      expect(result.submission?.status).toBe(SubmissionStatus.UNDER_REVIEW);
      expect(result.message).toBe('Submission claimed successfully');

      // Verify database was updated
      const updatedSubmission = await prisma.submission.findUnique({
        where: { id: testSubmissionId },
      });
      expect(updatedSubmission?.status).toBe(SubmissionStatus.UNDER_REVIEW);
      expect(updatedSubmission?.reviewedById).toBe(testJudgeId);
    });

    it('should fail to claim non-existent submission', async () => {
      const result = await judgeQueueService.claimSubmission('non-existent-id', testJudgeId);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Submission not found');
    });

    it('should fail to claim submission that is not pending', async () => {
      // Update submission to accepted
      await prisma.submission.update({
        where: { id: testSubmissionId },
        data: { status: SubmissionStatus.ACCEPTED },
      });

      const result = await judgeQueueService.claimSubmission(testSubmissionId, testJudgeId);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Submission is no longer pending');
    });

    it('should fail to claim submission already being reviewed by another judge', async () => {
      // First judge claims the submission
      await judgeQueueService.claimSubmission(testSubmissionId, testJudgeId);

      // Create another judge
      const anotherJudge = await prisma.user.create({
        data: {
          username: 'anotherjudge',
          password: 'hashedpassword',
          roleId: testRoleId,
        },
      });

      // Second judge tries to claim the same submission
      const result = await judgeQueueService.claimSubmission(testSubmissionId, anotherJudge.id);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Submission is already being reviewed by another judge');

      // Clean up
      await prisma.user.delete({ where: { id: anotherJudge.id } });
    });
  });

  describe('getJudgeActiveSubmissions', () => {
    it('should return submissions being reviewed by the judge', async () => {
      // Claim the submission
      await judgeQueueService.claimSubmission(testSubmissionId, testJudgeId);

      const activeSubmissions = await judgeQueueService.getJudgeActiveSubmissions(testJudgeId);
      
      expect(activeSubmissions).toHaveLength(1);
      expect(activeSubmissions[0].id).toBe(testSubmissionId);
      expect(activeSubmissions[0].status).toBe(SubmissionStatus.UNDER_REVIEW);
    });

    it('should return empty array if judge has no active submissions', async () => {
      const activeSubmissions = await judgeQueueService.getJudgeActiveSubmissions(testJudgeId);
      expect(activeSubmissions).toHaveLength(0);
    });
  });

  describe('releaseSubmission', () => {
    it('should successfully release a submission back to queue', async () => {
      // First claim the submission
      await judgeQueueService.claimSubmission(testSubmissionId, testJudgeId);

      // Then release it
      const success = await judgeQueueService.releaseSubmission(testSubmissionId, testJudgeId);
      
      expect(success).toBe(true);

      // Verify database was updated
      const updatedSubmission = await prisma.submission.findUnique({
        where: { id: testSubmissionId },
      });
      expect(updatedSubmission?.status).toBe(SubmissionStatus.PENDING);
      expect(updatedSubmission?.reviewedById).toBeNull();
    });

    it('should fail to release submission not being reviewed by the judge', async () => {
      const success = await judgeQueueService.releaseSubmission(testSubmissionId, testJudgeId);
      expect(success).toBe(false);
    });
  });

  describe('getQueueStatistics', () => {
    it('should return correct queue statistics', async () => {
      // Create additional submissions with different statuses
      await prisma.submission.create({
        data: {
          problemId: testProblemId,
          contestId: testContestId,
          submittedById: testUserId,
          codeText: 'console.log("Test 2");',
          status: SubmissionStatus.UNDER_REVIEW,
          reviewedById: testJudgeId,
        },
      });

      await prisma.submission.create({
        data: {
          problemId: testProblemId,
          contestId: testContestId,
          submittedById: testUserId,
          codeText: 'console.log("Test 3");',
          status: SubmissionStatus.ACCEPTED,
        },
      });

      const stats = await judgeQueueService.getQueueStatistics();
      
      expect(stats.pendingCount).toBe(1);
      expect(stats.underReviewCount).toBe(1);
      expect(stats.totalSubmissions).toBe(3);
    });
  });
});