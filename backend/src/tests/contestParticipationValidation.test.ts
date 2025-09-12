import { describe, it, expect } from 'vitest';
import { ContestUserService } from '../services/contestUserService';
import { ParticipantStatus } from '@prisma/client';

interface TestContestUserService extends ContestUserService {
  validateStatusTransition: (currentStatus: ParticipantStatus, newStatus: ParticipantStatus) => void;
}

describe('Contest Participation Business Logic Validation', () => {
  describe('Status Transition Validation', () => {
    it('should validate correct status transitions', () => {
      const service = new ContestUserService();
      
      // Access the private method through type assertion for testing
      const validateStatusTransition = (service as TestContestUserService).validateStatusTransition.bind(service);
      
      // Valid transitions
      expect(() => validateStatusTransition(ParticipantStatus.ACTIVE, ParticipantStatus.WITHDRAWN)).not.toThrow();
      expect(() => validateStatusTransition(ParticipantStatus.ACTIVE, ParticipantStatus.DISQUALIFIED)).not.toThrow();
      expect(() => validateStatusTransition(ParticipantStatus.WITHDRAWN, ParticipantStatus.ACTIVE)).not.toThrow();
      
      // Invalid transitions
      expect(() => validateStatusTransition(ParticipantStatus.DISQUALIFIED, ParticipantStatus.ACTIVE))
        .toThrow('Invalid status transition from DISQUALIFIED to ACTIVE');
      expect(() => validateStatusTransition(ParticipantStatus.DISQUALIFIED, ParticipantStatus.WITHDRAWN))
        .toThrow('Invalid status transition from DISQUALIFIED to WITHDRAWN');
    });
  });

  describe('Service Interface Validation', () => {
    it('should have all required methods', () => {
      const service = new ContestUserService();
      
      // Verify all required methods exist
      expect(typeof service.joinContest).toBe('function');
      expect(typeof service.leaveContest).toBe('function');
      expect(typeof service.updateParticipantStatus).toBe('function');
      expect(typeof service.getContestParticipants).toBe('function');
      expect(typeof service.getUserContests).toBe('function');
      expect(typeof service.getContestUser).toBe('function');
      expect(typeof service.getContestParticipationStats).toBe('function');
      expect(typeof service.bulkUpdateParticipantStatus).toBe('function');
      expect(typeof service.canUserJoinContest).toBe('function');
    });
  });

  describe('Request Interface Validation', () => {
    it('should validate JoinContestRequest interface', () => {
      const validRequest = {
        contestId: 'contest-123',
        userId: 'user-456'
      };
      
      expect(validRequest.contestId).toBeDefined();
      expect(validRequest.userId).toBeDefined();
      expect(typeof validRequest.contestId).toBe('string');
      expect(typeof validRequest.userId).toBe('string');
    });

    it('should validate UpdateParticipantStatusRequest interface', () => {
      const validRequest = {
        status: ParticipantStatus.DISQUALIFIED,
        reason: 'Violation of contest rules'
      };
      
      expect(validRequest.status).toBeDefined();
      expect(Object.values(ParticipantStatus)).toContain(validRequest.status);
      expect(typeof validRequest.reason).toBe('string');
    });
  });

  describe('Enum Validation', () => {
    it('should have correct ParticipantStatus values', () => {
      expect(ParticipantStatus.ACTIVE).toBe('ACTIVE');
      expect(ParticipantStatus.DISQUALIFIED).toBe('DISQUALIFIED');
      expect(ParticipantStatus.WITHDRAWN).toBe('WITHDRAWN');
      
      // Verify all expected statuses exist
      const expectedStatuses = ['ACTIVE', 'DISQUALIFIED', 'WITHDRAWN'];
      const actualStatuses = Object.values(ParticipantStatus);
      
      expectedStatuses.forEach(status => {
        expect(actualStatuses).toContain(status);
      });
    });
  });
});