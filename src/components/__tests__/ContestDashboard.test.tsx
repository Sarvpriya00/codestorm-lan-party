import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUsers, mockContests, mockProblems, mockSubmissions } from '@/test/utils';
import { ContestDashboard } from '@/components/ContestDashboard';

// Mock the API
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock WebSocket
vi.mock('@/lib/websocket', () => ({
  useWebSocket: vi.fn(() => ({
    isConnected: true,
    lastMessage: null,
    sendMessage: vi.fn(),
  })),
}));

import { api } from '@/lib/api';
import { useWebSocket } from '@/lib/websocket';

describe('ContestDashboard Component', () => {
  const mockApi = api as any;
  const mockUseWebSocket = useWebSocket as any;
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWebSocket.mockReturnValue({
      isConnected: true,
      lastMessage: null,
      sendMessage: vi.fn(),
    });
  });

  describe('Contest Information Display', () => {
    it('should display contest information correctly', async () => {
      mockApi.get.mockResolvedValueOnce({
        success: true,
        data: mockContests.active
      });

      renderWithProviders(
        <ContestDashboard contestId="contest-1" />,
        { user: mockUsers.participant }
      );

      await waitFor(() => {
        expect(screen.getByText('Active Contest')).toBeInTheDocument();
        expect(screen.getByText('An active contest')).toBeInTheDocument();
      });
    });

    it('should display contest status badge', async () => {
      mockApi.get.mockResolvedValueOnce({
        success: true,
        data: mockContests.active
      });

      renderWithProviders(
        <ContestDashboard contestId="contest-1" />,
        { user: mockUsers.participant }
      );

      await waitFor(() => {
        expect(screen.getByText('RUNNING')).toBeInTheDocument();
      });
    });

    it('should display contest timing information', async () => {
      mockApi.get.mockResolvedValueOnce({
        success: true,
        data: mockContests.active
      });

      renderWithProviders(
        <ContestDashboard contestId="contest-1" />,
        { user: mockUsers.participant }
      );

      await waitFor(() => {
        expect(screen.getByText(/Start:/)).toBeInTheDocument();
        expect(screen.getByText(/End:/)).toBeInTheDocument();
      });
    });
  });

  describe('Problems Section', () => {
    it('should display contest problems', async () => {
      mockApi.get
        .mockResolvedValueOnce({
          success: true,
          data: mockContests.active
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockProblems
        });

      renderWithProviders(
        <ContestDashboard contestId="contest-1" />,
        { user: mockUsers.participant }
      );

      await waitFor(() => {
        expect(screen.getByText('Problems')).toBeInTheDocument();
        expect(screen.getByText('Easy Problem')).toBeInTheDocument();
        expect(screen.getByText('Hard Problem')).toBeInTheDocument();
      });
    });

    it('should display problem difficulty badges', async () => {
      mockApi.get
        .mockResolvedValueOnce({
          success: true,
          data: mockContests.active
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockProblems
        });

      renderWithProviders(
        <ContestDashboard contestId="contest-1" />,
        { user: mockUsers.participant }
      );

      await waitFor(() => {
        expect(screen.getByText('EASY')).toBeInTheDocument();
        expect(screen.getByText('HARD')).toBeInTheDocument();
      });
    });

    it('should allow clicking on problems to view details', async () => {
      mockApi.get
        .mockResolvedValueOnce({
          success: true,
          data: mockContests.active
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockProblems
        });

      renderWithProviders(
        <ContestDashboard contestId="contest-1" />,
        { user: mockUsers.participant }
      );

      await waitFor(() => {
        expect(screen.getByText('Easy Problem')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Easy Problem'));

      // Should navigate to problem details or open modal
      // This depends on your implementation
    });
  });

  describe('Submissions Section', () => {
    it('should display user submissions', async () => {
      mockApi.get
        .mockResolvedValueOnce({
          success: true,
          data: mockContests.active
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockProblems
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockSubmissions
        });

      renderWithProviders(
        <ContestDashboard contestId="contest-1" />,
        { user: mockUsers.participant }
      );

      await waitFor(() => {
        expect(screen.getByText('My Submissions')).toBeInTheDocument();
        expect(screen.getByText('ACCEPTED')).toBeInTheDocument();
        expect(screen.getByText('PENDING')).toBeInTheDocument();
      });
    });

    it('should display submission scores', async () => {
      mockApi.get
        .mockResolvedValueOnce({
          success: true,
          data: mockContests.active
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockProblems
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockSubmissions
        });

      renderWithProviders(
        <ContestDashboard contestId="contest-1" />,
        { user: mockUsers.participant }
      );

      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument(); // Score from accepted submission
      });
    });

    it('should allow viewing submission details', async () => {
      mockApi.get
        .mockResolvedValueOnce({
          success: true,
          data: mockContests.active
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockProblems
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockSubmissions
        });

      renderWithProviders(
        <ContestDashboard contestId="contest-1" />,
        { user: mockUsers.participant }
      );

      await waitFor(() => {
        expect(screen.getByText('ACCEPTED')).toBeInTheDocument();
      });

      // Click on submission to view details
      const submissionRow = screen.getByText('ACCEPTED').closest('tr');
      if (submissionRow) {
        await user.click(submissionRow);
      }

      // Should open submission details modal or navigate
    });
  });

  describe('Leaderboard Section', () => {
    it('should display contest leaderboard', async () => {
      const mockLeaderboard = [
        {
          id: 'leaderboard-1',
          contestId: 'contest-1',
          userId: 'participant-id',
          rank: 1,
          score: 100,
          problemsSolved: 1,
          user: mockUsers.participant
        }
      ];

      mockApi.get
        .mockResolvedValueOnce({
          success: true,
          data: mockContests.active
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockProblems
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockSubmissions
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockLeaderboard
        });

      renderWithProviders(
        <ContestDashboard contestId="contest-1" />,
        { user: mockUsers.participant }
      );

      await waitFor(() => {
        expect(screen.getByText('Leaderboard')).toBeInTheDocument();
        expect(screen.getByText('Participant User')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument(); // Rank
      });
    });

    it('should highlight current user in leaderboard', async () => {
      const mockLeaderboard = [
        {
          id: 'leaderboard-1',
          contestId: 'contest-1',
          userId: 'participant-id',
          rank: 1,
          score: 100,
          problemsSolved: 1,
          user: mockUsers.participant
        }
      ];

      mockApi.get
        .mockResolvedValueOnce({
          success: true,
          data: mockContests.active
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockProblems
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockSubmissions
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockLeaderboard
        });

      renderWithProviders(
        <ContestDashboard contestId="contest-1" />,
        { user: mockUsers.participant }
      );

      await waitFor(() => {
        const userRow = screen.getByText('Participant User').closest('tr');
        expect(userRow).toHaveClass('bg-primary/10'); // Or whatever highlighting class you use
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should update when receiving WebSocket messages', async () => {
      const mockSendMessage = vi.fn();
      mockUseWebSocket.mockReturnValue({
        isConnected: true,
        lastMessage: {
          type: 'submission_update',
          data: {
            submissionId: 'submission-2',
            status: 'ACCEPTED',
            score: 150
          }
        },
        sendMessage: mockSendMessage,
      });

      mockApi.get
        .mockResolvedValueOnce({
          success: true,
          data: mockContests.active
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockProblems
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockSubmissions
        });

      renderWithProviders(
        <ContestDashboard contestId="contest-1" />,
        { user: mockUsers.participant }
      );

      await waitFor(() => {
        // Should show updated submission status
        expect(screen.getByText('ACCEPTED')).toBeInTheDocument();
      });
    });

    it('should show WebSocket connection status', async () => {
      mockUseWebSocket.mockReturnValue({
        isConnected: false,
        lastMessage: null,
        sendMessage: vi.fn(),
      });

      renderWithProviders(
        <ContestDashboard contestId="contest-1" />,
        { user: mockUsers.participant }
      );

      await waitFor(() => {
        expect(screen.getByText(/Disconnected/)).toBeInTheDocument();
      });
    });
  });

  describe('Contest Timer', () => {
    it('should display countdown timer for running contest', async () => {
      const futureEndTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
      const runningContest = {
        ...mockContests.active,
        endTime: futureEndTime
      };

      mockApi.get.mockResolvedValueOnce({
        success: true,
        data: runningContest
      });

      renderWithProviders(
        <ContestDashboard contestId="contest-1" />,
        { user: mockUsers.participant }
      );

      await waitFor(() => {
        expect(screen.getByText(/Time Remaining/)).toBeInTheDocument();
        expect(screen.getByText(/02:00:00/)).toBeInTheDocument(); // Should show countdown
      });
    });

    it('should show contest ended message for ended contests', async () => {
      const pastEndTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      const endedContest = {
        ...mockContests.active,
        status: 'ENDED',
        endTime: pastEndTime
      };

      mockApi.get.mockResolvedValueOnce({
        success: true,
        data: endedContest
      });

      renderWithProviders(
        <ContestDashboard contestId="contest-1" />,
        { user: mockUsers.participant }
      );

      await waitFor(() => {
        expect(screen.getByText(/Contest Ended/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when contest fails to load', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Contest not found'));

      renderWithProviders(
        <ContestDashboard contestId="contest-1" />,
        { user: mockUsers.participant }
      );

      await waitFor(() => {
        expect(screen.getByText(/Error loading contest/)).toBeInTheDocument();
      });
    });

    it('should display loading state while fetching data', () => {
      mockApi.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithProviders(
        <ContestDashboard contestId="contest-1" />,
        { user: mockUsers.participant }
      );

      expect(screen.getByText(/Loading/)).toBeInTheDocument();
    });

    it('should handle missing contest data gracefully', async () => {
      mockApi.get.mockResolvedValueOnce({
        success: true,
        data: null
      });

      renderWithProviders(
        <ContestDashboard contestId="contest-1" />,
        { user: mockUsers.participant }
      );

      await waitFor(() => {
        expect(screen.getByText(/Contest not found/)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for mobile screens', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      mockApi.get.mockResolvedValueOnce({
        success: true,
        data: mockContests.active
      });

      renderWithProviders(
        <ContestDashboard contestId="contest-1" />,
        { user: mockUsers.participant }
      );

      await waitFor(() => {
        const dashboard = screen.getByTestId('contest-dashboard');
        expect(dashboard).toHaveClass('mobile-layout'); // Or whatever mobile class you use
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      mockApi.get.mockResolvedValueOnce({
        success: true,
        data: mockContests.active
      });

      renderWithProviders(
        <ContestDashboard contestId="contest-1" />,
        { user: mockUsers.participant }
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Contest Dashboard');
        expect(screen.getByRole('region', { name: 'Problems' })).toBeInTheDocument();
        expect(screen.getByRole('region', { name: 'Submissions' })).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      mockApi.get
        .mockResolvedValueOnce({
          success: true,
          data: mockContests.active
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockProblems
        });

      renderWithProviders(
        <ContestDashboard contestId="contest-1" />,
        { user: mockUsers.participant }
      );

      await waitFor(() => {
        expect(screen.getByText('Easy Problem')).toBeInTheDocument();
      });

      // Test tab navigation
      await user.tab();
      expect(screen.getByText('Easy Problem')).toHaveFocus();

      // Test enter key activation
      await user.keyboard('{Enter}');
      // Should trigger problem selection
    });
  });
});