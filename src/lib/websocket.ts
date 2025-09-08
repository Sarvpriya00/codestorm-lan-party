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
        const wsUrl = `${protocol}//${window.location.host}`;
        
        this.ws = new WebSocket(wsUrl);
        this.userId = userId || null;

        this.ws.onopen = () => {
          console.log('WebSocket connected');
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

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.isAuthenticated = false;
          this.options.onDisconnect?.();
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.options.onError?.(error);
          reject(error);
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
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect(this.userId || undefined);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
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

  private send(type: string, payload: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
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
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;