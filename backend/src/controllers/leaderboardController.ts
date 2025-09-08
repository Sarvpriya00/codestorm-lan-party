import { Request, Response } from 'express';
import { leaderboardService } from '../services/leaderboardService';
import { Role } from '@prisma/client';

interface AuthRequest extends Request {
  userId?: string;
  userRole?: Role;
}

/**
 * Get leaderboard for a specific contest
 */
export const getContestLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { contestId } = req.params;
    const { limit, offset, userId } = req.query;

    if (!contestId) {
      return res.status(400).json({ message: 'Contest ID is required' });
    }

    const filters = {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      userId: userId as string
    };

    const result = await leaderboardService.getContestLeaderboard(contestId, filters);
    
    res.status(200).json({
      entries: result.entries,
      total: result.total,
      page: Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1,
      pageSize: filters.limit || 50,
      totalPages: Math.ceil(result.total / (filters.limit || 50))
    });
  } catch (error) {
    console.error('Error fetching contest leaderboard:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get user's position in contest leaderboard
 */
export const getUserLeaderboardPosition = async (req: AuthRequest, res: Response) => {
  try {
    const { contestId, userId } = req.params;

    if (!contestId || !userId) {
      return res.status(400).json({ message: 'Contest ID and User ID are required' });
    }

    const position = await leaderboardService.getUserLeaderboardPosition(contestId, userId);

    if (!position) {
      return res.status(404).json({ message: 'User not found in leaderboard' });
    }

    res.status(200).json(position);
  } catch (error) {
    console.error('Error fetching user leaderboard position:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update leaderboard for a specific contest
 */
export const updateContestLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { contestId } = req.params;

    if (!contestId) {
      return res.status(400).json({ message: 'Contest ID is required' });
    }

    const entries = await leaderboardService.updateContestLeaderboard(contestId);
    
    res.status(200).json({
      message: 'Leaderboard updated successfully',
      entriesCount: entries.length,
      topEntries: entries.slice(0, 10)
    });
  } catch (error) {
    console.error('Error updating contest leaderboard:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get global leaderboard across all contests
 */
export const getGlobalLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { limit } = req.query;
    const limitNum = limit ? parseInt(limit as string) : 20;

    const globalLeaderboard = await leaderboardService.getGlobalLeaderboard(limitNum);
    
    res.status(200).json(globalLeaderboard);
  } catch (error) {
    console.error('Error fetching global leaderboard:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update all contest leaderboards
 */
export const updateAllLeaderboards = async (req: AuthRequest, res: Response) => {
  try {
    const results = await leaderboardService.updateAllContestLeaderboards();
    
    res.status(200).json({
      message: 'All contest leaderboards updated successfully',
      updatedContests: results.length,
      results
    });
  } catch (error) {
    console.error('Error updating all leaderboards:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Legacy endpoint for backward compatibility
 */
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    // Try to get a default contest or return global leaderboard
    const globalLeaderboard = await leaderboardService.getGlobalLeaderboard(50);
    
    // Transform to legacy format
    const leaderboard = globalLeaderboard.map((entry, index) => ({
      username: entry.username,
      points: entry.totalScore,
      rank: index + 1
    }));

    res.status(200).json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};