import { Request, Response } from 'express';
import { PrismaClient, Verdict, Role } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  userId?: string;
  userRole?: Role;
}

export const getJudgeQueue = async (req: AuthRequest, res: Response) => {
  try {
    const pendingSubmissions = await prisma.submission.findMany({
      where: { status: Verdict.PENDING },
      select: {
        id: true,
        language: true,
        code: true,
        createdAt: true,
        problem: {
          select: {
            id: true,
            title: true,
            difficulty: true,
          },
        },
        user: {
          select: {
            username: true, // Anonymize if needed, but for now, show username
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Anonymize participant details if required by the spec
    const anonymizedSubmissions = pendingSubmissions.map(submission => ({
      ...submission,
      user: { username: 'Anonymous Participant' }, // Anonymize username
    }));

    res.status(200).json(anonymizedSubmissions);
  } catch (error) {
    console.error('Error fetching judge queue:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const postVerdict = async (req: AuthRequest, res: Response) => {
  const { submissionId, verdict } = req.body; // verdict should be 'ACCEPTED' or 'REJECTED'
  const judgeId = req.userId;

  if (!judgeId) {
    return res.status(401).json({ message: 'Judge not authenticated' });
  }

  if (!submissionId || !verdict || !Object.values(Verdict).includes(verdict)) {
    return res.status(400).json({ message: 'Submission ID and a valid verdict (ACCEPTED/REJECTED) are required' });
  }

  try {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { problem: true, user: true },
    });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submission.status !== Verdict.PENDING) {
      return res.status(400).json({ message: 'Submission has already been judged' });
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: { status: verdict },
      include: { problem: true }, // Include problem here
    });

    // If accepted, create a ScoreEvent
    if (verdict === Verdict.ACCEPTED) {
      await prisma.scoreEvent.create({
        data: {
          submissionId: updatedSubmission.id,
          points: updatedSubmission.problem.points,
          userId: updatedSubmission.userId,
        },
      });
      // TODO: Trigger leaderboard recalculation via WebSocket
    }

    // TODO: Broadcast verdict.updated via WebSocket

    res.status(200).json({ message: 'Verdict recorded', submission: updatedSubmission });
  } catch (error) {
    console.error('Error posting verdict:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};