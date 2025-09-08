import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient, Difficulty, SubmissionStatus } from '@prisma/client';
import { SubmissionService } from '../../services/submissionService';

const prisma = new PrismaClient();
const submissionService = new SubmissionService();

describe('SubmissionService', () => {
  let testRole: any;
  let testUser: any;
  let testContest: any;
  let testProblem: any;
  let testContestProblem: any;
  let testContestUser: any;

  beforeEach(async () => {
    // Clean up test data
    await prisma.review.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.contestProblem.deleteMany();
    await prisma.questionProblem.deleteMany();
    await prisma.contestUser.deleteMany();
    await prisma.contest.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();

    // Create test data
    testRole = await prisma.role.create({
      data: {
        name: 'PARTICIPANT',
        description: 'Participant role'
      }
    });

    testUser = await prisma.user.create({
      data: {
        username: 'testparticipant',
        password: 'hashedpassword',
        roleId: testRole.id
      }
    });

    testContest = await prisma.contest.create({
      data: {
        name: 'Test Contest',
        description: 'A test contest',
        status: 'RUNNING'
      }
    });

    testProblem = await prisma.questionProblem.create({
      data: {
        questionText: 'Test Problem\n\nThis is a test problem',
        difficultyLevel: Difficulty.EASY,
        maxScore: 100,
        createdById: testUser.id,
        isActive: true
      }
    });

    testContestProblem = await prisma.contestProblem.create({
      data: {
        contestId: testContest.id,
        problemId: testProblem.id,
        order: 1,
        points: 100
      }
    });

    testContestUser = await prisma.contestUser.create({
      data: {
        contestId: testContest.id,
        userId: testUser.id,
        status: 'ACTIVE'
      }
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.review.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.contestProblem.deleteMany();
    await prisma.questionProblem.deleteMany();
    await prisma.contestUser.deleteMany();
    await prisma.contest.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
  });

  describe('createSubmission', () => {
    it('should create a submission successfully', async () => {
      const submissionData = {
        problemId: testProblem.id,
        contestId: testContest.id,
        submittedById: testUser.id,
        codeText: 'console.log("Hello World");',
        language: 'javascript'
      };

      const submission = await submissionService.createSubmission(submissionData);

      expect(submission).toBeDefined();
      expect(submission.problemId).toBe(testProblem.id);
      expect(submission.contestId).toBe(testContest.id);
      expect(submission.submittedById).toBe(testUser.id);
      expect(submission.status).toBe(SubmissionStatus.PENDING);
      expect(submission.score).toBe(0);
      expect(submission.codeText).toBe('console.log("Hello World");');
    });

    it('should throw error if problem not found in contest', async () => {
      const otherProblem = await prisma.questionProblem.create({
        data: {
          questionText: 'Other Problem',
          difficultyLevel: Difficulty.MEDIUM,
          maxScore: 150,
          createdById: testUser.id,
          isActive: true
        }
      });

      const submissionData = {
        problemId: otherProblem.id,
        contestId: testContest.id,
        submittedById: testUser.id,
        codeText: 'console.log("Hello World");'
      };

      await expect(submissionService.createSubmission(submissionData))
        .rejects.toThrow('Problem not found in this contest');
    });

    it('should throw error if user not enrolled in contest', async () => {
      const otherUser = await prisma.user.create({
        data: {
          username: 'otheruser',
          password: 'hashedpassword',
          roleId: testRole.id
        }
      });

      const submissionData = {
        problemId: testProblem.id,
        contestId: testContest.id,
        submittedById: otherUser.id,
        codeText: 'console.log("Hello World");'
      };

      await expect(submissionService.createSubmission(submissionData))
        .rejects.toThrow('User is not enrolled in this contest or participation is not active');
    });

    it('should throw error if contest is not running', async () => {
      await prisma.contest.update({
        where: { id: testContest.id },
        data: { status: 'ENDED' }
      });

      const submissionData = {
        problemId: testProblem.id,
        contestId: testContest.id,
        submittedById: testUser.id,
        codeText: 'console.log("Hello World");'
      };

      await expect(submissionService.createSubmission(submissionData))
        .rejects.toThrow('Contest is not currently running');
    });
  });

  describe('getSubmissions', () => {
    it('should return submissions with pagination', async () => {
      // Create test submissions
      const submission1 = await prisma.submission.create({
        data: {
          problemId: testProblem.id,
          contestId: testContest.id,
          submittedById: testUser.id,
          codeText: 'console.log("Test 1");',
          status: SubmissionStatus.PENDING,
          score: 0
        }
      });

      const submission2 = await prisma.submission.create({
        data: {
          problemId: testProblem.id,
          contestId: testContest.id,
          submittedById: testUser.id,
          codeText: 'console.log("Test 2");',
          status: SubmissionStatus.ACCEPTED,
          score: 100
        }
      });

      const result = await submissionService.getSubmissions({}, 1, 10);

      expect(result.submissions).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter submissions by status', async () => {
      await prisma.submission.create({
        data: {
          problemId: testProblem.id,
          contestId: testContest.id,
          submittedById: testUser.id,
          codeText: 'console.log("Pending");',
          status: SubmissionStatus.PENDING,
          score: 0
        }
      });

      await prisma.submission.create({
        data: {
          problemId: testProblem.id,
          contestId: testContest.id,
          submittedById: testUser.id,
          codeText: 'console.log("Accepted");',
          status: SubmissionStatus.ACCEPTED,
          score: 100
        }
      });

      const result = await submissionService.getSubmissions(
        { status: SubmissionStatus.ACCEPTED },
        1,
        10
      );

      expect(result.submissions).toHaveLength(1);
      expect(result.submissions[0].status).toBe(SubmissionStatus.ACCEPTED);
    });
  });

  describe('assignSubmissionToJudge', () => {
    it('should assign submission to judge successfully', async () => {
      const judgeRole = await prisma.role.create({
        data: {
          name: 'JUDGE',
          description: 'Judge role'
        }
      });

      const judge = await prisma.user.create({
        data: {
          username: 'testjudge',
          password: 'hashedpassword',
          roleId: judgeRole.id
        }
      });

      const submission = await prisma.submission.create({
        data: {
          problemId: testProblem.id,
          contestId: testContest.id,
          submittedById: testUser.id,
          codeText: 'console.log("Test");',
          status: SubmissionStatus.PENDING,
          score: 0
        }
      });

      const assignedSubmission = await submissionService.assignSubmissionToJudge(
        submission.id,
        judge.id
      );

      expect(assignedSubmission.status).toBe(SubmissionStatus.UNDER_REVIEW);
      expect(assignedSubmission.reviewedById).toBe(judge.id);
    });

    it('should throw error if submission already assigned', async () => {
      const judgeRole = await prisma.role.create({
        data: {
          name: 'JUDGE',
          description: 'Judge role'
        }
      });

      const judge = await prisma.user.create({
        data: {
          username: 'testjudge',
          password: 'hashedpassword',
          roleId: judgeRole.id
        }
      });

      const submission = await prisma.submission.create({
        data: {
          problemId: testProblem.id,
          contestId: testContest.id,
          submittedById: testUser.id,
          codeText: 'console.log("Test");',
          status: SubmissionStatus.UNDER_REVIEW,
          reviewedById: judge.id,
          score: 0
        }
      });

      await expect(submissionService.assignSubmissionToJudge(submission.id, judge.id))
        .rejects.toThrow('Submission is already assigned to a judge');
    });
  });

  describe('createReview', () => {
    it('should create review and update submission status', async () => {
      const judgeRole = await prisma.role.create({
        data: {
          name: 'JUDGE',
          description: 'Judge role'
        }
      });

      const judge = await prisma.user.create({
        data: {
          username: 'testjudge',
          password: 'hashedpassword',
          roleId: judgeRole.id
        }
      });

      const submission = await prisma.submission.create({
        data: {
          problemId: testProblem.id,
          contestId: testContest.id,
          submittedById: testUser.id,
          codeText: 'console.log("Test");',
          status: SubmissionStatus.UNDER_REVIEW,
          reviewedById: judge.id,
          score: 0
        }
      });

      const reviewData = {
        submissionId: submission.id,
        problemId: testProblem.id,
        submittedById: testUser.id,
        reviewedById: judge.id,
        correct: true,
        scoreAwarded: 100,
        remarks: 'Good solution'
      };

      const review = await submissionService.createReview(reviewData);

      expect(review).toBeDefined();
      expect(review.correct).toBe(true);
      expect(review.scoreAwarded).toBe(100);
      expect(review.remarks).toBe('Good solution');

      // Check that submission status was updated
      const updatedSubmission = await prisma.submission.findUnique({
        where: { id: submission.id }
      });
      expect(updatedSubmission?.status).toBe(SubmissionStatus.ACCEPTED);
      expect(updatedSubmission?.score).toBe(100);

      // Check that user score was updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      expect(updatedUser?.scored).toBe(100);
      expect(updatedUser?.problemsSolvedCount).toBe(1);
    });

    it('should throw error if submission not under review', async () => {
      const judgeRole = await prisma.role.create({
        data: {
          name: 'JUDGE',
          description: 'Judge role'
        }
      });

      const judge = await prisma.user.create({
        data: {
          username: 'testjudge',
          password: 'hashedpassword',
          roleId: judgeRole.id
        }
      });

      const submission = await prisma.submission.create({
        data: {
          problemId: testProblem.id,
          contestId: testContest.id,
          submittedById: testUser.id,
          codeText: 'console.log("Test");',
          status: SubmissionStatus.PENDING,
          score: 0
        }
      });

      const reviewData = {
        submissionId: submission.id,
        problemId: testProblem.id,
        submittedById: testUser.id,
        reviewedById: judge.id,
        correct: true,
        scoreAwarded: 100
      };

      await expect(submissionService.createReview(reviewData))
        .rejects.toThrow('Submission is not under review');
    });
  });

  describe('getSubmissionStats', () => {
    it('should return correct submission statistics', async () => {
      // Create submissions with different statuses
      await prisma.submission.createMany({
        data: [
          {
            problemId: testProblem.id,
            contestId: testContest.id,
            submittedById: testUser.id,
            codeText: 'console.log("Pending");',
            status: SubmissionStatus.PENDING,
            score: 0
          },
          {
            problemId: testProblem.id,
            contestId: testContest.id,
            submittedById: testUser.id,
            codeText: 'console.log("Accepted");',
            status: SubmissionStatus.ACCEPTED,
            score: 100
          },
          {
            problemId: testProblem.id,
            contestId: testContest.id,
            submittedById: testUser.id,
            codeText: 'console.log("Rejected");',
            status: SubmissionStatus.REJECTED,
            score: 0
          }
        ]
      });

      const stats = await submissionService.getSubmissionStats(testContest.id);

      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(1);
      expect(stats.accepted).toBe(1);
      expect(stats.rejected).toBe(1);
      expect(stats.averageScore).toBe(100);
    });
  });
});