import { Request, Response } from 'express';
import { PrismaClient, SubmissionStatus, Role } from '@prisma/client';
import { broadcastMessage } from '../services/websocketService';
import { judgeQueueService } from '../services/judgeQueueService';
import { reviewService } from '../services/reviewService';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  userId?: string;
  userRole?: Role;
}

export const getJudgeQueue = async (req: AuthRequest, res: Response) => {
  try {
    const judgeId = req.userId;
    if (!judgeId) {
      return res.status(401).json({ message: 'Judge not authenticated' });
    }

    const pendingSubmissions = await judgeQueueService.getJudgeQueue(judgeId);

    // Anonymize participant details for privacy
    const anonymizedSubmissions = pendingSubmissions.map(submission => ({
      ...submission,
      submittedBy: { username: 'Anonymous Participant' },
    }));

    res.status(200).json(anonymizedSubmissions);
  } catch (error) {
    console.error('Error fetching judge queue:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const claimSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const judgeId = req.userId;

    if (!judgeId) {
      return res.status(401).json({ message: 'Judge not authenticated' });
    }

    if (!submissionId) {
      return res.status(400).json({ message: 'Submission ID is required' });
    }

    const result = await judgeQueueService.claimSubmission(submissionId, judgeId);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    // Anonymize participant details
    const anonymizedSubmission = {
      ...result.submission,
      submittedBy: { username: 'Anonymous Participant' },
    };

    // Broadcast that submission was claimed
    broadcastMessage('submission.claimed', {
      submissionId: submissionId,
      judgeId: judgeId,
      status: SubmissionStatus.UNDER_REVIEW,
    });

    res.status(200).json({
      message: result.message,
      submission: anonymizedSubmission,
    });
  } catch (error) {
    console.error('Error claiming submission:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getActiveSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const judgeId = req.userId;
    if (!judgeId) {
      return res.status(401).json({ message: 'Judge not authenticated' });
    }

    const activeSubmissions = await judgeQueueService.getJudgeActiveSubmissions(judgeId);

    // Anonymize participant details
    const anonymizedSubmissions = activeSubmissions.map(submission => ({
      ...submission,
      submittedBy: { username: 'Anonymous Participant' },
    }));

    res.status(200).json(anonymizedSubmissions);
  } catch (error) {
    console.error('Error fetching active submissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const releaseSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const judgeId = req.userId;

    if (!judgeId) {
      return res.status(401).json({ message: 'Judge not authenticated' });
    }

    if (!submissionId) {
      return res.status(400).json({ message: 'Submission ID is required' });
    }

    const success = await judgeQueueService.releaseSubmission(submissionId, judgeId);

    if (!success) {
      return res.status(400).json({ message: 'Unable to release submission' });
    }

    // Broadcast that submission was released back to queue
    broadcastMessage('submission.released', {
      submissionId: submissionId,
      status: SubmissionStatus.PENDING,
    });

    res.status(200).json({ message: 'Submission released back to queue' });
  } catch (error) {
    console.error('Error releasing submission:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getQueueStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const statistics = await judgeQueueService.getQueueStatistics();
    res.status(200).json(statistics);
  } catch (error) {
    console.error('Error fetching queue statistics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const submitReview = async (req: AuthRequest, res: Response) => {
  try {
    const { submissionId, correct, scoreAwarded, remarks } = req.body;
    const judgeId = req.userId;

    if (!judgeId) {
      return res.status(401).json({ message: 'Judge not authenticated' });
    }

    if (!submissionId || typeof correct !== 'boolean' || typeof scoreAwarded !== 'number') {
      return res.status(400).json({ 
        message: 'Submission ID, correct status (boolean), and score awarded (number) are required' 
      });
    }

    if (scoreAwarded < 0) {
      return res.status(400).json({ message: 'Score awarded cannot be negative' });
    }

    const result = await reviewService.createReview(
      {
        submissionId,
        correct,
        scoreAwarded,
        remarks,
      },
      judgeId
    );

    // Broadcast review completion
    broadcastMessage('review.completed', {
      submissionId: submissionId,
      reviewId: result.review.id,
      status: result.review.submission.status,
      correct: result.review.correct,
      scoreAwarded: result.review.scoreAwarded,
      userId: result.review.submittedById,
    });

    // Broadcast leaderboard update if score changed
    if (result.userUpdate.newScore !== result.userUpdate.previousScore) {
      broadcastMessage('leaderboard.updated', {
        userId: result.userUpdate.userId,
        newScore: result.userUpdate.newScore,
        problemsSolved: result.userUpdate.newProblemsSolved,
      });
    }

    res.status(201).json({
      message: 'Review submitted successfully',
      review: result.review,
      userUpdate: result.userUpdate,
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getReview = async (req: AuthRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const judgeId = req.userId;

    if (!judgeId) {
      return res.status(401).json({ message: 'Judge not authenticated' });
    }

    if (!submissionId) {
      return res.status(400).json({ message: 'Submission ID is required' });
    }

    const review = await reviewService.getReviewBySubmissionId(submissionId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.status(200).json(review);
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getJudgeReviews = async (req: AuthRequest, res: Response) => {
  try {
    const judgeId = req.userId;
    const { limit } = req.query;

    if (!judgeId) {
      return res.status(401).json({ message: 'Judge not authenticated' });
    }

    const limitNum = limit ? parseInt(limit as string) : undefined;
    const reviews = await reviewService.getReviewsByJudge(judgeId, limitNum);

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching judge reviews:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getJudgeStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const judgeId = req.userId;

    if (!judgeId) {
      return res.status(401).json({ message: 'Judge not authenticated' });
    }

    const statistics = await reviewService.getJudgeStatistics(judgeId);
    res.status(200).json(statistics);
  } catch (error) {
    console.error('Error fetching judge statistics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const postVerdict = async (req: AuthRequest, res: Response) => {
  const { submissionId, verdict } = req.body; // verdict should be 'ACCEPTED' or 'REJECTED'
  const judgeId = req.userId;

  if (!judgeId) {
    return res.status(401).json({ message: 'Judge not authenticated' });
  }

  const validStatuses = [SubmissionStatus.ACCEPTED, SubmissionStatus.REJECTED];
  if (!submissionId || !verdict || !validStatuses.includes(verdict)) {
    return res.status(400).json({ message: 'Submission ID and a valid verdict (ACCEPTED/REJECTED) are required' });
  }

  try {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { 
        problem: true, 
        submittedBy: true,
        contest: true,
      },
    });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submission.status !== SubmissionStatus.UNDER_REVIEW || submission.reviewedById !== judgeId) {
      return res.status(400).json({ message: 'Submission is not being reviewed by this judge' });
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: { status: verdict },
      include: { problem: true, contest: true },
    });

    // If accepted, create a legacy ScoreEvent for backward compatibility
    if (verdict === SubmissionStatus.ACCEPTED) {
      // Get the contest problem to find the points
      const contestProblem = await prisma.contestProblem.findFirst({
        where: {
          contestId: submission.contestId,
          problemId: submission.problemId,
        },
      });

      if (contestProblem) {
        await prisma.scoreEvent.create({
          data: {
            submissionId: updatedSubmission.id,
            points: contestProblem.points,
            userId: submission.submittedById,
          },
        });
      }
    }

    // Broadcast verdict.updated via WebSocket
    broadcastMessage('verdict.updated', {
      id: updatedSubmission.id,
      status: updatedSubmission.status,
      problemId: updatedSubmission.problemId,
      userId: submission.submittedById,
      verdict: updatedSubmission.status,
    });

    res.status(200).json({ message: 'Verdict recorded', submission: updatedSubmission });
  } catch (error) {
    console.error('Error posting verdict:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};