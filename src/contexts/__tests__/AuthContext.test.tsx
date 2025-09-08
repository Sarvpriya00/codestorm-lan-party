import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { mockUsers, mockApiResponses, mockFetch } from '@/test/utils';
import React from 'react';

// Mock the API module
vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import { api } from '@/lib/api';

describe('AuthContext', () => {
  let queryClient: QueryClient;
  const mockApi = api as any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = mockFetch();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );

  describe('Initial state', () => {
    it('should initialize with no user when no token in localStorage', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should initialize with user when valid token exists in localStorage', async () => {
      localStorage.setItem('token', 'valid-token');
      mockApi.get.mockResolvedValue({
        success: true,
        data: mockUsers.admin
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUsers.admin);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should clear invalid token from localStorage', async () => {
      localStorage.setItem('token', 'invalid-token');
      mockApi.get.mockRejectedValue(new Error('Invalid token'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('Login functionality', () => {
    it('should login successfully with valid credentials', async () => {
      mockApi.post.mockResolvedValue({
        success: true,
        data: {
          token: 'new-token',
          user: mockUsers.admin
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('admin', 'password');
      });

      expect(result.current.user).toEqual(mockUsers.admin);
      expect(result.current.isAuthenticated).toBe(true);
      expect(localStorage.getItem('token')).toBe('new-token');
      expect(mockApi.post).toHaveBeenCalledWith('/auth/login', {
        username: 'admin',
        password: 'password'
      });
    });

    it('should handle login failure', async () => {
      mockApi.post.mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.login('admin', 'wrong-password');
        })
      ).rejects.toThrow('Invalid credentials');

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('should handle network errors during login', async () => {
      mockApi.post.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.login('admin', 'password');
        })
      ).rejects.toThrow('Network error');

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Logout functionality', () => {
    it('should logout successfully', async () => {
      // First login
      localStorage.setItem('token', 'valid-token');
      mockApi.get.mockResolvedValue({
        success: true,
        data: mockUsers.admin
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUsers.admin);
      });

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('should clear all user data on logout', async () => {
      localStorage.setItem('token', 'valid-token');
      localStorage.setItem('user-preferences', 'some-data');
      
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.logout();
      });

      expect(localStorage.getItem('token')).toBeNull();
      // Should clear other auth-related data as well
    });
  });

  describe('Token management', () => {
    it('should refresh user data when token changes', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Set token and mock successful response
      localStorage.setItem('token', 'new-token');
      mockApi.get.mockResolvedValue({
        success: true,
        data: mockUsers.judge
      });

      await act(async () => {
        // Trigger token refresh (this would normally happen through login)
        await result.current.refreshUser();
      });

      expect(result.current.user).toEqual(mockUsers.judge);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle token expiration', async () => {
      localStorage.setItem('token', 'expired-token');
      mockApi.get.mockRejectedValue({
        response: { status: 401 }
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(localStorage.getItem('token')).toBeNull();
      });
    });
  });

  describe('Permission checking', () => {
    it('should provide hasPermission helper', async () => {
      localStorage.setItem('token', 'valid-token');
      mockApi.get.mockResolvedValue({
        success: true,
        data: mockUsers.admin
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUsers.admin);
      });

      expect(result.current.hasPermission(100)).toBe(true); // Dashboard permission
      expect(result.current.hasPermission(999)).toBe(false); // Non-existent permission
    });

    it('should provide hasRole helper', async () => {
      localStorage.setItem('token', 'valid-token');
      mockApi.get.mockResolvedValue({
        success: true,
        data: mockUsers.admin
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUsers.admin);
      });

      expect(result.current.hasRole('ADMIN')).toBe(true);
      expect(result.current.hasRole('PARTICIPANT')).toBe(false);
    });

    it('should return false for permission checks when not authenticated', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.hasPermission(100)).toBe(false);
      expect(result.current.hasRole('ADMIN')).toBe(false);
    });
  });

  describe('Loading states', () => {
    it('should show loading state during initial authentication check', () => {
      localStorage.setItem('token', 'valid-token');
      mockApi.get.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({ success: true, data: mockUsers.admin }), 100)
      ));

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBeNull();
    });

    it('should show loading state during login', async () => {
      mockApi.post.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({
          success: true,
          data: { token: 'token', user: mockUsers.admin }
        }), 100)
      ));

      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.login('admin', 'password');
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Error handling', () => {
    it('should handle malformed user data', async () => {
      localStorage.setItem('token', 'valid-token');
      mockApi.get.mockResolvedValue({
        success: true,
        data: { invalid: 'user data' }
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      localStorage.setItem('token', 'valid-token');
      mockApi.get.mockRejectedValue(new Error('Server error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Context provider with initial user', () => {
    it('should accept initial user prop', () => {
      const WrapperWithInitialUser = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <AuthProvider initialUser={mockUsers.participant}>
            {children}
          </AuthProvider>
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper: WrapperWithInitialUser });

      expect(result.current.user).toEqual(mockUsers.participant);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});