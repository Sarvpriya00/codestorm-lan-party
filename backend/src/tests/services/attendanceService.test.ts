import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient, ContestStatus, AttendanceStatus, ParticipantStatus } from '@prisma/client';
import { AttendanceService } from '../../services/attendanceService';

const prisma = new PrismaClient();
const attendanceService = new AttendanceService(prisma);

describe('AttendanceService', () => {
  let testUserId: string;
  let testContestId: string;
  let testRoleId: string;

  beforeEach(async () => {
    // Create test role
    const role = await prisma.role.create({
      data: {
        name: 'participant',
        description: 'Participant role'
      }
    });
    testRoleId = role.id;

    // Create test user
    const user = await prisma.user.create({
      data: {
        username: 'testparticipant',
        password: 'hashedpassword',
        roleId: testRoleId
      }
    });
    testUserId = user.id;

    // Create test contest
    const contest = await prisma.contest.create({
      data: {
        name: 'Test Contest',
        description: 'Test contest for attendance',
        status: ContestStatus.RUNNING
      }
    });
    testContestId = contest.id;

    // Register user for contest
    await prisma.contestUser.create({
      data: {
        contestId: testContestId,
        userId: testUserId,
        status: ParticipantStatus.ACTIVE
      }
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.attendance.deleteMany();
    await prisma.contestUser.deleteMany();
    await prisma.contest.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
  });

  describe('checkIn', () => {
    it('should check in a user successfully', async () => {
      const result = await attendanceService.checkIn({
        contestId: testContestId,
        userId: testUserId
      });

      expect(result).toBeDefined();
      expect(result.contestId).toBe(testContestId);
      expect(result.userId).toBe(testUserId);
      expect(result.status).toBe(AttendanceStatus.PRESENT);
      expect(result.checkinTime).toBeDefined();
      expect(result.checkoutTime).toBeNull();
    });

    it('should update existing attendance record on re-checkin', async () => {
      // First check-in
      const firstCheckin = await attendanceService.checkIn({
        contestId: testContestId,
        userId: testUserId
      });

      // Second check-in (should update existing record)
      const secondCheckin = await attendanceService.checkIn({
        contestId: testContestId,
        userId: testUserId
      });

      expect(secondCheckin.id).toBe(firstCheckin.id);
      expect(secondCheckin.checkinTime.getTime()).toBeGreaterThan(firstCheckin.checkinTime.getTime());
      expect(secondCheckin.checkoutTime).toBeNull();
    });

    it('should throw error for non-existent contest', async () => {
      await expect(attendanceService.checkIn({
        contestId: 'non-existent-contest-id',
        userId: testUserId
      })).rejects.toThrow('Contest with id non-existent-contest-id not found');
    });

    it('should throw error for non-existent user', async () => {
      await expect(attendanceService.checkIn({
        contestId: testContestId,
        userId: 'non-existent-user-id'
      })).rejects.toThrow('User with id non-existent-user-id not found');
    });

    it('should throw error for unregistered user', async () => {
      // Create another user not registered for the contest
      const unregisteredUser = await prisma.user.create({
        data: {
          username: 'unregistered',
          password: 'hashedpassword',
          roleId: testRoleId
        }
      });

      await expect(attendanceService.checkIn({
        contestId: testContestId,
        userId: unregisteredUser.id
      })).rejects.toThrow('User is not registered for this contest');

      // Clean up
      await prisma.user.delete({ where: { id: unregisteredUser.id } });
    });
  });

  describe('checkOut', () => {
    beforeEach(async () => {
      // Check in user first
      await attendanceService.checkIn({
        contestId: testContestId,
        userId: testUserId
      });
    });

    it('should check out a user successfully', async () => {
      const result = await attendanceService.checkOut({
        contestId: testContestId,
        userId: testUserId
      });

      expect(result).toBeDefined();
      expect(result.contestId).toBe(testContestId);
      expect(result.userId).toBe(testUserId);
      expect(result.checkoutTime).toBeDefined();
    });

    it('should throw error when no check-in record exists', async () => {
      // Create another user
      const anotherUser = await prisma.user.create({
        data: {
          username: 'anotheruser',
          password: 'hashedpassword',
          roleId: testRoleId
        }
      });

      await expect(attendanceService.checkOut({
        contestId: testContestId,
        userId: anotherUser.id
      })).rejects.toThrow('No check-in record found for this user and contest');

      // Clean up
      await prisma.user.delete({ where: { id: anotherUser.id } });
    });

    it('should throw error when user already checked out', async () => {
      // First checkout
      await attendanceService.checkOut({
        contestId: testContestId,
        userId: testUserId
      });

      // Second checkout should fail
      await expect(attendanceService.checkOut({
        contestId: testContestId,
        userId: testUserId
      })).rejects.toThrow('User has already checked out');
    });
  });

  describe('updateAttendanceStatus', () => {
    it('should update attendance status for existing record', async () => {
      // Check in first
      await attendanceService.checkIn({
        contestId: testContestId,
        userId: testUserId
      });

      // Update to absent
      const result = await attendanceService.updateAttendanceStatus(
        testContestId,
        testUserId,
        AttendanceStatus.ABSENT
      );

      expect(result.status).toBe(AttendanceStatus.ABSENT);
    });

    it('should create new attendance record if none exists', async () => {
      const result = await attendanceService.updateAttendanceStatus(
        testContestId,
        testUserId,
        AttendanceStatus.ABSENT
      );

      expect(result).toBeDefined();
      expect(result.status).toBe(AttendanceStatus.ABSENT);
      // checkinTime has a default value in schema, so it will be set
    });

    it('should set checkin time when marking as present', async () => {
      const result = await attendanceService.updateAttendanceStatus(
        testContestId,
        testUserId,
        AttendanceStatus.PRESENT
      );

      expect(result.status).toBe(AttendanceStatus.PRESENT);
      expect(result.checkinTime).toBeDefined();
    });
  });

  describe('getAttendanceRecords', () => {
    beforeEach(async () => {
      // Create some test attendance records
      await attendanceService.checkIn({
        contestId: testContestId,
        userId: testUserId
      });

      // Create another user and attendance
      const anotherUser = await prisma.user.create({
        data: {
          username: 'anotheruser',
          password: 'hashedpassword',
          roleId: testRoleId
        }
      });

      await prisma.contestUser.create({
        data: {
          contestId: testContestId,
          userId: anotherUser.id,
          status: ParticipantStatus.ACTIVE
        }
      });

      await attendanceService.updateAttendanceStatus(
        testContestId,
        anotherUser.id,
        AttendanceStatus.ABSENT
      );
    });

    it('should get all attendance records', async () => {
      const records = await attendanceService.getAttendanceRecords();

      expect(records).toHaveLength(2);
      expect(records[0].user).toBeDefined();
      expect(records[0].contest).toBeDefined();
    });

    it('should filter by contest ID', async () => {
      const records = await attendanceService.getAttendanceRecords({
        contestId: testContestId
      });

      expect(records).toHaveLength(2);
      expect(records.every(r => r.contestId === testContestId)).toBe(true);
    });

    it('should filter by user ID', async () => {
      const records = await attendanceService.getAttendanceRecords({
        userId: testUserId
      });

      expect(records).toHaveLength(1);
      expect(records[0].userId).toBe(testUserId);
    });

    it('should filter by status', async () => {
      const presentRecords = await attendanceService.getAttendanceRecords({
        status: AttendanceStatus.PRESENT
      });

      const absentRecords = await attendanceService.getAttendanceRecords({
        status: AttendanceStatus.ABSENT
      });

      expect(presentRecords).toHaveLength(1);
      expect(absentRecords).toHaveLength(1);
    });
  });

  describe('generateAttendanceReport', () => {
    beforeEach(async () => {
      // Create multiple users and attendance records
      const users = [];
      for (let i = 0; i < 3; i++) {
        const user = await prisma.user.create({
          data: {
            username: `user${i}`,
            password: 'hashedpassword',
            roleId: testRoleId
          }
        });
        users.push(user);

        await prisma.contestUser.create({
          data: {
            contestId: testContestId,
            userId: user.id,
            status: ParticipantStatus.ACTIVE
          }
        });
      }

      // Check in first two users
      await attendanceService.checkIn({
        contestId: testContestId,
        userId: users[0].id
      });

      await attendanceService.checkIn({
        contestId: testContestId,
        userId: users[1].id
      });

      // Third user remains absent
    });

    it('should generate attendance report', async () => {
      const report = await attendanceService.generateAttendanceReport(testContestId);

      expect(report).toBeDefined();
      expect(report.contestId).toBe(testContestId);
      expect(report.contestName).toBe('Test Contest');
      expect(report.totalParticipants).toBe(4); // 3 new users + 1 original test user
      expect(report.presentCount).toBe(2);
      expect(report.absentCount).toBe(2);
      expect(report.attendanceRate).toBe(50);
      expect(report.participants).toHaveLength(4);
    });

    it('should throw error for non-existent contest', async () => {
      await expect(attendanceService.generateAttendanceReport('non-existent-contest-id'))
        .rejects.toThrow('Contest with id non-existent-contest-id not found');
    });
  });

  describe('getAttendanceStatistics', () => {
    beforeEach(async () => {
      // Create attendance records with check-in and check-out
      await attendanceService.checkIn({
        contestId: testContestId,
        userId: testUserId
      });

      // Simulate checkout after some time
      const checkoutTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour later
      await attendanceService.checkOut({
        contestId: testContestId,
        userId: testUserId,
        checkoutTime
      });
    });

    it('should return attendance statistics', async () => {
      const stats = await attendanceService.getAttendanceStatistics();

      expect(stats).toBeDefined();
      expect(stats.totalSessions).toBe(1);
      expect(stats.averageSessionDuration).toBeGreaterThan(0);
      expect(stats.mostActiveUsers).toBeDefined();
      expect(stats.attendanceByContest).toBeDefined();
      expect(stats.attendanceByContest).toHaveLength(1);
    });
  });

  describe('trackUserActivity', () => {
    it('should auto check-in user for active contest', async () => {
      await attendanceService.trackUserActivity(testUserId, testContestId);

      const attendance = await prisma.attendance.findUnique({
        where: {
          contestId_userId: {
            contestId: testContestId,
            userId: testUserId
          }
        }
      });

      expect(attendance).toBeDefined();
      expect(attendance!.status).toBe(AttendanceStatus.PRESENT);
    });

    it('should update user last active time', async () => {
      const userBefore = await prisma.user.findUnique({
        where: { id: testUserId }
      });

      await attendanceService.trackUserActivity(testUserId, testContestId);

      const userAfter = await prisma.user.findUnique({
        where: { id: testUserId }
      });

      expect(userAfter!.lastActive!.getTime()).toBeGreaterThan(
        userBefore!.lastActive?.getTime() || 0
      );
    });
  });

  describe('markAbsentUsers', () => {
    beforeEach(async () => {
      // Create additional users registered for contest but not checked in
      for (let i = 0; i < 2; i++) {
        const user = await prisma.user.create({
          data: {
            username: `absentuser${i}`,
            password: 'hashedpassword',
            roleId: testRoleId
          }
        });

        await prisma.contestUser.create({
          data: {
            contestId: testContestId,
            userId: user.id,
            status: ParticipantStatus.ACTIVE
          }
        });
      }

      // Check in the original test user
      await attendanceService.checkIn({
        contestId: testContestId,
        userId: testUserId
      });
    });

    it('should mark absent users', async () => {
      const markedCount = await attendanceService.markAbsentUsers(testContestId);

      expect(markedCount).toBe(2); // 2 users without attendance records

      const absentRecords = await prisma.attendance.findMany({
        where: {
          contestId: testContestId,
          status: AttendanceStatus.ABSENT
        }
      });

      expect(absentRecords).toHaveLength(2);
    });

    it('should not mark users who already have attendance records', async () => {
      // First call should mark 2 users as absent
      const firstCall = await attendanceService.markAbsentUsers(testContestId);
      expect(firstCall).toBe(2);

      // Second call should mark 0 users (all already have records)
      const secondCall = await attendanceService.markAbsentUsers(testContestId);
      expect(secondCall).toBe(0);
    });
  });
});