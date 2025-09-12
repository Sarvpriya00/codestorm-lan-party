import { Request, Response } from 'express';
import { ContestStatus, ParticipantStatus } from '@prisma/client';
import { contestService, CreateContestRequest, UpdateContestRequest, ContestFilters } from '../services/contestService';
import { contestProblemService, AddProblemToContestRequest, UpdateContestProblemRequest } from '../services/contestProblemService';
import { contestUserService, JoinContestRequest, UpdateParticipantStatusRequest } from '../services/contestUserService';
import { broadcastMessage } from '../services/websocketService';

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

interface ContestParticipantFilters {
  status?: ParticipantStatus;
  joinedAfter?: Date;
  joinedBefore?: Date;
}

/**
 * Create a new contest
 */
export const createContest = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, startTime, endTime, status } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Contest name is required' });
    }

    const contestData: CreateContestRequest = {
      name,
      description,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      status: status as ContestStatus
    };

    const contest = await contestService.createContest(contestData);

    // Broadcast contest creation
    broadcastMessage('contest.created', {
      id: contest.id,
      name: contest.name,
      status: contest.status,
      startTime: contest.startTime,
      endTime: contest.endTime
    });

    res.status(201).json({
      message: 'Contest created successfully',
      contest
    });
  } catch (error) {
    console.error('Error creating contest:', error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : 'Failed to create contest' 
    });
  }
};

/**
 * Update an existing contest
 */
export const updateContest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, startTime, endTime, status } = req.body;

    const updateData: UpdateContestRequest = {
      name,
      description,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      status: status as ContestStatus
    };

    const contest = await contestService.updateContest(id, updateData);

    // Broadcast contest update
    broadcastMessage('contest.updated', {
      id: contest.id,
      name: contest.name,
      status: contest.status,
      startTime: contest.startTime,
      endTime: contest.endTime
    });

    res.status(200).json({
      message: 'Contest updated successfully',
      contest
    });
  } catch (error) {
    console.error('Error updating contest:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : 'Failed to update contest' 
      });
    }
  }
};

/**
 * Get contest by ID
 */
export const getContestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contest = await contestService.getContestById(id);

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    res.status(200).json(contest);
  } catch (error) {
    console.error('Error fetching contest:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get contests with optional filters
 */
export const getContests = async (req: Request, res: Response) => {
  try {
    const { status, startTimeAfter, startTimeBefore, endTimeAfter, endTimeBefore } = req.query;

    const filters: ContestFilters = {};

    if (status) {
      filters.status = status as ContestStatus;
    }

    if (startTimeAfter) {
      filters.startTimeAfter = new Date(startTimeAfter as string);
    }

    if (startTimeBefore) {
      filters.startTimeBefore = new Date(startTimeBefore as string);
    }

    if (endTimeAfter) {
      filters.endTimeAfter = new Date(endTimeAfter as string);
    }

    if (endTimeBefore) {
      filters.endTimeBefore = new Date(endTimeBefore as string);
    }

    const contests = await contestService.getContests(filters);
    res.status(200).json(contests);
  } catch (error) {
    console.error('Error fetching contests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a contest
 */
export const deleteContest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await contestService.deleteContest(id);

    // Broadcast contest deletion
    broadcastMessage('contest.deleted', { id });

    res.status(200).json({ message: 'Contest deleted successfully' });
  } catch (error) {
    console.error('Error deleting contest:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : 'Failed to delete contest' 
      });
    }
  }
};

/**
 * Update contest status
 */
export const updateContestStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    if (!Object.values(ContestStatus).includes(status)) {
      return res.status(400).json({ message: 'Invalid contest status' });
    }

    const contest = await contestService.updateContestStatus(id, status as ContestStatus);

    // Broadcast status change
    broadcastMessage('contest.status_changed', {
      id: contest.id,
      status: contest.status,
      name: contest.name
    });

    res.status(200).json({
      message: 'Contest status updated successfully',
      contest
    });
  } catch (error) {
    console.error('Error updating contest status:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : 'Failed to update contest status' 
      });
    }
  }
};

/**
 * Get active contests
 */
export const getActiveContests = async (req: Request, res: Response) => {
  try {
    const contests = await contestService.getActiveContests();
    res.status(200).json(contests);
  } catch (error) {
    console.error('Error fetching active contests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get upcoming contests
 */
export const getUpcomingContests = async (req: Request, res: Response) => {
  try {
    const contests = await contestService.getUpcomingContests();
    res.status(200).json(contests);
  } catch (error) {
    console.error('Error fetching upcoming contests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
/**
 * Add a problem to a contest
 */
export const addProblemToContest = async (req: AuthRequest, res: Response) => {
  try {
    const { contestId } = req.params;
    const { problemId, order, points } = req.body;

    if (!problemId || points === undefined) {
      return res.status(400).json({ message: 'Problem ID and points are required' });
    }

    if (points <= 0) {
      return res.status(400).json({ message: 'Points must be greater than 0' });
    }

    const data: AddProblemToContestRequest = {
      contestId,
      problemId,
      order,
      points
    };

    const contestProblem = await contestProblemService.addProblemToContest(data);

    // Broadcast problem addition
    broadcastMessage('contest.problem_added', {
      contestId,
      problemId,
      order: contestProblem.order,
      points: contestProblem.points
    });

    res.status(201).json({
      message: 'Problem added to contest successfully',
      contestProblem
    });
  } catch (error) {
    console.error('Error adding problem to contest:', error);
    if (error instanceof Error && (error.message.includes('not found') || error.message.includes('already associated'))) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

/**
 * Remove a problem from a contest
 */
export const removeProblemFromContest = async (req: AuthRequest, res: Response) => {
  try {
    const { contestId, problemId } = req.params;

    await contestProblemService.removeProblemFromContest(contestId, problemId);

    // Broadcast problem removal
    broadcastMessage('contest.problem_removed', {
      contestId,
      problemId
    });

    res.status(200).json({ message: 'Problem removed from contest successfully' });
  } catch (error) {
    console.error('Error removing problem from contest:', error);
    if (error instanceof Error && (error.message.includes('not associated') || error.message.includes('existing submissions'))) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

/**
 * Update contest-problem association
 */
export const updateContestProblem = async (req: AuthRequest, res: Response) => {
  try {
    const { contestId, problemId } = req.params;
    const { order, points } = req.body;

    if (points !== undefined && points <= 0) {
      return res.status(400).json({ message: 'Points must be greater than 0' });
    }

    const updateData: UpdateContestProblemRequest = {
      order,
      points
    };

    const contestProblem = await contestProblemService.updateContestProblem(contestId, problemId, updateData);

    // Broadcast problem update
    broadcastMessage('contest.problem_updated', {
      contestId,
      problemId,
      order: contestProblem.order,
      points: contestProblem.points
    });

    res.status(200).json({
      message: 'Contest problem updated successfully',
      contestProblem
    });
  } catch (error) {
    console.error('Error updating contest problem:', error);
    if (error instanceof Error && (error.message.includes('not associated') || error.message.includes('already used'))) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

/**
 * Get all problems for a contest
 */
export const getContestProblems = async (req: Request, res: Response) => {
  try {
    const { contestId } = req.params;
    const problems = await contestProblemService.getContestProblems(contestId);
    res.status(200).json(problems);
  } catch (error) {
    console.error('Error fetching contest problems:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get specific contest-problem association
 */
export const getContestProblem = async (req: Request, res: Response) => {
  try {
    const { contestId, problemId } = req.params;
    const contestProblem = await contestProblemService.getContestProblem(contestId, problemId);

    if (!contestProblem) {
      return res.status(404).json({ message: 'Contest-problem association not found' });
    }

    res.status(200).json(contestProblem);
  } catch (error) {
    console.error('Error fetching contest problem:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Reorder problems in a contest
 */
export const reorderContestProblems = async (req: AuthRequest, res: Response) => {
  try {
    const { contestId } = req.params;
    const { problemOrders } = req.body;

    if (!Array.isArray(problemOrders)) {
      return res.status(400).json({ message: 'problemOrders must be an array' });
    }

    // Validate each item in the array
    for (const item of problemOrders) {
      if (!item.problemId || typeof item.order !== 'number') {
        return res.status(400).json({ message: 'Each item must have problemId and order' });
      }
    }

    await contestProblemService.reorderContestProblems(contestId, problemOrders);

    // Broadcast reorder event
    broadcastMessage('contest.problems_reordered', {
      contestId,
      problemOrders
    });

    res.status(200).json({ message: 'Contest problems reordered successfully' });
  } catch (error) {
    console.error('Error reordering contest problems:', error);
    if (error instanceof Error && (error.message.includes('not found') || error.message.includes('not associated') || error.message.includes('unique'))) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

/**
 * Get contests for a specific problem
 */
export const getContestsForProblem = async (req: Request, res: Response) => {
  try {
    const { problemId } = req.params;
    const contests = await contestProblemService.getContestsForProblem(problemId);
    res.status(200).json(contests);
  } catch (error) {
    console.error('Error fetching contests for problem:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Validate contest-problem constraints
 */
export const validateContestProblemConstraints = async (req: Request, res: Response) => {
  try {
    const { contestId, problemId } = req.params;
    const validation = await contestProblemService.validateContestProblemConstraints(contestId, problemId);
    res.status(200).json(validation);
  } catch (error) {
    console.error('Error validating contest-problem constraints:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};/**
 
* Join a contest as a participant
 */
export const joinContest = async (req: AuthRequest, res: Response) => {
  try {
    const { contestId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const data: JoinContestRequest = {
      contestId,
      userId
    };

    const contestUser = await contestUserService.joinContest(data);

    // Broadcast participant joined
    broadcastMessage('contest.participant_joined', {
      contestId,
      userId,
      username: req.body.username || 'Unknown User'
    });

    res.status(201).json({
      message: 'Successfully joined contest',
      contestUser
    });
  } catch (error) {
    console.error('Error joining contest:', error);
    if (error instanceof Error && (error.message.includes('not found') || error.message.includes('already registered') || error.message.includes('Cannot join'))) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

/**
 * Leave a contest (withdraw participation)
 */
export const leaveContest = async (req: AuthRequest, res: Response) => {
  try {
    const { contestId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const contestUser = await contestUserService.leaveContest(contestId, userId);

    // Broadcast participant left
    broadcastMessage('contest.participant_left', {
      contestId,
      userId,
      status: contestUser.status
    });

    res.status(200).json({
      message: 'Successfully left contest',
      contestUser
    });
  } catch (error) {
    console.error('Error leaving contest:', error);
    if (error instanceof Error && (error.message.includes('not registered') || error.message.includes('Cannot withdraw'))) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

/**
 * Update participant status (admin only)
 */
export const updateParticipantStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { contestId, userId } = req.params;
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const data: UpdateParticipantStatusRequest = {
      status,
      reason
    };

    const contestUser = await contestUserService.updateParticipantStatus(contestId, userId, data);

    // Broadcast status change
    broadcastMessage('contest.participant_status_changed', {
      contestId,
      userId,
      status: contestUser.status,
      reason
    });

    res.status(200).json({
      message: 'Participant status updated successfully',
      contestUser
    });
  } catch (error) {
    console.error('Error updating participant status:', error);
    if (error instanceof Error && (error.message.includes('not registered') || error.message.includes('Invalid status transition'))) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

/**
 * Get contest participants
 */
export const getContestParticipants = async (req: Request, res: Response) => {
  try {
    const { contestId } = req.params;
    const { status, joinedAfter, joinedBefore } = req.query;

    const filters: ContestParticipantFilters = {};

    if (status && typeof status === 'string' && Object.values(ParticipantStatus).includes(status as ParticipantStatus)) {
      filters.status = status as ParticipantStatus;
    }

    if (joinedAfter) {
      filters.joinedAfter = new Date(joinedAfter as string);
    }

    if (joinedBefore) {
      filters.joinedBefore = new Date(joinedBefore as string);
    }

    const participants = await contestUserService.getContestParticipants(contestId, filters);
    res.status(200).json(participants);
  } catch (error) {
    console.error('Error fetching contest participants:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get user's contest participations
 */
export const getUserContests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { status, joinedAfter, joinedBefore } = req.query;

    const filters: ContestParticipantFilters = {};

    if (status && typeof status === 'string' && Object.values(ParticipantStatus).includes(status as ParticipantStatus)) {
      filters.status = status as ParticipantStatus;
    }

    if (joinedAfter) {
      filters.joinedAfter = new Date(joinedAfter as string);
    }

    if (joinedBefore) {
      filters.joinedBefore = new Date(joinedBefore as string);
    }

    const contests = await contestUserService.getUserContests(userId, filters);
    res.status(200).json(contests);
  } catch (error) {
    console.error('Error fetching user contests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get specific contest-user registration
 */
export const getContestUser = async (req: Request, res: Response) => {
  try {
    const { contestId, userId } = req.params;
    const contestUser = await contestUserService.getContestUser(contestId, userId);

    if (!contestUser) {
      return res.status(404).json({ message: 'Contest participation not found' });
    }

    res.status(200).json(contestUser);
  } catch (error) {
    console.error('Error fetching contest user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get contest participation statistics
 */
export const getContestParticipationStats = async (req: Request, res: Response) => {
  try {
    const { contestId } = req.params;
    const stats = await contestUserService.getContestParticipationStats(contestId);
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching contest participation stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Bulk update participant statuses (admin only)
 */
export const bulkUpdateParticipantStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { contestId } = req.params;
    const { userIds, status } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds must be a non-empty array' });
    }

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const updatedCount = await contestUserService.bulkUpdateParticipantStatus(contestId, userIds, status);

    // Broadcast bulk status change
    broadcastMessage('contest.participants_bulk_status_changed', {
      contestId,
      userIds,
      status,
      updatedCount
    });

    res.status(200).json({
      message: `Successfully updated ${updatedCount} participants`,
      updatedCount
    });
  } catch (error) {
    console.error('Error bulk updating participant status:', error);
    if (error instanceof Error && (error.message.includes('not found') || error.message.includes('not registered'))) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

/**
 * Check if user can join a contest
 */
export const canUserJoinContest = async (req: AuthRequest, res: Response) => {
  try {
    const { contestId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const eligibility = await contestUserService.canUserJoinContest(contestId, userId);
    res.status(200).json(eligibility);
  } catch (error) {
    console.error('Error checking contest eligibility:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};