import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { vi } from 'vitest';

// Mock user data for testing
export const mockUsers = {
  admin: {
    id: 'admin-id',
    username: 'admin',
    displayName: 'Admin User',
    role: {
      id: 'admin-role-id',
      name: 'ADMIN',
      description: 'Administrator role'
    },
    permissions: [
      { id: 'perm1', code: 100, name: 'Dashboard' },
      { id: 'perm2', code: 500, name: 'Users' },
      { id: 'perm3', code: 600, name: 'Analytics' },
      { id: 'perm4', code: 800, name: 'Contest Control' }
    ]
  },
  judge: {
    id: 'judge-id',
    username: 'judge',
    displayName: 'Judge User',
    role: {
      id: 'judge-role-id',
      name: 'JUDGE',
      description: 'Judge role'
    },
    permissions: [
      { id: 'perm5', code: 300, name: 'Judge Queue' }
    ]
  },
  participant: {
    id: 'participant-id',
    username: 'participant',
    displayName: 'Participant User',
    role: {
      id: 'participant-role-id',
      name: 'PARTICIPANT',
      description: 'Participant role'
    },
    permissions: [
      { id: 'perm6', code: 200, name: 'Problems' }
    ]
  }
};

// Mock contest data
export const mockContests = {
  active: {
    id: 'contest-1',
    name: 'Active Contest',
    description: 'An active contest',
    status: 'RUNNING',
    startTime: new Date('2024-01-01T10:00:00Z'),
    endTime: new Date('2024-01-01T14:00:00Z')
  },
  planned: {
    id: 'contest-2',
    name: 'Planned Contest',
    description: 'A planned contest',
    status: 'PLANNED',
    startTime: new Date('2025-01-01T10:00:00Z'),
    endTime: new Date('2025-01-01T14:00:00Z')
  }
};

// Mock problems data
export const mockProblems = [
  {
    id: 'problem-1',
    questionText: 'Easy Problem\n\nSolve this easy problem.',
    difficultyLevel: 'EASY',
    maxScore: 100,
    tags: ['array', 'sorting'],
    isActive: true
  },
  {
    id: 'problem-2',
    questionText: 'Hard Problem\n\nSolve this hard problem.',
    difficultyLevel: 'HARD',
    maxScore: 200,
    tags: ['dynamic-programming', 'graph'],
    isActive: true
  }
];

// Mock submissions data
export const mockSubmissions = [
  {
    id: 'submission-1',
    problemId: 'problem-1',
    contestId: 'contest-1',
    submittedById: 'participant-id',
    timestamp: new Date('2024-01-01T11:00:00Z'),
    status: 'ACCEPTED',
    score: 100,
    codeText: 'console.log("solution");'
  },
  {
    id: 'submission-2',
    problemId: 'problem-2',
    contestId: 'contest-1',
    submittedById: 'participant-id',
    timestamp: new Date('2024-01-01T12:00:00Z'),
    status: 'PENDING',
    score: 0,
    codeText: 'console.log("another solution");'
  }
];

// Create a custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  user?: typeof mockUsers.admin | typeof mockUsers.judge | typeof mockUsers.participant | null;
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    initialEntries = ['/'],
    user = null,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider initialUser={user}>
            {children}
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock API responses
export const mockApiResponses = {
  login: {
    success: true,
    data: {
      token: 'mock-jwt-token',
      user: mockUsers.admin
    }
  },
  contests: {
    success: true,
    data: [mockContests.active, mockContests.planned]
  },
  problems: {
    success: true,
    data: mockProblems
  },
  submissions: {
    success: true,
    data: mockSubmissions
  },
  leaderboard: {
    success: true,
    data: [
      {
        id: 'leaderboard-1',
        contestId: 'contest-1',
        userId: 'participant-id',
        rank: 1,
        score: 100,
        problemsSolved: 1,
        lastSubmissionTime: new Date('2024-01-01T11:00:00Z'),
        user: mockUsers.participant
      }
    ]
  }
};

// Mock fetch function
export function mockFetch(responses: Record<string, any> = mockApiResponses) {
  return vi.fn().mockImplementation((url: string, options?: RequestInit) => {
    const method = options?.method || 'GET';
    const urlPath = new URL(url, 'http://localhost').pathname;
    
    // Determine response based on URL and method
    let responseData;
    
    if (urlPath.includes('/auth/login') && method === 'POST') {
      responseData = responses.login;
    } else if (urlPath.includes('/contests') && method === 'GET') {
      responseData = responses.contests;
    } else if (urlPath.includes('/problems') && method === 'GET') {
      responseData = responses.problems;
    } else if (urlPath.includes('/submissions') && method === 'GET') {
      responseData = responses.submissions;
    } else if (urlPath.includes('/leaderboard') && method === 'GET') {
      responseData = responses.leaderboard;
    } else {
      responseData = { success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } };
    }

    return Promise.resolve({
      ok: responseData.success,
      status: responseData.success ? 200 : 400,
      json: () => Promise.resolve(responseData),
      text: () => Promise.resolve(JSON.stringify(responseData)),
    });
  });
}

// Helper to wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to create mock event
export const createMockEvent = (overrides = {}) => ({
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  target: { value: '' },
  ...overrides
});

// Helper to create mock router
export const createMockRouter = (overrides = {}) => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  ...overrides
});

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';