import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { attendanceService } from '../services/attendanceService';
import { auditService } from '../services/auditService';

interface AuthRequest extends Request {
  userId?: string;
  userRole?: Role;
}

export const checkIn = async (req: AuthRequest, res: Response) => {
  const { contestId, userId } = req.body;

  if (!contestId) {
    return res.status(400).json({ message: 'Contest ID is required' });
  }

  // Use authenticated user ID if not provided (for self check-in)
  const targetUserId = userId || req.userId;

  if (!targetUserId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const attendance = await attendanceService.checkIn({
      contestId,
      userId: targetUserId
    });

    // Log the check-in
    if (req.userId) {
      await auditService.createAuditLog({
        userId: req.userId,
        action: 'ATTENDANCE_CHECKED_IN',
        ipAddress: req.ip,
        details: {
          contestId,
          targetUserId,
          checkinTime: attendance.checkinTime
        }
      });
    }

    res.status(200).json({
      message: 'Check-in successful',
      attendance
    });
  } catch (error) {
    console.error('Error during check-in:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Internal server error' });
  }
};

export const checkOut = async (req: AuthRequest, res: Response) => {
  const { contestId, userId } = req.body;

  if (!contestId) {
    return res.status(400).json({ message: 'Contest ID is required' });
  }

  // Use authenticated user ID if not provided (for self check-out)
  const targetUserId = userId || req.userId;

  if (!targetUserId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const attendance = await attendanceService.checkOut({
      contestId,
      userId: targetUserId
    });

    // Log the check-out
    if (req.userId) {
      await auditService.createAuditLog({
        userId: req.userId,
        action: 'ATTENDANCE_CHECKED_OUT',
        ipAddress: req.ip,
        details: {
          contestId,
          targetUserId,
          checkoutTime: attendance.checkoutTime
        }
      });
    }

    res.status(200).json({
      message: 'Check-out successful',
      attendance
    });
  } catch (error) {
    console.error('Error during check-out:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Internal server error' });
  }
};

export const updateAttendanceStatus = async (req: AuthRequest, res: Response) => {
  const { contestId, userId, status } = req.body;

  if (!contestId || !userId || !status) {
    return res.status(400).json({ message: 'Contest ID, User ID, and status are required' });
  }

  const validStatuses = ['PRESENT', 'ABSENT'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const attendance = await attendanceService.updateAttendanceStatus(contestId, userId, status);

    // Log the status update
    if (req.userId) {
      await auditService.createAuditLog({
        userId: req.userId,
        action: 'ATTENDANCE_UPDATED',
        ipAddress: req.ip,
        details: {
          contestId,
          targetUserId: userId,
          newStatus: status,
          updatedBy: req.userId
        }
      });
    }

    res.status(200).json({
      message: 'Attendance status updated successfully',
      attendance
    });
  } catch (error) {
    console.error('Error updating attendance status:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Internal server error' });
  }
};

export const getAttendanceRecords = async (req: AuthRequest, res: Response) => {
  const { 
    contestId, 
    userId, 
    status, 
    checkinAfter, 
    checkinBefore,
    page = 1,
    pageSize = 50
  } = req.query;

  try {
    const filters: any = {};
    
    if (contestId) filters.contestId = contestId as string;
    if (userId) filters.userId = userId as string;
    if (status) filters.status = status as any;
    if (checkinAfter) filters.checkinAfter = new Date(checkinAfter as string);
    if (checkinBefore) filters.checkinBefore = new Date(checkinBefore as string);

    const records = await attendanceService.getAttendanceRecords(filters);

    // Apply pagination
    const startIndex = (Number(page) - 1) * Number(pageSize);
    const endIndex = startIndex + Number(pageSize);
    const paginatedRecords = records.slice(startIndex, endIndex);

    res.status(200).json({
      records: paginatedRecords,
      total: records.length,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(records.length / Number(pageSize))
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getContestAttendance = async (req: AuthRequest, res: Response) => {
  const { contestId } = req.params;

  if (!contestId) {
    return res.status(400).json({ message: 'Contest ID is required' });
  }

  try {
    const attendance = await attendanceService.getContestAttendance(contestId);

    res.status(200).json({ attendance });
  } catch (error) {
    console.error('Error fetching contest attendance:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserAttendance = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const attendance = await attendanceService.getUserAttendance(userId);

    res.status(200).json({ attendance });
  } catch (error) {
    console.error('Error fetching user attendance:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const generateAttendanceReport = async (req: AuthRequest, res: Response) => {
  const { contestId } = req.params;

  if (!contestId) {
    return res.status(400).json({ message: 'Contest ID is required' });
  }

  try {
    const report = await attendanceService.generateAttendanceReport(contestId);

    res.status(200).json({ report });
  } catch (error) {
    console.error('Error generating attendance report:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Internal server error' });
  }
};

export const getAttendanceStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const statistics = await attendanceService.getAttendanceStatistics();

    res.status(200).json({ statistics });
  } catch (error) {
    console.error('Error fetching attendance statistics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const markAbsentUsers = async (req: AuthRequest, res: Response) => {
  const { contestId } = req.params;

  if (!contestId) {
    return res.status(400).json({ message: 'Contest ID is required' });
  }

  try {
    const markedAbsentCount = await attendanceService.markAbsentUsers(contestId);

    // Log the bulk absent marking
    if (req.userId) {
      await auditService.createAuditLog({
        userId: req.userId,
        action: 'ATTENDANCE_UPDATED',
        ipAddress: req.ip,
        details: {
          contestId,
          action: 'mark_absent_users',
          markedAbsentCount,
          performedBy: req.userId
        }
      });
    }

    res.status(200).json({
      message: `Successfully marked ${markedAbsentCount} users as absent`,
      markedAbsentCount
    });
  } catch (error) {
    console.error('Error marking absent users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const trackActivity = async (req: AuthRequest, res: Response) => {
  const { contestId } = req.body;

  if (!req.userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    await attendanceService.trackUserActivity(req.userId, contestId);

    res.status(200).json({ message: 'Activity tracked successfully' });
  } catch (error) {
    console.error('Error tracking user activity:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};