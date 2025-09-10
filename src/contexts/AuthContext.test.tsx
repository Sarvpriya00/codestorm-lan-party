import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import * as api from '@/lib/api';
import websocketService from '@/lib/websocket';

// Mock the API client
vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock the WebSocket service
vi.mock('@/lib/websocket', () => ({
  default: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    login: vi.fn(),
    authenticate: vi.fn(),
    isConnected: vi.fn(),
  },
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { user, isAuthenticated, isLoading, login } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user">{user ? user.username : 'no-user'}</div>
      <button onClick={() => login('test', 'password')} data-testid="login-btn">
        Login
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  const mockApiClient = api.apiClient as any;
  const mockWebsocketService = websocketService as any;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockWebsocketService.isConnected.mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should handle WebSocket login response properly', async () => {
    // Mock successful WebSocket login
    mockWebsocketService.connect.mockResolvedValue(undefined);
    mockWebsocketService.login.mockResolvedValue({
      token: 'test-token',
      user: { id: '1', username: 'testuser' },
      permissions: [1, 2, 3],
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Click login button
    const loginBtn = screen.getByTestId('login-btn');
    loginBtn.click();

    // Wait for login to complete
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('testuser');
    expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'test-token');
  });

  it('should fallback to HTTP login when WebSocket fails', async () => {
    // Mock WebSocket failure and HTTP success
    mockWebsocketService.connect.mockRejectedValue(new Error('WebSocket failed'));
    mockApiClient.post.mockResolvedValue({
      token: 'http-token',
      user: { id: '2', username: 'httpuser' },
    });
    mockApiClient.get.mockResolvedValue({
      userPermissions: [4, 5, 6],
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Click login button
    const loginBtn = screen.getByTestId('login-btn');
    loginBtn.click();

    // Wait for fallback login to complete
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('httpuser');
    expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'http-token');
  });

  it('should handle invalid WebSocket response gracefully', async () => {
    // Mock WebSocket with invalid response
    mockWebsocketService.connect.mockResolvedValue(undefined);
    mockWebsocketService.login.mockResolvedValue(null); // Invalid response

    // Mock HTTP fallback success
    mockApiClient.post.mockResolvedValue({
      token: 'fallback-token',
      user: { id: '3', username: 'fallbackuser' },
    });
    mockApiClient.get.mockResolvedValue({
      userPermissions: [7, 8, 9],
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Click login button
    const loginBtn = screen.getByTestId('login-btn');
    loginBtn.click();

    // Wait for fallback to complete
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('fallbackuser');
  });

  it('should handle missing token in WebSocket response', async () => {
    // Mock WebSocket with missing token
    mockWebsocketService.connect.mockResolvedValue(undefined);
    mockWebsocketService.login.mockResolvedValue({
      user: { id: '4', username: 'notoken' },
      // Missing token
    });

    // Mock HTTP fallback success
    mockApiClient.post.mockResolvedValue({
      token: 'fallback-token',
      user: { id: '4', username: 'notoken' },
    });
    mockApiClient.get.mockResolvedValue({
      userPermissions: [10, 11],
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Click login button
    const loginBtn = screen.getByTestId('login-btn');
    loginBtn.click();

    // Should fallback to HTTP
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', {
      username: 'test',
      password: 'password',
    });
  });

  it('should handle permissions response safely', async () => {
    // Mock initialization with existing token
    localStorage.setItem('authToken', 'existing-token');
    
    mockApiClient.get
      .mockResolvedValueOnce({
        user: { id: '5', username: 'existing' },
      })
      .mockResolvedValueOnce({
        userPermissions: 'invalid-permissions', // Invalid format
      });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initialization and user to be set
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('existing');
  });
});