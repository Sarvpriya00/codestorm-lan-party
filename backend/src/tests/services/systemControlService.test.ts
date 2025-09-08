import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient, ContestStatus } from '@prisma/client';
import { SystemControlService, CONTROL_CODES, CONTEST_PHASES } from '../../services/systemControlService';

const prisma = new PrismaClient();
const systemControlService = new SystemControlService(prisma);

describe('SystemControlService', () => {
  let testUserId: string;
  let testContestId: string;
  let testRoleId: string;

  beforeEach(async () => {
    // Create test role
    const role = await prisma.role.create({
      data: {
        name: 'admin',
        description: 'Administrator role'
      }
    });
    testRoleId = role.id;

    // Create test user
    const user = await prisma.user.create({
      data: {
        username: 'testadmin',
        password: 'hashedpassword',
        roleId: testRoleId
      }
    });
    testUserId = user.id;

    // Create test contest
    const contest = await prisma.contest.create({
      data: {
        name: 'Test Contest',
        description: 'Test contest for system control',
        status: ContestStatus.PLANNED
      }
    });
    testContestId = contest.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.systemControl.deleteMany();
    await prisma.contest.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
  });

  describe('createSystemControl', () => {
    it('should create a system control entry', async () => {
      const controlData = {
        contestId: testContestId,
        controlCode: CONTROL_CODES.CONTEST_PHASE,
        value: { phase: CONTEST_PHASES.SETUP },
        setById: testUserId
      };

      const result = await systemControlService.createSystemControl(controlData);

      expect(result).toBeDefined();
      expect(result.contestId).toBe(testContestId);
      expect(result.controlCode).toBe(CONTROL_CODES.CONTEST_PHASE);
      expect(result.setById).toBe(testUserId);
    });

    it('should throw error for non-existent contest', async () => {
      const controlData = {
        contestId: 'non-existent-id',
        controlCode: CONTROL_CODES.CONTEST_PHASE,
        value: { phase: CONTEST_PHASES.SETUP },
        setById: testUserId
      };

      await expect(systemControlService.createSystemControl(controlData))
        .rejects.toThrow('Contest with id non-existent-id not found');
    });

    it('should throw error for non-existent user', async () => {
      const controlData = {
        contestId: testContestId,
        controlCode: CONTROL_CODES.CONTEST_PHASE,
        value: { phase: CONTEST_PHASES.SETUP },
        setById: 'non-existent-user-id'
      };

      await expect(systemControlService.createSystemControl(controlData))
        .rejects.toThrow('User with id non-existent-user-id not found');
    });
  });

  describe('updateContestPhase', () => {
    it('should update contest phase from PLANNED to RUNNING', async () => {
      const phaseData = {
        contestId: testContestId,
        phase: CONTEST_PHASES.RUNNING,
        setById: testUserId
      };

      const result = await systemControlService.updateContestPhase(phaseData);

      expect(result.contest.status).toBe(ContestStatus.RUNNING);
      expect(result.systemControl.controlCode).toBe(CONTROL_CODES.CONTEST_PHASE);
      
      const controlValue = result.systemControl.value as any;
      expect(controlValue.phase).toBe(CONTEST_PHASES.RUNNING);
    });

    it('should update contest phase with timing', async () => {
      const startTime = new Date();
      const endTime = new Date(Date.now() + 3600000); // 1 hour later

      const phaseData = {
        contestId: testContestId,
        phase: CONTEST_PHASES.RUNNING,
        startTime,
        endTime,
        setById: testUserId
      };

      const result = await systemControlService.updateContestPhase(phaseData);

      expect(result.contest.startTime).toEqual(startTime);
      expect(result.contest.endTime).toEqual(endTime);
      expect(result.contest.status).toBe(ContestStatus.RUNNING);
    });

    it('should throw error for invalid phase transition', async () => {
      // First set contest to ENDED
      await prisma.contest.update({
        where: { id: testContestId },
        data: { status: ContestStatus.ENDED }
      });

      const phaseData = {
        contestId: testContestId,
        phase: CONTEST_PHASES.SETUP,
        setById: testUserId
      };

      await expect(systemControlService.updateContestPhase(phaseData))
        .rejects.toThrow('Invalid phase transition');
    });
  });

  describe('performEmergencyAction', () => {
    beforeEach(async () => {
      // Set contest to RUNNING for emergency action tests
      await prisma.contest.update({
        where: { id: testContestId },
        data: { status: ContestStatus.RUNNING }
      });
    });

    it('should perform shutdown emergency action', async () => {
      const actionData = {
        contestId: testContestId,
        action: 'shutdown' as const,
        reason: 'System maintenance',
        setById: testUserId
      };

      const result = await systemControlService.performEmergencyAction(actionData);

      expect(result.controlCode).toBe(CONTROL_CODES.EMERGENCY_ACTION);
      
      const actionValue = result.value as any;
      expect(actionValue.action).toBe('shutdown');
      expect(actionValue.reason).toBe('System maintenance');

      // Check that contest status was updated
      const updatedContest = await prisma.contest.findUnique({
        where: { id: testContestId }
      });
      expect(updatedContest?.status).toBe(ContestStatus.ENDED);
    });

    it('should perform pause emergency action', async () => {
      const actionData = {
        contestId: testContestId,
        action: 'pause' as const,
        setById: testUserId
      };

      const result = await systemControlService.performEmergencyAction(actionData);

      expect(result.controlCode).toBe(CONTROL_CODES.EMERGENCY_ACTION);
      
      const actionValue = result.value as any;
      expect(actionValue.action).toBe('pause');
    });

    it('should throw error for invalid emergency action', async () => {
      const actionData = {
        contestId: testContestId,
        action: 'invalid-action' as any,
        setById: testUserId
      };

      await expect(systemControlService.performEmergencyAction(actionData))
        .rejects.toThrow('Invalid emergency action: invalid-action');
    });

    it('should throw error when trying to resume non-ended contest', async () => {
      const actionData = {
        contestId: testContestId,
        action: 'resume' as const,
        setById: testUserId
      };

      await expect(systemControlService.performEmergencyAction(actionData))
        .rejects.toThrow('Can only resume ended contests');
    });
  });

  describe('getSystemControls', () => {
    beforeEach(async () => {
      // Create some test system controls
      await systemControlService.createSystemControl({
        contestId: testContestId,
        controlCode: CONTROL_CODES.CONTEST_PHASE,
        value: { phase: CONTEST_PHASES.SETUP },
        setById: testUserId
      });

      await systemControlService.createSystemControl({
        contestId: testContestId,
        controlCode: CONTROL_CODES.TIMER_CONTROL,
        value: { action: 'start' },
        setById: testUserId
      });
    });

    it('should get all system controls for a contest', async () => {
      const controls = await systemControlService.getSystemControls(testContestId);

      expect(controls).toHaveLength(2);
      expect(controls[0].contestId).toBe(testContestId);
      expect(controls[0].setBy).toBeDefined();
      expect(controls[0].setBy.username).toBe('testadmin');
    });

    it('should filter system controls by control code', async () => {
      const controls = await systemControlService.getSystemControls(
        testContestId, 
        CONTROL_CODES.CONTEST_PHASE
      );

      expect(controls).toHaveLength(1);
      expect(controls[0].controlCode).toBe(CONTROL_CODES.CONTEST_PHASE);
    });
  });

  describe('getCurrentContestPhase', () => {
    it('should return current contest phase', async () => {
      await systemControlService.createSystemControl({
        contestId: testContestId,
        controlCode: CONTROL_CODES.CONTEST_PHASE,
        value: { phase: CONTEST_PHASES.RUNNING },
        setById: testUserId
      });

      const phase = await systemControlService.getCurrentContestPhase(testContestId);

      expect(phase).toBe(CONTEST_PHASES.RUNNING);
    });

    it('should return null when no phase control exists', async () => {
      const phase = await systemControlService.getCurrentContestPhase(testContestId);

      expect(phase).toBeNull();
    });
  });

  describe('getContestState', () => {
    it('should return contest state information', async () => {
      const startTime = new Date();
      const endTime = new Date(Date.now() + 3600000);

      // Update contest with timing
      await prisma.contest.update({
        where: { id: testContestId },
        data: { 
          startTime, 
          endTime,
          status: ContestStatus.RUNNING
        }
      });

      // Create phase control
      await systemControlService.createSystemControl({
        contestId: testContestId,
        controlCode: CONTROL_CODES.CONTEST_PHASE,
        value: { phase: CONTEST_PHASES.RUNNING },
        setById: testUserId
      });

      const state = await systemControlService.getContestState(testContestId);

      expect(state).toBeDefined();
      expect(state!.phase).toBe(CONTEST_PHASES.RUNNING);
      expect(state!.startTime).toEqual(startTime);
      expect(state!.endTime).toEqual(endTime);
      expect(state!.lastUpdated).toBeDefined();
    });

    it('should return null for non-existent contest', async () => {
      const state = await systemControlService.getContestState('non-existent-id');

      expect(state).toBeNull();
    });

    it('should derive phase from contest status when no phase control exists', async () => {
      await prisma.contest.update({
        where: { id: testContestId },
        data: { status: ContestStatus.RUNNING }
      });

      const state = await systemControlService.getContestState(testContestId);

      expect(state).toBeDefined();
      expect(state!.phase).toBe(CONTEST_PHASES.RUNNING);
    });
  });
});