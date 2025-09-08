import { Request, Response } from 'express';
import { SubmissionService, SubmissionFilters } from '../services/submissionService';
import { SubmissionStatus } from '@prisma/client';
import { broadcastMessage } from '../services/websocketService';

const submissionService = new SubmissionService();

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const createSubmission = async (req: AuthRequest, res: Response) => {
  const { problemId, contestId, language, code } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  if (!problemId || !contestId || !code) {
    return res.status(400).json({ message: 'Problem ID, contest ID, and code are required' });
  }

  try {
    const submission = await submissionService.createSubmission({
      problemId,
      contestId,
      submittedById: userId,
      codeText: code,
      language
    });

    // Broadcast submission.created event
    broadcastMessage('submission.created', {
      id: submission.id,
      problemId: submission.problemId,
      contestId: submission.contestId,
      submittedById: submission.submittedById,
      status: submission.status,
      timestamp: submission.timestamp,
    });

    res.status(201).json({
      message: 'Submission received',
      submissionId: submission.id,
      status: submission.status,
      timestamp: submission.timestamp
    });
  } catch (error) {
    console.error('Error creating submission:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = message.includes('not found') ? 404 : 
                      message.includes('not enrolled') || message.includes('not active') ? 403 :
                      message.includes('not running') ? 400 : 500;
    res.status(statusCode).json({ message });
  }
};

export const getSubmissions = async (req: Request, res: Response) => {
  try {
    const {
      contestId,
      problemId,
      submittedById,
      status,
      reviewedById,
      dateFrom,
      dateTo,
      page = '1',
      limit = '20'
    } = req.query;

    const filters: SubmissionFilters = {};
    
    if (contestId) filters.contestId = contestId as string;
    if (problemId) filters.problemId = problemId as string;
    if (submittedById) filters.submittedById = submittedById as string;
    if (reviewedById) filters.reviewedById = reviewedById as string;
    if (status && Object.values(SubmissionStatus).includes(status as SubmissionStatus)) {
      filters.status = status as SubmissionStatus;
    }
    if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
    if (dateTo) filters.dateTo = new Date(dateTo as string);

    const result = await submissionService.getSubmissions(
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getSubmissionById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const submission = await submissionService.getSubmissionById(id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.status(200).json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateSubmissionStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, score } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  if (!status || !Object.values(SubmissionStatus).includes(status)) {
    return res.status(400).json({ message: 'Valid status is required' });
  }

  try {
    const submission = await submissionService.updateSubmission(id, {
      status: status as SubmissionStatus,
      score: score ? parseFloat(score) : undefined
    });

    // Broadcast submission status update
    broadcastMessage('submission.updated', {
      id: submission.id,
      status: submission.status,
      score: submission.score,
      updatedAt: new Date()
    });

    res.status(200).json(submission);
  } catch (error) {
    console.error('Error updating submission:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ message });
  }
};

export const assignSubmissionToJudge = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { judgeId } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  if (!judgeId) {
    return res.status(400).json({ message: 'Judge ID is required' });
  }

  try {
    const submission = await submissionService.assignSubmissionToJudge(id, judgeId);

    // Broadcast assignment event
    broadcastMessage('submission.assigned', {
      id: submission.id,
      judgeId: judgeId,
      status: submission.status,
      assignedAt: new Date()
    });

    res.status(200).json(submission);
  } catch (error) {
    console.error('Error assigning submission:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = message.includes('not found') ? 404 : 
                      message.includes('not available') || message.includes('already assigned') ? 400 : 500;
    res.status(statusCode).json({ message });
  }
};

export const getPendingSubmissions = async (req: Request, res: Response) => {
  const { contestId } = req.query;

  try {
    const submissions = await submissionService.getPendingSubmissions(contestId as string);
    res.status(200).json(submissions);
  } catch (error) {
    console.error('Error fetching pending submissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getJudgeQueue = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const assignedSubmissions = await submissionService.getJudgeAssignedSubmissions(userId);
    res.status(200).json(assignedSubmissions);
  } catch (error) {
    console.error('Error fetching judge queue:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createReview = async (req: AuthRequest, res: Response) => {
  const { submissionId, correct, scoreAwarded, remarks } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  if (!submissionId || correct === undefined || scoreAwarded === undefined) {
    return res.status(400).json({ 
      message: 'Submission ID, correct status, and score awarded are required' 
    });
  }

  try {
    // Get submission details first
    const submission = await submissionService.getSubmissionById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const review = await submissionService.createReview({
      submissionId,
      problemId: submission.problemId,
      submittedById: submission.submittedById,
      reviewedById: userId,
      correct: Boolean(correct),
      scoreAwarded: parseFloat(scoreAwarded),
      remarks
    });

    // Broadcast review completion
    broadcastMessage('submission.reviewed', {
      submissionId: review.submissionId,
      correct: review.correct,
      scoreAwarded: review.scoreAwarded,
      reviewedAt: review.timestamp,
      reviewedBy: userId
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = message.includes('not found') ? 404 : 
                      message.includes('not under review') || message.includes('not assigned') ? 400 : 500;
    res.status(statusCode).json({ message });
  }
};

export const getSubmissionStats = async (req: Request, res: Response) => {
  const { contestId } = req.params;

  try {
    const stats = await submissionService.getSubmissionStats(contestId);
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching submission stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserSubmissionHistory = async (req: AuthRequest, res: Response) => {
  const { userId: targetUserId } = req.params;
  const { contestId } = req.query;
  const requestingUserId = req.userId;

  if (!requestingUserId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  // Users can only view their own submission history unless they're admin/judge
  const userRole = req.userRole;
  if (targetUserId !== requestingUserId && userRole !== 'ADMIN' && userRole !== 'JUDGE') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const submissions = await submissionService.getUserSubmissionHistory(
      targetUserId,
      contestId as string
    );
    res.status(200).json(submissions);
  } catch (error) {
    console.error('Error fetching user submission history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMySubmissions = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const { contestId } = req.query;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const submissions = await submissionService.getUserSubmissionHistory(
      userId,
      contestId as string
    );
    res.status(200).json(submissions);
  } catch (error) {
    console.error('Error fetching my submissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};