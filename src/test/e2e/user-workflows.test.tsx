import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUsers, mockContests, mockProblems, mockApiResponses } from '@/test/utils';
import App from '@/App';

// Mock the API
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
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

describe('E2E User Workflows', () => {
  const mockApi = api as any;
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Admin Workflow', () => {
    it('should complete full admin workflow: login -> manage users -> create contest -> monitor analytics', async () => {
      // Mock login response
      mockApi.post.mockResolvedValueOnce({
        success: true,
        data: {
          token: 'admin-token',
          user: mockUsers.admin
        }
      });

      // Mock user management data
      mockApi.get.mockResolvedValueOnce({
        success: true,
        data: [mockUsers.admin, mockUsers.judge, mockUsers.participant]
      });

      renderWithProviders(<App />);

      // Step 1: Login as admin
      expect(screen.getByText(/Login/)).toBeInTheDocument();
      
      await user.type(screen.getByLabelText(/Username/), 'admin');
      await user.type(screen.getByLabelText(/Password/), 'password');
      await user.click(screen.getByRole('button', { name: /Login/ }));

      await waitFor(() => {
        expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
      });

      // Step 2: Navigate to user management
      await user.click(screen.getByText(/Users/));

      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeInTheDocument();
        expect(screen.getByText('Judge User')).toBeInTheDocument();
        expect(screen.getByText('Participant User')).toBeInTheDocument();
      });

      // Step 3: Create new contest
      mockApi.post.mockResolvedValueOnce({
        success: true,
        data: {
          id: 'new-contest-id',
          name: 'New Contest',
          status: 'PLANNED'
        }
      });

      await user.click(screen.getByText(/Contests/));
      await user.click(screen.getByText(/Create Contest/));

      await user.type(screen.getByLabelText(/Contest Name/), 'New Contest');
      await user.type(screen.getByLabelText(/Description/), 'A new contest for testing');
      await user.click(screen.getByRole('button', { name: /Create/ }));

      await waitFor(() => {
        expect(screen.getByText('Contest created successfully')).toBeInTheDocument();
      });

      // Step 4: View analytics
      mockApi.get.mockResolvedValueOnce({
        success: true,
        data: {
          totalUsers: 3,
          activeContests: 1,
          totalSubmissions: 10,
          systemHealth: 'good'
        }
      });

      await user.click(screen.getByText(/Analytics/));

      await waitFor(() => {
        expect(screen.getByText('Total Users: 3')).toBeInTheDocument();
        expect(screen.getByText('Active Contests: 1')).toBeInTheDocument();
      });
    });

    it('should handle admin contest control workflow', async () => {
      // Login as admin
      mockApi.post.mockResolvedValueOnce({
        success: true,
        data: { token: 'admin-token', user: mockUsers.admin }
      });

      // Mock contest data
      mockApi.get.mockResolvedValueOnce({
        success: true,
        data: [mockContests.planned]
      });

      renderWithProviders(<App />);

      await user.type(screen.getByLabelText(/Username/), 'admin');
      await user.type(screen.getByLabelText(/Password/), 'password');
      await user.click(screen.getByRole('button', { name: /Login/ }));

      await waitFor(() => {
        expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
      });

      // Navigate to contest control
      await user.click(screen.getByText(/Contest Control/));

      await waitFor(() => {
        expect(screen.getByText('Planned Contest')).toBeInTheDocument();
      });

      // Start contest
      mockApi.patch.mockResolvedValueOnce({
        success: true,
        data: { ...mockContests.planned, status: 'RUNNING' }
      });

      await user.click(screen.getByText(/Start Contest/));

      await waitFor(() => {
        expect(screen.getByText('Contest started successfully')).toBeInTheDocument();
      });

      // Emergency stop
      mockApi.patch.mockResolvedValueOnce({
        success: true,
        data: { ...mockContests.planned, status: 'ENDED' }
      });

      await user.click(screen.getByText(/Emergency Stop/));
      await user.click(screen.getByText(/Confirm/)); // Confirmation dialog

      await waitFor(() => {
        expect(screen.getByText('Contest stopped')).toBeInTheDocument();
      });
    });
  });

  describe('Judge Workflow', () => {
    it('should complete full judge workflow: login -> view queue -> review submissions', async () => {
      // Login as judge
      mockApi.post.mockResolvedValueOnce({
        success: true,
        data: { token: 'judge-token', user: mockUsers.judge }
      });

      // Mock judge queue data
      mockApi.get.mockResolvedValueOnce({
        success: true,
        data: [
          {
            id: 'submission-1',
            problemId: 'problem-1',
            submittedBy: mockUsers.participant,
            timestamp: new Date(),
            status: 'PENDING',
            codeText: 'console.log("solution");'
          }
        ]
      });

      renderWithProviders(<App />);

      // Step 1: Login as judge
      await user.type(screen.getByLabelText(/Username/), 'judge');
      await user.type(screen.getByLabelText(/Password/), 'password');
      await user.click(screen.getByRole('button', { name: /Login/ }));

      await waitFor(() => {
        expect(screen.getByText(/Judge Queue/)).toBeInTheDocument();
      });

      // Step 2: View judge queue
      await user.click(screen.getByText(/Judge Queue/));

      await waitFor(() => {
        expect(screen.getByText('Participant User')).toBeInTheDocument();
        expect(screen.getByText('PENDING')).toBeInTheDocument();
      });

      // Step 3: Claim submission for review
      mockApi.post.mockResolvedValueOnce({
        success: true,
        data: { id: 'submission-1', status: 'UNDER_REVIEW' }
      });

      await user.click(screen.getByText(/Claim/));

      await waitFor(() => {
        expect(screen.getByText('UNDER_REVIEW')).toBeInTheDocument();
      });

      // Step 4: Review submission
      mockApi.post.mockResolvedValueOnce({
        success: true,
        data: {
          id: 'review-1',
          correct: true,
          scoreAwarded: 100,
          remarks: 'Good solution'
        }
      });

      await user.click(screen.getByText(/Review/));

      // Fill review form
      await user.click(screen.getByLabelText(/Correct/));
      await user.type(screen.getByLabelText(/Score/), '100');
      await user.type(screen.getByLabelText(/Remarks/), 'Good solution');
      await user.click(screen.getByRole('button', { name: /Submit Review/ }));

      await waitFor(() => {
        expect(screen.getByText('Review submitted successfully')).toBeInTheDocument();
      });
    });

    it('should handle judge queue filtering and sorting', async () => {
      mockApi.post.mockResolvedValueOnce({
        success: true,
        data: { token: 'judge-token', user: mockUsers.judge }
      });

      const mockSubmissions = [
        {
          id: 'submission-1',
          problemId: 'problem-1',
          submittedBy: mockUsers.participant,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          status: 'PENDING',
          difficulty: 'EASY'
        },
        {
          id: 'submission-2',
          problemId: 'problem-2',
          submittedBy: mockUsers.participant,
          timestamp: new Date('2024-01-01T11:00:00Z'),
          status: 'PENDING',
          difficulty: 'HARD'
        }
      ];

      mockApi.get.mockResolvedValueOnce({
        success: true,
        data: mockSubmissions
      });

      renderWithProviders(<App />);

      await user.type(screen.getByLabelText(/Username/), 'judge');
      await user.type(screen.getByLabelText(/Password/), 'password');
      await user.click(screen.getByRole('button', { name: /Login/ }));

      await waitFor(() => {
        expect(screen.getByText(/Judge Queue/)).toBeInTheDocument();
      });

      // Filter by difficulty
      await user.click(screen.getByLabelText(/Filter by difficulty/));
      await user.click(screen.getByText('EASY'));

      // Mock filtered results
      mockApi.get.mockResolvedValueOnce({
        success: true,
        data: [mockSubmissions[0]]
      });

      await waitFor(() => {
        expect(screen.getByText('EASY')).toBeInTheDocument();
        expect(screen.queryByText('HARD')).not.toBeInTheDocument();
      });

      // Sort by timestamp
      await user.click(screen.getByText(/Sort by time/));

      // Should reorder submissions
      await waitFor(() => {
        const submissions = screen.getAllByTestId('submission-row');
        expect(submissions[0]).toHaveTextContent('10:00');
      });
    });
  });

  describe('Participant Workflow', () => {
    it('should complete full participant workflow: login -> join contest -> solve problems -> view results', async () => {
      // Login as participant
      mockApi.post.mockResolvedValueOnce({
        success: true,
        data: { token: 'participant-token', user: mockUsers.participant }
      });

      // Mock available contests
      mockApi.get.mockResolvedValueOnce({
        success: true,
        data: [mockContests.active]
      });

      renderWithProviders(<App />);

      // Step 1: Login as participant
      await user.type(screen.getByLabelText(/Username/), 'participant');
      await user.type(screen.getByLabelText(/Password/), 'password');
      await user.click(screen.getByRole('button', { name: /Login/ }));

      await waitFor(() => {
        expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
      });

      // Step 2: Join contest
      mockApi.post.mockResolvedValueOnce({
        success: true,
        data: { contestId: 'contest-1', userId: 'participant-id' }
      });

      await user.click(screen.getByText(/Join Contest/));

      await waitFor(() => {
        expect(screen.getByText('Joined contest successfully')).toBeInTheDocument();
      });

      // Step 3: View problems
      mockApi.get.mockResolvedValueOnce({
        success: true,
        data: mockProblems
      });

      await user.click(screen.getByText(/Problems/));

      await waitFor(() => {
        expect(screen.getByText('Easy Problem')).toBeInTheDocument();
        expect(screen.getByText('Hard Problem')).toBeInTheDocument();
      });

      // Step 4: Solve problem
      await user.click(screen.getByText('Easy Problem'));

      await waitFor(() => {
        expect(screen.getByText(/Solve this easy problem/)).toBeInTheDocument();
      });

      // Submit solution
      mockApi.post.mockResolvedValueOnce({
        success: true,
        data: {
          id: 'submission-1',
          status: 'PENDING',
          timestamp: new Date()
        }
      });

      await user.type(screen.getByLabelText(/Code/), 'console.log("Hello World");');
      await user.click(screen.getByRole('button', { name: /Submit/ }));

      await waitFor(() => {
        expect(screen.getByText('Solution submitted successfully')).toBeInTheDocument();
      });

      // Step 5: View submissions
      mockApi.get.mockResolvedValueOnce({
        success: true,
        data: [
          {
            id: 'submission-1',
            problemId: 'problem-1',
            status: 'PENDING',
            score: 0,
            timestamp: new Date()
          }
        ]
      });

      await user.click(screen.getByText(/My Submissions/));

      await waitFor(() => {
        expect(screen.getByText('PENDING')).toBeInTheDocument();
      });

      // Step 6: View leaderboard
      mockApi.get.mockResolvedValueOnce({
        success: true,
        data: [
          {
            rank: 1,
            user: mockUsers.participant,
            score: 0,
            problemsSolved: 0
          }
        ]
      });

      await user.click(screen.getByText(/Leaderboard/));

      await waitFor(() => {
        expect(screen.getByText('Participant User')).toBeInTheDocument();
        expect(screen.getByText('Rank: 1')).toBeInTheDocument();
      });
    });

    it('should handle real-time submission updates', async () => {
      // Mock WebSocket with submission update
      const mockWebSocket = vi.fn(() => ({
        isConnected: true,
        lastMessage: {
          type: 'submission_update',
          data: {
            submissionId: 'submission-1',
            status: 'ACCEPTED',
            score: 100
          }
        },
        sendMessage: vi.fn(),
      }));

      vi.mocked(require('@/lib/websocket').useWebSocket).mockImplementation(mockWebSocket);

      mockApi.post.mockResolvedValueOnce({
        success: true,
        data: { token: 'participant-token', user: mockUsers.participant }
      });

      mockApi.get.mockResolvedValueOnce({
        success: true,
        data: [
          {
            id: 'submission-1',
            problemId: 'problem-1',
            status: 'PENDING',
            score: 0,
            timestamp: new Date()
          }
        ]
      });

      renderWithProviders(<App />);

      await user.type(screen.getByLabelText(/Username/), 'participant');
      await user.type(screen.getByLabelText(/Password/), 'password');
      await user.click(screen.getByRole('button', { name: /Login/ }));

      await user.click(screen.getByText(/My Submissions/));

      // Should show real-time update
      await waitFor(() => {
        expect(screen.getByText('ACCEPTED')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
      });
    });
  });

  describe('Cross-role Interactions', () => {
    it('should handle complete submission lifecycle across all roles', async () => {
      // This test simulates the complete flow:
      // 1. Admin creates contest
      // 2. Participant joins and submits solution
      // 3. Judge reviews submission
      // 4. All see updated leaderboard

      // Step 1: Admin creates contest
      mockApi.post.mockResolvedValueOnce({
        success: true,
        data: { token: 'admin-token', user: mockUsers.admin }
      });

      mockApi.post.mockResolvedValueOnce({
        success: true,
        data: { id: 'new-contest', name: 'Test Contest', status: 'PLANNED' }
      });

      renderWithProviders(<App />);

      await user.type(screen.getByLabelText(/Username/), 'admin');
      await user.type(screen.getByLabelText(/Password/), 'password');
      await user.click(screen.getByRole('button', { name: /Login/ }));

      await user.click(screen.getByText(/Create Contest/));
      await user.type(screen.getByLabelText(/Contest Name/), 'Test Contest');
      await user.click(screen.getByRole('button', { name: /Create/ }));

      await waitFor(() => {
        expect(screen.getByText('Contest created successfully')).toBeInTheDocument();
      });

      // Step 2: Start contest
      mockApi.patch.mockResolvedValueOnce({
        success: true,
        data: { id: 'new-contest', status: 'RUNNING' }
      });

      await user.click(screen.getByText(/Start Contest/));

      // Step 3: Logout and login as participant
      await user.click(screen.getByText(/Logout/));

      mockApi.post.mockResolvedValueOnce({
        success: true,
        data: { token: 'participant-token', user: mockUsers.participant }
      });

      await user.type(screen.getByLabelText(/Username/), 'participant');
      await user.type(screen.getByLabelText(/Password/), 'password');
      await user.click(screen.getByRole('button', { name: /Login/ }));

      // Step 4: Submit solution
      mockApi.post.mockResolvedValueOnce({
        success: true,
        data: { id: 'submission-1', status: 'PENDING' }
      });

      await user.click(screen.getByText(/Problems/));
      await user.click(screen.getByText('Easy Problem'));
      await user.type(screen.getByLabelText(/Code/), 'solution code');
      await user.click(screen.getByRole('button', { name: /Submit/ }));

      // Step 5: Logout and login as judge
      await user.click(screen.getByText(/Logout/));

      mockApi.post.mockResolvedValueOnce({
        success: true,
        data: { token: 'judge-token', user: mockUsers.judge }
      });

      await user.type(screen.getByLabelText(/Username/), 'judge');
      await user.type(screen.getByLabelText(/Password/), 'password');
      await user.click(screen.getByRole('button', { name: /Login/ }));

      // Step 6: Review submission
      mockApi.get.mockResolvedValueOnce({
        success: true,
        data: [{ id: 'submission-1', status: 'PENDING' }]
      });

      mockApi.post.mockResolvedValueOnce({
        success: true,
        data: { id: 'submission-1', status: 'UNDER_REVIEW' }
      });

      mockApi.post.mockResolvedValueOnce({
        success: true,
        data: { id: 'review-1', correct: true, scoreAwarded: 100 }
      });

      await user.click(screen.getByText(/Judge Queue/));
      await user.click(screen.getByText(/Claim/));
      await user.click(screen.getByText(/Review/));
      await user.click(screen.getByLabelText(/Correct/));
      await user.type(screen.getByLabelText(/Score/), '100');
      await user.click(screen.getByRole('button', { name: /Submit Review/ }));

      await waitFor(() => {
        expect(screen.getByText('Review submitted successfully')).toBeInTheDocument();
      });

      // Verify the complete workflow completed successfully
      expect(mockApi.post).toHaveBeenCalledTimes(6); // 3 logins + contest creation + submission + review
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network failures gracefully', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<App />);

      await user.type(screen.getByLabelText(/Username/), 'admin');
      await user.type(screen.getByLabelText(/Password/), 'password');
      await user.click(screen.getByRole('button', { name: /Login/ }));

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });

    it('should handle session expiration during workflow', async () => {
      // Initial login success
      mockApi.post.mockResolvedValueOnce({
        success: true,
        data: { token: 'admin-token', user: mockUsers.admin }
      });

      // Subsequent request fails with 401
      mockApi.get.mockRejectedValueOnce({
        response: { status: 401 },
        message: 'Token expired'
      });

      renderWithProviders(<App />);

      await user.type(screen.getByLabelText(/Username/), 'admin');
      await user.type(screen.getByLabelText(/Password/), 'password');
      await user.click(screen.getByRole('button', { name: /Login/ }));

      await waitFor(() => {
        expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/Users/));

      await waitFor(() => {
        expect(screen.getByText(/Session expired/)).toBeInTheDocument();
        expect(screen.getByText(/Login/)).toBeInTheDocument(); // Should redirect to login
      });
    });
  });
});