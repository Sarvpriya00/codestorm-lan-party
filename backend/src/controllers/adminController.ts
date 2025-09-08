import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client'; // Import PrismaClient
import * as bcrypt from 'bcryptjs';
import { broadcastMessage } from '../services/websocketService';
import { Parser } from 'json2csv'; // Changed import back to named import
import { systemControlService, CONTEST_PHASES } from '../services/systemControlService';
import { auditService } from '../services/auditService';
import { backupService } from '../services/backupService';

const prisma = new PrismaClient(); // Added this line back

interface AuthRequest extends Request {
  userId?: string;
  userRole?: Role;
}

export const getDashboardData = async (req: AuthRequest, res: Response) => {
  try {
    // Total Users
    const totalUsers = await prisma.user.count();

    // Total Problems
    const totalProblems = await prisma.problem.count();

    // Total Submissions
    const totalSubmissions = await prisma.submission.count();

    // Accepted Submissions
    const acceptedSubmissions = await prisma.submission.count({
      where: { status: 'ACCEPTED' },
    });

    // Recent Activity (e.g., last 10 audit logs)
    const recentActivity = await prisma.auditLog.findMany({
      orderBy: {
        timestamp: 'desc',
      },
      take: 10,
      select: {
        actor: true,
        entity: true,
        details: true,
        timestamp: true,
      },
    });

    // Current Contest State - get from active contest
    const activeContest = await prisma.contest.findFirst({
      where: { status: 'RUNNING' }
    });
    
    let contestState = null;
    if (activeContest) {
      contestState = await systemControlService.getContestState(activeContest.id);
    }

    res.status(200).json({
      totalUsers,
      totalProblems,
      totalSubmissions,
      acceptedSubmissions,
      recentActivity,
      contestState: contestState || null,
    });
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createProblem = async (req: AuthRequest, res: Response) => {
  const { title, description, difficulty, points, test_cases, hidden_judge_notes } = req.body;

  if (!title || !description || !difficulty || points === undefined || !test_cases) {
    return res.status(400).json({ message: 'Missing required problem fields' });
  }

  try {
    const newProblem = await prisma.problem.create({
      data: {
        title,
        description,
        difficulty,
        points,
        test_cases,
        hidden_judge_notes,
      },
    });

    broadcastMessage('content.changed', { type: 'problem', action: 'created', problemId: newProblem.id });

    res.status(201).json({ message: 'Problem created successfully', problem: newProblem });
  } catch (error) {
    console.error('Error creating problem:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProblem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, difficulty, points, test_cases, hidden_judge_notes } = req.body;

  try {
    const updatedProblem = await prisma.problem.update({
      where: { id },
      data: {
        title,
        description,
        difficulty,
        points,
        test_cases,
        hidden_judge_notes,
      },
    });

    broadcastMessage('content.changed', { type: 'problem', action: 'updated', problemId: updatedProblem.id });

    res.status(200).json({ message: 'Problem updated successfully', problem: updatedProblem });
  } catch (error) {
    console.error('Error updating problem:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
      },
    });
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Username, password, and role are required' });
  }

  if (!Object.values(Role).includes(role)) {
    return res.status(400).json({ message: 'Invalid role provided' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
      },
    });
    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ message: 'Role is required' });
  }

  if (!Object.values(Role).includes(role)) {
    return res.status(400).json({ message: 'Invalid role provided' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
    });
    res.status(200).json({ message: 'User role updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateContestState = async (req: AuthRequest, res: Response) => {
  const { contestId, phase, startTime, endTime } = req.body;

  if (!contestId) {
    return res.status(400).json({ message: 'Contest ID is required' });
  }

  if (!phase) {
    return res.status(400).json({ message: 'Contest phase is required' });
  }

  // Validate phase
  const validPhases = Object.values(CONTEST_PHASES);
  if (!validPhases.includes(phase)) {
    return res.status(400).json({ message: `Invalid phase. Must be one of: ${validPhases.join(', ')}` });
  }

  if (!req.userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const result = await systemControlService.updateContestPhase({
      contestId,
      phase,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      setById: req.userId
    });

    broadcastMessage('contest.timer', {
      phase: phase,
      startTime: result.contest.startTime,
      endTime: result.contest.endTime,
      contestId: contestId
    });

    res.status(200).json({ 
      message: 'Contest state updated successfully', 
      contest: result.contest,
      systemControl: result.systemControl
    });
  } catch (error) {
    console.error('Error updating contest state:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Internal server error' });
  }
};

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  const { 
    page = 1, 
    pageSize = 10,
    userId,
    action,
    permissionId,
    startDate,
    endDate,
    ipAddress
  } = req.query;

  try {
    const filters: any = {};
    
    if (userId) filters.userId = userId as string;
    if (action) filters.action = action as string;
    if (permissionId) filters.permissionId = permissionId as string;
    if (ipAddress) filters.ipAddress = ipAddress as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const result = await auditService.getAuditLogs(
      filters,
      Number(page),
      Number(pageSize)
    );

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const exportSubmissionsCsv = async (req: AuthRequest, res: Response) => {
  try {
    const submissions = await prisma.submission.findMany({
      include: {
        user: {
          select: {
            username: true,
          },
        },
        problem: {
          select: {
            title: true,
          },
        },
      },
    });

    const fields = [
      { label: 'Submission ID', value: 'id' },
      { label: 'Username', value: 'user.username' },
      { label: 'Problem Title', value: 'problem.title' },
      { label: 'Language', value: 'language' },
      { label: 'Status', value: 'status' },
      { label: 'Attempt Count', value: 'attemptCount' },
      { label: 'Submitted At', value: 'createdAt' },
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(submissions);

    res.header('Content-Type', 'text/csv');
    res.attachment('submissions.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting submissions CSV:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const exportStandingsCsv = async (req: AuthRequest, res: Response) => {
  try {
    const leaderboardData = await prisma.scoreEvent.groupBy({
      by: ['userId'],
      _sum: {
        points: true,
      },
      orderBy: {
        _sum: {
          points: 'desc',
        },
      },
    });

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
      },
    });

    const standings = leaderboardData.map(data => {
      const user = users.find(u => u.id === data.userId);
      return {
        username: user ? user.username : 'Unknown User',
        points: data._sum.points || 0,
        // TODO: Calculate total time for accepted submissions for standings
      };
    });

    const fields = [
      { label: 'Username', value: 'username' },
      { label: 'Points', value: 'points' },
      // { label: 'Total Time', value: 'totalTime' }, // Uncomment when totalTime is implemented
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(standings);

    res.header('Content-Type', 'text/csv');
    res.attachment('standings.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting standings CSV:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const performEmergencyAction = async (req: AuthRequest, res: Response) => {
  const { contestId, action, reason } = req.body;

  if (!contestId || !action) {
    return res.status(400).json({ message: 'Contest ID and action are required' });
  }

  if (!req.userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  const validActions = ['shutdown', 'reset', 'pause', 'resume'];
  if (!validActions.includes(action)) {
    return res.status(400).json({ message: `Invalid action. Must be one of: ${validActions.join(', ')}` });
  }

  try {
    const systemControl = await systemControlService.performEmergencyAction({
      contestId,
      action,
      reason,
      setById: req.userId
    });

    // Broadcast emergency action to all clients
    broadcastMessage('contest.emergency', {
      contestId,
      action,
      reason,
      timestamp: systemControl.setAt
    });

    res.status(200).json({ 
      message: `Emergency action '${action}' performed successfully`,
      systemControl
    });
  } catch (error) {
    console.error('Error performing emergency action:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Internal server error' });
  }
};

export const getSystemControls = async (req: AuthRequest, res: Response) => {
  const { contestId } = req.params;
  const { controlCode } = req.query;

  if (!contestId) {
    return res.status(400).json({ message: 'Contest ID is required' });
  }

  try {
    const controls = await systemControlService.getSystemControls(
      contestId, 
      controlCode ? parseInt(controlCode as string) : undefined
    );

    res.status(200).json({ controls });
  } catch (error) {
    console.error('Error fetching system controls:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getContestState = async (req: AuthRequest, res: Response) => {
  const { contestId } = req.params;

  if (!contestId) {
    return res.status(400).json({ message: 'Contest ID is required' });
  }

  try {
    const contestState = await systemControlService.getContestState(contestId);
    
    if (!contestState) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    res.status(200).json({ contestState });
  } catch (error) {
    console.error('Error fetching contest state:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserAuditLogs = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const { page = 1, pageSize = 20 } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const result = await auditService.getUserAuditLogs(
      userId,
      Number(page),
      Number(pageSize)
    );

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching user audit logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAuditStatistics = async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query;

  try {
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const statistics = await auditService.getAuditStatistics(start, end);

    res.status(200).json(statistics);
  } catch (error) {
    console.error('Error fetching audit statistics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const cleanupAuditLogs = async (req: AuthRequest, res: Response) => {
  const { retentionDays = 365 } = req.body;

  if (!req.userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const deletedCount = await auditService.cleanupOldLogs(Number(retentionDays));

    // Log the cleanup action
    await auditService.logSystemAdministration(
      'SYSTEM_CONTROL_UPDATED',
      req.userId,
      undefined, // TODO: Add permission ID for audit cleanup
      req.ip,
      {
        action: 'audit_logs_cleanup',
        retentionDays: Number(retentionDays),
        deletedCount
      }
    );

    res.status(200).json({ 
      message: `Successfully cleaned up ${deletedCount} old audit logs`,
      deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up audit logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createBackup = async (req: AuthRequest, res: Response) => {
  const { includeData = true, includeFiles = false, description } = req.body;

  if (!req.userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const backupRecord = await backupService.createBackup({
      createdById: req.userId,
      includeData,
      includeFiles,
      description
    });

    // Log the backup creation
    await auditService.logSystemAdministration(
      'BACKUP_CREATED',
      req.userId,
      undefined, // TODO: Add permission ID for backup creation
      req.ip,
      {
        backupId: backupRecord.id,
        includeData,
        includeFiles,
        description
      }
    );

    res.status(201).json({ 
      message: 'Backup created successfully',
      backup: backupRecord
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Internal server error' });
  }
};

export const getBackups = async (req: AuthRequest, res: Response) => {
  try {
    const backups = await backupService.getBackupRecords();

    res.status(200).json({ backups });
  } catch (error) {
    console.error('Error fetching backups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const restoreBackup = async (req: AuthRequest, res: Response) => {
  const { backupId } = req.params;
  const { overwriteExisting = false } = req.body;

  if (!req.userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  if (!backupId) {
    return res.status(400).json({ message: 'Backup ID is required' });
  }

  try {
    await backupService.restoreBackup({
      backupId,
      restoredById: req.userId,
      overwriteExisting
    });

    // Log the backup restoration
    await auditService.logSystemAdministration(
      'BACKUP_RESTORED',
      req.userId,
      undefined, // TODO: Add permission ID for backup restoration
      req.ip,
      {
        backupId,
        overwriteExisting
      }
    );

    res.status(200).json({ message: 'Backup restored successfully' });
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Internal server error' });
  }
};

export const deleteBackup = async (req: AuthRequest, res: Response) => {
  const { backupId } = req.params;

  if (!backupId) {
    return res.status(400).json({ message: 'Backup ID is required' });
  }

  try {
    await backupService.deleteBackup(backupId);

    res.status(200).json({ message: 'Backup deleted successfully' });
  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Internal server error' });
  }
};

export const validateBackup = async (req: AuthRequest, res: Response) => {
  const { backupId } = req.params;

  if (!backupId) {
    return res.status(400).json({ message: 'Backup ID is required' });
  }

  try {
    const validation = await backupService.validateBackup(backupId);

    res.status(200).json(validation);
  } catch (error) {
    console.error('Error validating backup:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const exportData = async (req: AuthRequest, res: Response) => {
  const { type, format = 'csv', filters } = req.body;

  if (!req.userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  if (!type) {
    return res.status(400).json({ message: 'Export type is required' });
  }

  const validTypes = ['submissions', 'users', 'contests', 'problems', 'leaderboard', 'audit_logs'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ message: `Invalid export type. Must be one of: ${validTypes.join(', ')}` });
  }

  const validFormats = ['csv', 'json'];
  if (!validFormats.includes(format)) {
    return res.status(400).json({ message: `Invalid format. Must be one of: ${validFormats.join(', ')}` });
  }

  try {
    const filePath = await backupService.exportData({
      type,
      format,
      filters,
      createdById: req.userId
    });

    // Log the data export
    await auditService.logSystemAdministration(
      'DATA_EXPORTED',
      req.userId,
      undefined, // TODO: Add permission ID for data export
      req.ip,
      {
        exportType: type,
        format,
        filePath,
        filters
      }
    );

    res.status(200).json({ 
      message: 'Data exported successfully',
      filePath
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Internal server error' });
  }
};