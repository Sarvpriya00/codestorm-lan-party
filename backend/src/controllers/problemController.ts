import { Request, Response } from 'express';
import { PrismaClient, Verdict } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string; // Assuming role is string for now, will use Role enum later
}

export const getProblems = async (req: Request, res: Response) => {
  try {
    const problems = await prisma.problem.findMany({
      select: {
        id: true,
        title: true,
        difficulty: true,
        points: true,
      },
    });
    res.status(200).json(problems);
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProblemById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const problem = await prisma.problem.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        points: true,
        test_cases: true, // Include test cases for single problem view
      },
    });

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.status(200).json(problem);
  } catch (error) {
    console.error('Error fetching problem by ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const submitSubmission = async (req: AuthRequest, res: Response) => {
  const { problemId, language, code } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  if (!problemId || !language || !code) {
    return res.status(400).json({ message: 'Problem ID, language, and code are required' });
  }

  try {
    const problem = await prisma.problem.findUnique({ where: { id: problemId } });
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const submission = await prisma.submission.create({
      data: {
        problemId,
        userId,
        language,
        code,
        status: Verdict.PENDING, // Initial status
        attemptCount: 1, // Assuming first attempt for now
      },
    });

    // TODO: Implement actual judging logic and update submission status
    // For now, it's just PENDING

    res.status(201).json({ message: 'Submission received', submissionId: submission.id });
  } catch (error) {
    console.error('Error submitting code:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMySubmissions = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const submissions = await prisma.submission.findMany({
      where: { userId },
      include: {
        problem: {
          select: {
            title: true,
            difficulty: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.status(200).json(submissions);
  } catch (error) {
    console.error('Error fetching my submissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};