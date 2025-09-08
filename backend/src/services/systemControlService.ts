import { PrismaClient, SystemControl, Contest, ContestStatus } from '@prisma/client';

export interface SystemControlRequest {
  contestId: string;
  controlCode: number;
  value: any;
  setById: string;
}

export interface ContestPhaseUpdate {
  contestId: string;
  phase: string;
  startTime?: Date;
  endTime?: Date;
  setById: string;
}

export interface EmergencyAction {
  contestId: string;
  action: 'shutdown' | 'reset' | 'pause' | 'resume';
  reason?: string;
  setById: string;
}

// System Control Codes
export const CONTROL_CODES = {
  CONTEST_PHASE: 100,
  TIMER_CONTROL: 110,
  PHASE_CONTROL: 120,
  DISPLAY_CONTROL: 130,
  EMERGENCY_ACTION: 140,
  PROBLEM_CONTROL: 150,
  USER_CONTROL: 160
} as const;

// Contest Phases
export const CONTEST_PHASES = {
  SETUP: 'Setup',
  READING: 'Reading',
  RUNNING: 'Running',
  LOCKED: 'Locked',
  RESULTS: 'Results'
} as const;

export class SystemControlService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient();
  }

  /**
   * Create a new system control entry
   */
  async createSystemControl(data: SystemControlRequest): Promise<SystemControl> {
    // Validate contest exists
    const contest = await this.prisma.contest.findUnique({
      where: { id: data.contestId }
    });

    if (!contest) {
      throw new Error(`Contest with id ${data.contestId} not found`);
    }

    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: data.setById }
    });

    if (!user) {
      throw new Error(`User with id ${data.setById} not found`);
    }

    return await this.prisma.systemControl.create({
      data: {
        contestId: data.contestId,
        controlCode: data.controlCode,
        value: data.value,
        setById: data.setById
      }
    });
  }

  /**
   * Update contest phase and related timing
   */
  async updateContestPhase(data: ContestPhaseUpdate): Promise<{ contest: Contest; systemControl: SystemControl }> {
    // Validate contest exists
    const contest = await this.prisma.contest.findUnique({
      where: { id: data.contestId }
    });

    if (!contest) {
      throw new Error(`Contest with id ${data.contestId} not found`);
    }

    // Validate phase transition
    this.validatePhaseTransition(contest, data.phase);

    // Update contest timing if provided
    const contestUpdates: any = {};
    if (data.startTime) {
      contestUpdates.startTime = data.startTime;
    }
    if (data.endTime) {
      contestUpdates.endTime = data.endTime;
    }

    // Update contest status based on phase
    if (data.phase === CONTEST_PHASES.RUNNING) {
      contestUpdates.status = ContestStatus.RUNNING;
    } else if (data.phase === CONTEST_PHASES.RESULTS) {
      contestUpdates.status = ContestStatus.ENDED;
    }

    // Use transaction to ensure consistency
    const result = await this.prisma.$transaction(async (tx) => {
      // Update contest if needed
      let updatedContest = contest;
      if (Object.keys(contestUpdates).length > 0) {
        updatedContest = await tx.contest.update({
          where: { id: data.contestId },
          data: contestUpdates
        });
      }

      // Create system control record
      const systemControl = await tx.systemControl.create({
        data: {
          contestId: data.contestId,
          controlCode: CONTROL_CODES.CONTEST_PHASE,
          value: {
            phase: data.phase,
            startTime: data.startTime,
            endTime: data.endTime,
            previousPhase: contest.status
          },
          setById: data.setById
        }
      });

      return { contest: updatedContest, systemControl };
    });

    return result;
  }

  /**
   * Perform emergency action on contest
   */
  async performEmergencyAction(data: EmergencyAction): Promise<SystemControl> {
    // Validate contest exists
    const contest = await this.prisma.contest.findUnique({
      where: { id: data.contestId }
    });

    if (!contest) {
      throw new Error(`Contest with id ${data.contestId} not found`);
    }

    // Validate emergency action
    this.validateEmergencyAction(contest, data.action);

    const actionValue = {
      action: data.action,
      reason: data.reason,
      timestamp: new Date(),
      previousStatus: contest.status
    };

    // Use transaction for emergency actions that affect contest state
    return await this.prisma.$transaction(async (tx) => {
      // Update contest status based on emergency action
      if (data.action === 'shutdown' || data.action === 'pause') {
        await tx.contest.update({
          where: { id: data.contestId },
          data: { status: ContestStatus.ENDED }
        });
      } else if (data.action === 'resume' && contest.status === ContestStatus.ENDED) {
        await tx.contest.update({
          where: { id: data.contestId },
          data: { status: ContestStatus.RUNNING }
        });
      }

      // Create system control record
      return await tx.systemControl.create({
        data: {
          contestId: data.contestId,
          controlCode: CONTROL_CODES.EMERGENCY_ACTION,
          value: actionValue,
          setById: data.setById
        }
      });
    });
  }

  /**
   * Get system controls for a contest
   */
  async getSystemControls(contestId: string, controlCode?: number): Promise<SystemControl[]> {
    const where: any = { contestId };
    
    if (controlCode) {
      where.controlCode = controlCode;
    }

    return await this.prisma.systemControl.findMany({
      where,
      include: {
        setBy: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      },
      orderBy: {
        setAt: 'desc'
      }
    });
  }

  /**
   * Get current contest phase from system controls
   */
  async getCurrentContestPhase(contestId: string): Promise<string | null> {
    const latestPhaseControl = await this.prisma.systemControl.findFirst({
      where: {
        contestId,
        controlCode: CONTROL_CODES.CONTEST_PHASE
      },
      orderBy: {
        setAt: 'desc'
      }
    });

    if (latestPhaseControl && latestPhaseControl.value) {
      const value = latestPhaseControl.value as any;
      return value.phase || null;
    }

    return null;
  }

  /**
   * Get contest state information (migrated from ContestState)
   */
  async getContestState(contestId: string): Promise<{
    phase: string;
    startTime: Date | null;
    endTime: Date | null;
    lastUpdated: Date | null;
  } | null> {
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId }
    });

    if (!contest) {
      return null;
    }

    const currentPhase = await this.getCurrentContestPhase(contestId);
    const latestControl = await this.prisma.systemControl.findFirst({
      where: { contestId },
      orderBy: { setAt: 'desc' }
    });

    return {
      phase: currentPhase || this.getPhaseFromStatus(contest.status),
      startTime: contest.startTime,
      endTime: contest.endTime,
      lastUpdated: latestControl?.setAt || contest.startTime
    };
  }

  /**
   * Migrate legacy ContestState to new system
   */
  async migrateLegacyContestState(): Promise<void> {
    // Get legacy contest state
    const legacyState = await this.prisma.contestState.findFirst();
    
    if (!legacyState) {
      return; // No legacy state to migrate
    }

    // Find or create a default contest for migration
    let contest = await this.prisma.contest.findFirst({
      where: { status: ContestStatus.RUNNING }
    });

    if (!contest) {
      // Create a default contest for migration
      contest = await this.prisma.contest.create({
        data: {
          name: 'Migrated Contest',
          description: 'Contest migrated from legacy ContestState',
          startTime: legacyState.startTime,
          endTime: legacyState.endTime,
          status: this.getStatusFromPhase(legacyState.phase)
        }
      });
    }

    // Find admin user for migration
    const adminUser = await this.prisma.user.findFirst({
      where: {
        role: {
          name: 'admin'
        }
      }
    });

    if (!adminUser) {
      throw new Error('No admin user found for migration');
    }

    // Create system control record for the migrated state
    await this.prisma.systemControl.create({
      data: {
        contestId: contest.id,
        controlCode: CONTROL_CODES.CONTEST_PHASE,
        value: {
          phase: legacyState.phase,
          startTime: legacyState.startTime,
          endTime: legacyState.endTime,
          migrated: true
        },
        setById: adminUser.id,
        setAt: legacyState.lastUpdated
      }
    });

    console.log(`Migrated legacy ContestState to Contest ${contest.id}`);
  }

  /**
   * Validate phase transition
   */
  private validatePhaseTransition(contest: Contest, newPhase: string): void {
    const currentPhase = this.getPhaseFromStatus(contest.status);
    
    const validTransitions: Record<string, string[]> = {
      [CONTEST_PHASES.SETUP]: [CONTEST_PHASES.READING, CONTEST_PHASES.RUNNING],
      [CONTEST_PHASES.READING]: [CONTEST_PHASES.RUNNING, CONTEST_PHASES.SETUP],
      [CONTEST_PHASES.RUNNING]: [CONTEST_PHASES.LOCKED, CONTEST_PHASES.RESULTS],
      [CONTEST_PHASES.LOCKED]: [CONTEST_PHASES.RUNNING, CONTEST_PHASES.RESULTS],
      [CONTEST_PHASES.RESULTS]: [] // No transitions from results
    };

    if (!validTransitions[currentPhase]?.includes(newPhase)) {
      throw new Error(`Invalid phase transition from ${currentPhase} to ${newPhase}`);
    }
  }

  /**
   * Validate emergency action
   */
  private validateEmergencyAction(contest: Contest, action: string): void {
    const validActions = ['shutdown', 'reset', 'pause', 'resume'];
    
    if (!validActions.includes(action)) {
      throw new Error(`Invalid emergency action: ${action}`);
    }

    // Additional validation based on current contest status
    if (action === 'resume' && contest.status !== ContestStatus.ENDED) {
      throw new Error('Can only resume ended contests');
    }

    if ((action === 'shutdown' || action === 'pause') && contest.status === ContestStatus.ENDED) {
      throw new Error('Cannot shutdown or pause already ended contest');
    }
  }

  /**
   * Get phase from contest status
   */
  private getPhaseFromStatus(status: ContestStatus): string {
    switch (status) {
      case ContestStatus.PLANNED:
        return CONTEST_PHASES.SETUP;
      case ContestStatus.RUNNING:
        return CONTEST_PHASES.RUNNING;
      case ContestStatus.ENDED:
        return CONTEST_PHASES.RESULTS;
      case ContestStatus.ARCHIVED:
        return CONTEST_PHASES.RESULTS;
      default:
        return CONTEST_PHASES.SETUP;
    }
  }

  /**
   * Get contest status from phase
   */
  private getStatusFromPhase(phase: string): ContestStatus {
    switch (phase) {
      case CONTEST_PHASES.SETUP:
      case CONTEST_PHASES.READING:
        return ContestStatus.PLANNED;
      case CONTEST_PHASES.RUNNING:
      case CONTEST_PHASES.LOCKED:
        return ContestStatus.RUNNING;
      case CONTEST_PHASES.RESULTS:
        return ContestStatus.ENDED;
      default:
        return ContestStatus.PLANNED;
    }
  }
}

export const systemControlService = new SystemControlService();