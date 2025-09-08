import { Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService';
import { Role } from '@prisma/client';

interface AuthRequest extends Request {
  userId?: string;
  userRole?: Role;
}

/**
 * Get analytics for a specific contest
 */
export const getContestAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { contestId } = req.params;

    if (!contestId) {
      return res.status(400).json({ message: 'Contest ID is required' });
    }

    const analytics = await analyticsService.getContestAnalytics(contestId);

    if (!analytics) {
      return res.status(404).json({ message: 'Analytics not found for this contest' });
    }

    res.status(200).json(analytics);
  } catch (error) {
    console.error('Error fetching contest analytics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get detailed statistics for a specific contest
 */
export const getContestStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const { contestId } = req.params;

    if (!contestId) {
      return res.status(400).json({ message: 'Contest ID is required' });
    }

    const statistics = await analyticsService.getContestStatistics(contestId);

    if (!statistics) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    res.status(200).json(statistics);
  } catch (error) {
    console.error('Error fetching contest statistics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get system-wide metrics
 */
export const getSystemMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const metrics = await analyticsService.getSystemMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update analytics for a specific contest
 */
export const updateContestAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { contestId } = req.params;

    if (!contestId) {
      return res.status(400).json({ message: 'Contest ID is required' });
    }

    const analytics = await analyticsService.updateContestAnalytics(contestId);
    res.status(200).json({
      message: 'Analytics updated successfully',
      analytics
    });
  } catch (error) {
    console.error('Error updating contest analytics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update analytics for all active contests
 */
export const updateAllContestAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const results = await analyticsService.updateAllContestAnalytics();
    res.status(200).json({
      message: 'Analytics updated for all active contests',
      updatedContests: results.length,
      results
    });
  } catch (error) {
    console.error('Error updating all contest analytics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get analytics for multiple contests
 */
export const getMultipleContestAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { contestIds } = req.body;

    if (!contestIds || !Array.isArray(contestIds)) {
      return res.status(400).json({ message: 'Contest IDs array is required' });
    }

    const analytics = await analyticsService.getMultipleContestAnalytics(contestIds);
    res.status(200).json(analytics);
  } catch (error) {
    console.error('Error fetching multiple contest analytics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get problem-specific analytics for a contest
 */
export const getProblemAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { contestId, problemId } = req.params;

    if (!contestId || !problemId) {
      return res.status(400).json({ message: 'Contest ID and Problem ID are required' });
    }

    const analytics = await analyticsService.getProblemAnalytics(contestId, problemId);
    res.status(200).json(analytics);
  } catch (error) {
    console.error('Error fetching problem analytics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get analytics dashboard data (enhanced version of admin dashboard)
 */
export const getAnalyticsDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const [systemMetrics, activeContests] = await Promise.all([
      analyticsService.getSystemMetrics(),
      analyticsService.updateAllContestAnalytics()
    ]);

    res.status(200).json({
      systemMetrics,
      activeContests,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error fetching analytics dashboard:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};