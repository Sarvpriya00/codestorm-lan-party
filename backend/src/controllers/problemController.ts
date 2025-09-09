import { Request, Response } from 'express';
import { PrismaClient, Difficulty, SubmissionStatus } from '@prisma/client';
import { broadcastMessage } from '../services/websocketService';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

interface ProblemFilters {
  contestId?: string;
  difficulty?: Difficulty;
  tags?: string[];
  isActive?: boolean;
}

export const getProblems = async (req: Request, res: Response) => {
  try {
    const { contestId, difficulty, tags, isActive = 'true' } = req.query;
    
    const filters: any = {
      isActive: isActive === 'true'
    };

    // Filter by difficulty if provided
    if (difficulty && Object.values(Difficulty).includes(difficulty as Difficulty)) {
      filters.difficultyLevel = difficulty as Difficulty;
    }

    // Filter by tags if provided
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filters.tags = {
        contains: tagArray.join('|') // Simple tag filtering
      };
    }

    let problems;

    if (contestId) {
      // Get problems for a specific contest
      problems = await prisma.questionProblem.findMany({
        where: {
          ...filters,
          contestProblems: {
            some: {
              contestId: contestId as string
            }
          }
        },
        include: {
          contestProblems: {
            where: {
              contestId: contestId as string
            },
            select: {
              contestId: true,
              order: true,
              points: true
            }
          },
          createdBy: {
            select: {
              username: true,
              displayName: true
            }
          }
        },
        orderBy: [
          {
            contestProblems: {
              _count: 'desc'
            }
          },
          {
            createdAt: 'desc'
          }
        ]
      });
    } else {
      // Get all problems
      problems = await prisma.questionProblem.findMany({
        where: filters,
        include: {
          createdBy: {
            select: {
              username: true,
              displayName: true
            }
          },
          contestProblems: {
            select: {
              contestId: true,
              order: true,
              points: true,
              contest: {
                select: {
                  name: true,
                  status: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    // Transform the response to include contest-specific information
    const transformedProblems = problems.map(problem => ({
      id: problem.id,
      title: extractTitleFromQuestionText(problem.questionText),
      questionText: problem.questionText,
      difficulty: problem.difficultyLevel,
      tags: problem.tags ? JSON.parse(problem.tags) : [],
      maxScore: problem.maxScore,
      isActive: problem.isActive,
      createdAt: problem.createdAt,
      createdBy: problem.createdBy,
      contests: problem.contestProblems.map(cp => ({
        contestId: cp.contestId,
        contestName: (cp as any).contest?.name,
        contestStatus: (cp as any).contest?.status,
        order: cp.order,
        points: cp.points
      })),
      // For contest-specific requests, include the contest-specific points
      ...(contestId && problem.contestProblems.length > 0 && {
        contestOrder: problem.contestProblems[0].order,
        contestPoints: problem.contestProblems[0].points
      })
    }));

    res.status(200).json(transformedProblems);
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Helper function to extract title from question text
function extractTitleFromQuestionText(questionText: string): string {
  const lines = questionText.split('\n');
  return lines[0].substring(0, 100) + (lines[0].length > 100 ? '...' : '');
}

export const getProblemById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { contestId } = req.query;
  
  try {
    const problem = await prisma.questionProblem.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            username: true,
            displayName: true
          }
        },
        contestProblems: {
          include: {
            contest: {
              select: {
                id: true,
                name: true,
                status: true
              }
            }
          }
        },
        submissions: contestId ? {
          where: {
            contestId: contestId as string
          },
          select: {
            id: true,
            status: true,
            score: true,
            timestamp: true,
            submittedBy: {
              select: {
                username: true,
                displayName: true
              }
            }
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 10 // Limit recent submissions
        } : false
      }
    });

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Find contest-specific information if contestId is provided
    const contestProblem = contestId 
      ? problem.contestProblems.find(cp => cp.contestId === contestId)
      : null;

    const response = {
      id: problem.id,
      title: extractTitleFromQuestionText(problem.questionText),
      questionText: problem.questionText,
      difficulty: problem.difficultyLevel,
      tags: problem.tags ? JSON.parse(problem.tags) : [],
      maxScore: problem.maxScore,
      isActive: problem.isActive,
      createdAt: problem.createdAt,
      createdBy: problem.createdBy,
      contests: problem.contestProblems.map(cp => ({
        contestId: cp.contestId,
        contestName: cp.contest.name,
        contestStatus: cp.contest.status,
        order: cp.order,
        points: cp.points
      })),
      // Contest-specific information
      ...(contestProblem && {
        contestOrder: contestProblem.order,
        contestPoints: contestProblem.points
      }),
      // Recent submissions for this problem in the contest
      ...(contestId && {
        recentSubmissions: problem.submissions
      })
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching problem by ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Submission functionality moved to submissionController.ts

// getMySubmissions functionality moved to submissionController.ts

// New endpoints for problem metadata management

export const createProblem = async (req: AuthRequest, res: Response) => {
  const { questionText, difficulty, tags, maxScore } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  if (!questionText || !difficulty || !maxScore) {
    return res.status(400).json({ message: 'Question text, difficulty, and max score are required' });
  }

  if (!Object.values(Difficulty).includes(difficulty)) {
    return res.status(400).json({ message: 'Invalid difficulty level' });
  }

  try {
    const problem = await prisma.questionProblem.create({
      data: {
        questionText,
        difficultyLevel: difficulty as Difficulty,
        tags: tags ? JSON.stringify(tags) : null,
        maxScore: parseFloat(maxScore),
        createdById: userId,
        isActive: true
      },
      include: {
        createdBy: {
          select: {
            username: true,
            displayName: true
          }
        }
      }
    });

    const response = {
      id: problem.id,
      title: extractTitleFromQuestionText(problem.questionText),
      questionText: problem.questionText,
      difficulty: problem.difficultyLevel,
      tags: problem.tags ? JSON.parse(problem.tags) : [],
      maxScore: problem.maxScore,
      isActive: problem.isActive,
      createdAt: problem.createdAt,
      createdBy: problem.createdBy
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating problem:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProblem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { questionText, difficulty, tags, maxScore, isActive } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    // Check if problem exists and user has permission to update
    const existingProblem = await prisma.questionProblem.findUnique({
      where: { id },
      include: {
        createdBy: true
      }
    });

    if (!existingProblem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // For now, allow any authenticated user to update. In production, add proper permission checks
    const updateData: any = {};

    if (questionText !== undefined) {
      updateData.questionText = questionText;
    }
    if (difficulty !== undefined) {
      if (!Object.values(Difficulty).includes(difficulty)) {
        return res.status(400).json({ message: 'Invalid difficulty level' });
      }
      updateData.difficultyLevel = difficulty as Difficulty;
    }
    if (tags !== undefined) {
      updateData.tags = tags ? JSON.stringify(tags) : null;
    }
    if (maxScore !== undefined) {
      updateData.maxScore = parseFloat(maxScore);
    }
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    const updatedProblem = await prisma.questionProblem.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            username: true,
            displayName: true
          }
        }
      }
    });

    const response = {
      id: updatedProblem.id,
      title: extractTitleFromQuestionText(updatedProblem.questionText),
      questionText: updatedProblem.questionText,
      difficulty: updatedProblem.difficultyLevel,
      tags: updatedProblem.tags ? JSON.parse(updatedProblem.tags) : [],
      maxScore: updatedProblem.maxScore,
      isActive: updatedProblem.isActive,
      createdAt: updatedProblem.createdAt,
      createdBy: updatedProblem.createdBy
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating problem:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteProblem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    // Check if problem exists
    const existingProblem = await prisma.questionProblem.findUnique({
      where: { id },
      include: {
        submissions: true,
        contestProblems: true
      }
    });

    if (!existingProblem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Check if problem has submissions or is used in contests
    if (existingProblem.submissions.length > 0 || existingProblem.contestProblems.length > 0) {
      // Soft delete by marking as inactive
      await prisma.questionProblem.update({
        where: { id },
        data: { isActive: false }
      });
      
      res.status(200).json({ 
        message: 'Problem marked as inactive due to existing submissions or contest usage' 
      });
    } else {
      // Hard delete if no dependencies
      await prisma.questionProblem.delete({
        where: { id }
      });
      
      res.status(200).json({ message: 'Problem deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting problem:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProblemsByDifficulty = async (req: Request, res: Response) => {
  try {
    const problems = await prisma.questionProblem.groupBy({
      by: ['difficultyLevel'],
      where: {
        isActive: true
      },
      _count: {
        id: true
      }
    });

    const difficultyStats = problems.map(group => ({
      difficulty: group.difficultyLevel,
      count: group._count.id
    }));

    res.status(200).json(difficultyStats);
  } catch (error) {
    console.error('Error fetching problems by difficulty:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProblemTags = async (req: Request, res: Response) => {
  try {
    const problems = await prisma.questionProblem.findMany({
      where: {
        isActive: true,
        tags: {
          not: null
        }
      },
      select: {
        tags: true
      }
    });

    // Extract and count all unique tags
    const tagCounts: { [key: string]: number } = {};
    
    problems.forEach(problem => {
      if (problem.tags) {
        try {
          const tags = JSON.parse(problem.tags);
          if (Array.isArray(tags)) {
            tags.forEach(tag => {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
          }
        } catch (error) {
          // Skip invalid JSON
        }
      }
    });

    const tagStats = Object.entries(tagCounts).map(([tag, count]) => ({
      tag,
      count
    })).sort((a, b) => b.count - a.count);

    res.status(200).json(tagStats);
  } catch (error) {
    console.error('Error fetching problem tags:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};