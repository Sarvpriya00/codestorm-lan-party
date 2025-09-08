import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient, SubmissionStatus, Difficulty, ContestStatus } from '@prisma/client';
import { ReviewService } from '../../services/reviewService';

const prisma = new PrismaClient();
const reviewService = new ReviewService();

describe('ReviewService', () => {
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
        name: 'TEST_ROLE',
        description: 'Test role',
      },
    });
    testRoleId = role.id;

    // Create test users
    const user = await prisma.user.create({
      data: {
        username: 'testuser',
        password: 'hashedpassword',
        roleId: testRoleId,
        scored: 0,
        problemsSolvedCount: 0,
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

    // Create test submission under review
    const submission = await prisma.submission.create({
      data: {
        problemId: testProblemId,
        contestId: testContestId,
        submittedById: testUserId,
        codeText: 'console.log("Hello World");',
        status: SubmissionStatus.UNDER_REVIEW,
        reviewedById: testJudgeId,
      },
    });
    testSubmissionId = submission.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.review.deleteMany({});
    await prisma.scoreEvent.deleteMany({});
    await prisma.leaderboard.deleteMany({});
    await prisma.submission.deleteMany({});
    await prisma.contestProblem.deleteMany({});
    await prisma.questionProblem.deleteMany({});
    await prisma.contest.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.role.deleteMany({});
  });

  describe('createReview', () => {
    it('should create a review for accepted submission and update user scores', async () => {
      const reviewData = {
        submissionId: testSubmissionId,
        correct: true,
        scoreAwarded: 85,
        remarks: 'Good solution',
      };

      const result = await reviewService.createReview(reviewData, testJudgeId);

      expect(result.review.correct).toBe(true);
      expect(result.review.scoreAwarded).toBe(85);
      expect(result.review.remarks).toBe('Good solution');
      expect(result.review.submission.status).toBe(SubmissionStatus.ACCEPTED);

      expect(result.userUpdate.newScore).toBe(85);
      expect(result.userUpdate.newProblemsSolved).toBe(1);
      expect(result.userUpdate.previousScore).toBe(0);
      expect(result.userUpdate.previousProblemsSolved).toBe(0);

      // Verify database was updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUserId },
      });
      expect(updatedUser?.scored).toBe(85);
      expect(updatedUser?.problemsSolvedCount).toBe(1);

      // Verify leaderboard was created
      const leaderboardEntry = await prisma.leaderboard.findUnique({
        where: {
          contestId_userId: {
            contestId: testContestId,
            userId: testUserId,
          },
        },
      });
      expect(leaderboardEntry?.score).toBe(85);
      expect(leaderboardEntry?.problemsSolved).toBe(1);

      // Verify ScoreEvent was created
      const scoreEvent = await prisma.scoreEvent.findFirst({
        where: { submissionId: testSubmissionId },
      });
      expect(scoreEvent?.points).toBe(100); // Contest problem points
    });

    it('should create a review for rejected submission without updating scores', async () => {
      const reviewData = {
        submissionId: testSubmissionId,
        correct: false,
        scoreAwarded: 0,
        remarks: 'Incorrect solution',
      };

      const result = await reviewService.createReview(reviewData, testJudgeId);

      expect(result.review.correct).toBe(false);
      expect(result.review.scoreAwarded).toBe(0);
      expect(result.review.submission.status).toBe(SubmissionStatus.REJECTED);

      expect(result.userUpdate.newScore).toBe(0);
      expect(result.userUpdate.newProblemsSolved).toBe(0);

      // Verify user scores weren't updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUserId },
      });
      expect(updatedUser?.scored).toBe(0);
      expect(updatedUser?.problemsSolvedCount).toBe(0);

      // Verify no ScoreEvent was created
      const scoreEvent = await prisma.scoreEvent.findFirst({
        where: { submissionId: testSubmissionId },
      });
      expect(scoreEvent).toBeNull();
    });

    it('should fail to create review for non-existent submission', async () => {
      const reviewData = {
        submissionId: 'non-existent-id',
        correct: true,
        scoreAwarded: 85,
      };

      await expect(
        reviewService.createReview(reviewData, testJudgeId)
      ).rejects.toThrow('Submission not found');
    });

    it('should fail to create review for submission not under review', async () => {
      // Update submission to pending
      await prisma.submission.update({
        where: { id: testSubmissionId },
        data: { status: SubmissionStatus.PENDING },
      });

      const reviewData = {
        submissionId: testSubmissionId,
        correct: true,
        scoreAwarded: 85,
      };

      await expect(
        reviewService.createReview(reviewData, testJudgeId)
      ).rejects.toThrow('Submission is not under review');
    });

    it('should fail to create review by wrong judge', async () => {
      // Create another judge
      const anotherJudge = await prisma.user.create({
        data: {
          username: 'anotherjudge',
          password: 'hashedpassword',
          roleId: testRoleId,
        },
      });

      const reviewData = {
        submissionId: testSubmissionId,
        correct: true,
        scoreAwarded: 85,
      };

      await expect(
        reviewService.createReview(reviewData, anotherJudge.id)
      ).rejects.toThrow('Submission is not being reviewed by this judge');

      // Clean up
      await prisma.user.delete({ where: { id: anotherJudge.id } });
    });

    it('should fail to create review with invalid score', async () => {
      const reviewData = {
        submissionId: testSubmissionId,
        correct: true,
        scoreAwarded: 150, // Exceeds max score of 100
      };

      await expect(
        reviewService.createReview(reviewData, testJudgeId)
      ).rejects.toThrow('Score must be between 0 and 100');
    });

    it('should handle multiple submissions for same problem correctly', async () => {
      // First submission - accepted with lower score
      const firstResult = await reviewService.createReview(
        {
          submissionId: testSubmissionId,
          correct: true,
          scoreAwarded: 60,
        },
        testJudgeId
      );

      expect(firstResult.userUpdate.newScore).toBe(60);
      expect(firstResult.userUpdate.newProblemsSolved).toBe(1);

      // Create second submission for same problem
      const secondSubmission = await prisma.submission.create({
        data: {
          problemId: testProblemId,
          contestId: testContestId,
          submittedById: testUserId,
          codeText: 'console.log("Better solution");',
          status: SubmissionStatus.UNDER_REVIEW,
          reviewedById: testJudgeId,
        },
      });

      // Second submission - accepted with higher score
      const secondResult = await reviewService.createReview(
        {
          submissionId: secondSubmission.id,
          correct: true,
          scoreAwarded: 90,
        },
        testJudgeId
      );

      // Should update score but not problem count (already solved)
      expect(secondResult.userUpdate.newScore).toBe(90); // 60 - 60 + 90
      expect(secondResult.userUpdate.newProblemsSolved).toBe(1); // Still 1
    });
  });

  describe('getReviewBySubmissionId', () => {
    it('should return review for existing submission', async () => {
      // Create a review first
      await reviewService.createReview(
        {
          submissionId: testSubmissionId,
          correct: true,
          scoreAwarded: 85,
          remarks: 'Good solution',
        },
        testJudgeId
      );

      const review = await reviewService.getReviewBySubmissionId(testSubmissionId);

      expect(review).not.toBeNull();
      expect(review?.correct).toBe(true);
      expect(review?.scoreAwarded).toBe(85);
      expect(review?.remarks).toBe('Good solution');
    });

    it('should return null for non-existent review', async () => {
      const review = await reviewService.getReviewBySubmissionId('non-existent-id');
      expect(review).toBeNull();
    });
  });

  describe('getReviewsByJudge', () => {
    it('should return reviews by specific judge', async () => {
      // Create a review
      await reviewService.createReview(
        {
          submissionId: testSubmissionId,
          correct: true,
          scoreAwarded: 85,
        },
        testJudgeId
      );

      const reviews = await reviewService.getReviewsByJudge(testJudgeId);

      expect(reviews).toHaveLength(1);
      expect(reviews[0].reviewedById).toBe(testJudgeId);
      expect(reviews[0].correct).toBe(true);
    });

    it('should respect limit parameter', async () => {
      // Create multiple reviews (need multiple submissions)
      for (let i = 0; i < 3; i++) {
        const submission = await prisma.submission.create({
          data: {
            problemId: testProblemId,
            contestId: testContestId,
            submittedById: testUserId,
            codeText: `console.log("Solution ${i}");`,
            status: SubmissionStatus.UNDER_REVIEW,
            reviewedById: testJudgeId,
          },
        });

        await reviewService.createReview(
          {
            submissionId: submission.id,
            correct: true,
            scoreAwarded: 80 + i,
          },
          testJudgeId
        );
      }

      const reviews = await reviewService.getReviewsByJudge(testJudgeId, 2);
      expect(reviews).toHaveLength(2);
    });
  });

  describe('getJudgeStatistics', () => {
    it('should return correct judge statistics', async () => {
      // Create multiple reviews with different outcomes
      const submissions = [];
      for (let i = 0; i < 3; i++) {
        const submission = await prisma.submission.create({
          data: {
            problemId: testProblemId,
            contestId: testContestId,
            submittedById: testUserId,
            codeText: `console.log("Solution ${i}");`,
            status: SubmissionStatus.UNDER_REVIEW,
            reviewedById: testJudgeId,
          },
        });
        submissions.push(submission);
      }

      // 2 accepted, 1 rejected
      await reviewService.createReview(
        { submissionId: submissions[0].id, correct: true, scoreAwarded: 90 },
        testJudgeId
      );
      await reviewService.createReview(
        { submissionId: submissions[1].id, correct: true, scoreAwarded: 80 },
        testJudgeId
      );
      await reviewService.createReview(
        { submissionId: submissions[2].id, correct: false, scoreAwarded: 0 },
        testJudgeId
      );

      const stats = await reviewService.getJudgeStatistics(testJudgeId);

      expect(stats.totalReviews).toBe(3);
      expect(stats.acceptedReviews).toBe(2);
      expect(stats.rejectedReviews).toBe(1);
      expect(stats.averageScore).toBe(56.67); // (90 + 80 + 0) / 3 = 56.67
    });

    it('should return zero statistics for judge with no reviews', async () => {
      const stats = await reviewService.getJudgeStatistics(testJudgeId);

      expect(stats.totalReviews).toBe(0);
      expect(stats.acceptedReviews).toBe(0);
      expect(stats.rejectedReviews).toBe(0);
      expect(stats.averageScore).toBe(0);
    });
  });
});