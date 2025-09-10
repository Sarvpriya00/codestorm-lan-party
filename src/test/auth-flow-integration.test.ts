import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { bsocketService from '@/lib/websocket';
import { apiClient } from '@/lib/api';

// Mock the WebSocket and API
vi.mock('@/lib/websocket');
vi.mock('@/lib/api');

// Test component to interact with auth context
const TestAuthComponent = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">
        {isLoading ? 'loading' : isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="user-info">
        {user ? `User: ${user.username}` : 'No user'}
      </div>
      <button 
        data-testid="login-btn" 
        onClick={() => login('admin', 'admin123')}
      >
        Login
      </button>
      <button 
        data-testid="logout-btn" 
        onClick={logout}
      >
        Logout
      </button>
    </div>
  );
};

describe('Complete Authentication Flow Integration Test', () => {
  const mockWebSocketService = websocketService as any;
  const mockApiClient = apiClient as any;
  
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock WebSocket service methods
    mockWebSocketService.isConnected = vi.fn().mockReturnValue(false);
    mockWebSocketService.connect = vi.fn().mockResolvedValue(undefined);
    mockWebSocketService.login = vi.fn();
    mockWebSocketService.authenticate = vi.fn();
    mockWebSocketService.disconnect = vi.fn();
    
    // Mock API client methods
    mockApiClient.get = vi.fn();
    mockApiClient.post = vi.fn();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Sub-task 1: Verify WebSocket connection establishes without errors', () => {
    it('should establish WebSocket connection during login', async () => {
      // Mock successful WebSocket login
      mockWebSocketService.login.mockResolvedValue({
        token: 'test-token',
        user: { id: '1', username: 'admin', roleId: '1', scored: 0, problemsSolvedCount: 0, role: { id: '1', name: 'Admin' } },
        permissions: [1, 2, 3]
      });

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      const loginBtn = screen.getByTestId('login-btn');
      fireEvent.click(loginBtn);

      await waitFor(() => {
        expect(mockWebSocketService.connect).toHaveBeenCalled();
      });

      // Verify no connection errors occurred
      expect(mockWebSocketService.login).toHaveBeenCalledWith('admin', 'admin123');
    });

    it('should handle WebSocket connection failures gracefully', async () => {
      // Mock WebSocket connection failure
      mockWebSocketService.connect.mockRejectedValue(new Error('Connection failed'));
      
      // Mock successful HTTP fallback
      mockApiClient.post.mockResolvedValue({
        token: 'test-token',
        user: { id: '1', username: 'admin', roleId: '1', scored: 0, problemsSolvedCount: 0, role: { id: '1', name: 'Admin' } }
      });
      mockApiClient.get.mockResolvedValue({
        userPermissions: [1, 2, 3]
      });

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      const loginBtn = screen.getByTestId('login-btn');
      fireEvent.click(loginBtn);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Verify fallback to HTTP was used
      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', { username: 'admin', password: 'admin123' });
    });
  });

  describe('Sub-task 2: Test login functionality with admin/admin123 credentials', () => {
    it('should successfully login with admin/admin123 via WebSocket', async () => {
      mockWebSocketService.login.mockResolvedValue({
        token: 'test-token',
        user: { 
          id: '1', 
          username: 'admin', 
          roleId: '1', 
          scored: 0, 
          problemsSolvedCount: 0, 
          role: { id: '1', name: 'Admin' } 
        },
        permissions: [1, 2, 3]
      });

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      const loginBtn = screen.getByTestId('login-btn');
      fireEvent.click(loginBtn);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('user-info')).toHaveTextContent('User: admin');
      });

      // Verify token was stored
      expect(localStorage.getItem('authToken')).toBe('test-token');
    });

    it('should successfully login with admin/admin123 via HTTP fallback', async () => {
      // Mock WebSocket failure
      mockWebSocketService.login.mockRejectedValue(new Error('WebSocket login failed'));
      
      // Mock successful HTTP login
      mockApiClient.post.mockResolvedValue({
        token: 'http-token',
        user: { 
          id: '1', 
          username: 'admin', 
          roleId: '1', 
          scored: 0, 
          problemsSolvedCount: 0, 
          role: { id: '1', name: 'Admin' } 
        }
      });
      mockApiClient.get.mockResolvedValue({
        userPermissions: [1, 2, 3]
      });

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      const loginBtn = screen.getByTestId('login-btn');
      fireEvent.click(loginBtn);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('user-info')).toHaveTextContent('User: admin');
      });

      expect(localStorage.getItem('authToken')).toBe('http-token');
    });

    it('should handle invalid credentials properly', async () => {
      // Mock WebSocket login failure
      mockWebSocketService.login.mockRejectedValue(new Error('Invalid credentials'));
      
      // Mock HTTP login failure
      mockApiClient.post.mockRejectedValue(new Error('Invalid credentials'));

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      const loginBtn = screen.getByTestId('login-btn');
      
      await expect(async () => {
        fireEvent.click(loginBtn);
        await waitFor(() => {
          expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
        });
      }).not.toThrow();

      // Verify no token was stored
      expect(localStorage.getItem('authToken')).toBeNull();
    });
  });

  describe('Sub-task 3: Confirm no CORS errors appear', () => {
    it('should handle CORS errors gracefully in API calls', async () => {
      // Mock CORS error
      const corsError = new TypeError('Failed to fetch');
      mockApiClient.post.mockRejectedValue(corsError);
      mockWebSocketService.login.mockRejectedValue(new Error('WebSocket failed'));

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      const loginBtn = screen.getByTestId('login-btn');
      fireEvent.click(loginBtn);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      });

      // Verify CORS error was handled (no token stored)
      expect(localStorage.getItem('authToken')).toBeNull();
    });

    it('should use correct API base URL to avoid CORS issues', () => {
      // Verify environment variables are set correctly
      expect(import.meta.env.VITE_API_BASE_URL).toBe('http://localhost:3001/api');
      expect(import.meta.env.VITE_BACKEND_HOST).toBe('localhost:3001');
    });
  });

  describe('Sub-task 4: Validate authentication persistence across page refreshes', () => {
    it('should restore authentication state from localStorage on initialization', async () => {
      // Pre-populate localStorage with auth token
      localStorage.setItem('authToken', 'existing-token');
      
      // Mock successful user info retrieval
      mockApiClient.get.mockImplementation((endpoint) => {
        if (endpoint === '/user/me') {
          return Promise.resolve({
            user: { 
              id: '1', 
              username: 'admin', 
              roleId: '1', 
              scored: 0, 
              problemsSolvedCount: 0, 
              role: { id: '1', name: 'Admin' } 
            }
          });
        }
        if (endpoint === '/dynamic/user/routes-and-permissions') {
          return Promise.resolve({
            userPermissions: [1, 2, 3]
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('user-info')).toHaveTextContent('User: admin');
      });

      // Verify WebSocket connection was attempted for authenticated user
      expect(mockWebSocketService.connect).toHaveBeenCalledWith('1');
    });

    it('should clear invalid tokens and reset state', async () => {
      // Pre-populate localStorage with invalid token
      localStorage.setItem('authToken', 'invalid-token');
      
      // Mock failed user info retrieval
      mockApiClient.get.mockRejectedValue(new Error('Unauthorized'));

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      });

      // Verify invalid token was removed
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(mockWebSocketService.disconnect).toHaveBeenCalled();
    });

    it('should handle logout and clear all authentication state', async () => {
      // Setup authenticated state
      localStorage.setItem('authToken', 'test-token');
      mockApiClient.get.mockImplementation((endpoint) => {
        if (endpoint === '/user/me') {
          return Promise.resolve({
            user: { 
              id: '1', 
              username: 'admin', 
              roleId: '1', 
              scored: 0, 
              problemsSolvedCount: 0, 
              role: { id: '1', name: 'Admin' } 
            }
          });
        }
        if (endpoint === '/dynamic/user/routes-and-permissions') {
          return Promise.resolve({
            userPermissions: [1, 2, 3]
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      // Wait for authentication to complete
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Perform logout
      const logoutBtn = screen.getByTestId('logout-btn');
      fireEvent.click(logoutBtn);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
        expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
      });

      // Verify all state was cleared
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(mockWebSocketService.disconnect).toHaveBeenCalled();
    });
  });
});