interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
}

interface WebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isAuthenticated = false;
  private userId: string | null = null;
  private contestId: string | null = null;
  private messageHandlers: Map<string, ((payload: any) => void)[]> = new Map();
  private options: WebSocketOptions = {};

  constructor(options: WebSocketOptions = {}) {
    this.options = options;
  }

  connect(userId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Use environment variable or default to localhost:3001 for backend
        const backendHost = import.meta.env.VITE_BACKEND_HOST || 'localhost:3001';
        const wsUrl = `${protocol}//${backendHost}`;
        
        console.log('Connecting to WebSocket:', wsUrl);
        this.ws = new WebSocket(wsUrl);
        this.userId = userId || null;

        // Set connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            this.ws.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000); // 10 second timeout

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('WebSocket connected to:', wsUrl);
          this.reconnectAttempts = 0;
          this.options.onConnect?.();
          
          // Authenticate if userId is provided
          if (this.userId) {
            this.authenticate(this.userId);
          }
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          console.log('WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
          this.isAuthenticated = false;
          this.options.onDisconnect?.();
          
          // Only attempt reconnect if it wasn't a clean close
          if (event.code !== 1000) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error('WebSocket error:', error);
          this.options.onError?.(error);
          reject(new Error('WebSocket connection failed'));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(message: WebSocketMessage) {
    console.log('Received WebSocket message:', message);

    // Handle authentication responses
    if (message.type === 'authenticated') {
      this.isAuthenticated = true;
      console.log('WebSocket authenticated');
    } else if (message.type === 'authentication_failed') {
      console.error('WebSocket authentication failed');
      this.isAuthenticated = false;
    }

    // Call registered handlers
    const handlers = this.messageHandlers.get(message.type) || [];
    handlers.forEach(handler => handler(message.payload));

    // Call global message handler
    this.options.onMessage?.(message);
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
      
      setTimeout(async () => {
        try {
          await this.connect(this.userId || undefined);
          console.log('WebSocket reconnected successfully');
        } catch (error) {
          console.error('Reconnection attempt failed:', error);
          // The connect method will trigger another reconnect attempt on failure
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached. WebSocket connection failed permanently.');
      // Notify about permanent connection failure
      this.options.onError?.(new Event('max_reconnect_attempts_reached') as any);
    }
  }

  authenticate(userId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.userId = userId;
      this.send('authenticate', { userId });
    }
  }

  joinContest(contestId: string) {
    if (this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated) {
      this.contestId = contestId;
      this.send('join_contest', { contestId });
    }
  }

  leaveContest() {
    if (this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated) {
      this.contestId = null;
      this.send('leave_contest', {});
    }
  }

  private send(type: string, payload: any): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type, payload, timestamp: new Date().toISOString() }));
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        return false;
      }
    } else {
      console.warn(`Cannot send message '${type}': WebSocket not connected (state: ${this.ws?.readyState})`);
      return false;
    }
  }

  // Event handler registration
  on(eventType: string, handler: (payload: any) => void) {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, []);
    }
    this.messageHandlers.get(eventType)!.push(handler);
  }

  off(eventType: string, handler: (payload: any) => void) {
    const handlers = this.messageHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Convenience methods for specific events
  onSubmissionUpdate(handler: (submission: any) => void) {
    this.on('submission_update', handler);
  }

  onLeaderboardUpdate(handler: (leaderboard: any[]) => void) {
    this.on('leaderboard_update', handler);
  }

  onContestPhaseChange(handler: (contest: any) => void) {
    this.on('contest_phase_change', handler);
  }

  onSystemControlUpdate(handler: (control: any) => void) {
    this.on('system_control_update', handler);
  }

  onJudgeQueueUpdate(handler: (queueData: any) => void) {
    this.on('judge_queue_update', handler);
  }

  onAnalyticsUpdate(handler: (analytics: any) => void) {
    this.on('analytics_update', handler);
  }

  onAttendanceUpdate(handler: (attendance: any) => void) {
    this.on('attendance_update', handler);
  }

  // Login method for WebSocket authentication
  login(username: string, password: string): Promise<{ token: string; user: any; permissions: number[] }> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      // Set up one-time listeners for login response with timeout
      const loginTimeout = setTimeout(() => {
        this.off('login_success', handleLoginSuccess);
        this.off('login_error', handleLoginError);
        reject(new Error('Login request timeout'));
      }, 15000); // 15 second timeout

      const handleLoginSuccess = (payload: any) => {
        clearTimeout(loginTimeout);
        this.off('login_success', handleLoginSuccess);
        this.off('login_error', handleLoginError);
        resolve(payload);
      };

      const handleLoginError = (payload: any) => {
        clearTimeout(loginTimeout);
        this.off('login_success', handleLoginSuccess);
        this.off('login_error', handleLoginError);
        reject(new Error(payload.message || 'Login failed'));
      };

      this.on('login_success', handleLoginSuccess);
      this.on('login_error', handleLoginError);

      // Send login request
      this.send('login', { username, password });
    });
  }

  // Manual retry connection method
  retryConnection(): Promise<void> {
    console.log('Manual connection retry requested');
    this.reconnectAttempts = 0; // Reset attempts for manual retry
    return this.connect(this.userId || undefined);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isAuthenticated = false;
    this.userId = null;
    this.contestId = null;
    this.messageHandlers.clear();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  isAuth(): boolean {
    return this.isAuthenticated;
  }

  getCurrentContestId(): string | null {
    return this.contestId;
  }

  getConnectionState(): string {
    if (!this.ws) return 'DISCONNECTED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'CONNECTED';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'CLOSED';
      default:
        return 'UNKNOWN';
    }
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;