import * as WebSocket from 'ws';
import * as http from 'http';
import { PrismaClient, Submission, Leaderboard, Contest, SystemControl, Analytics, Attendance } from '@prisma/client';
import { permissionService } from './permissionService';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import { serializeJsonSafe } from '../utils/serialization';

dotenv.config();

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  contestId?: string;
  permissions?: number[];
}

// Type guards for inbound message payloads
function isLoginPayload(payload: unknown): payload is { username: string; password: string } {
    return (
        typeof payload === 'object' &&
        payload !== null &&
        'username' in payload &&
        typeof (payload as any).username === 'string' &&
        'password' in payload &&
        typeof (payload as any).password === 'string'
    );
}

function isAuthenticatePayload(payload: unknown): payload is { userId: string } {
    return (
        typeof payload === 'object' &&
        payload !== null &&
        'userId' in payload &&
        typeof (payload as any).userId === 'string'
    );
}

function isJoinContestPayload(payload: unknown): payload is { contestId: string } {
    return (
        typeof payload === 'object' &&
        payload !== null &&
        'contestId' in payload &&
        typeof (payload as any).contestId === 'string'
    );
}


interface BroadcastOptions {
  requiredPermissions?: number[];
  contestId?: string;
  excludeUserId?: string;
  targetUserId?: string;
}

let wss: WebSocket.Server;
const prisma = new PrismaClient();

export const initWebSocket = (server: http.Server) => {
  try {
    wss = new WebSocket.Server({ 
      server,
      perMessageDeflate: false
    });

    wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
      const clientIP = req.socket.remoteAddress;
      const origin = req.headers.origin;

      const allowedOrigins = ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'];

      if (origin && !allowedOrigins.includes(origin)) {
        console.warn(`WebSocket connection from disallowed origin: ${origin}. Closing connection.`);
        ws.close(1000, 'Origin not allowed');
        return;
      }

      console.log(`Client connected to WebSocket from ${clientIP} (Origin: ${origin || 'N/A'})`);

      ws.send(JSON.stringify({
        type: 'connected',
        payload: { message: 'WebSocket connection established' },
        timestamp: new Date().toISOString()
      }));

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message);
          
          if (typeof data !== 'object' || data === null || typeof data.type !== 'string') {
            ws.send(JSON.stringify({
              type: 'error',
              payload: { message: 'Invalid message format' },
              timestamp: new Date().toISOString()
            }));
            return;
          }

          console.log(`Received WebSocket message: ${data.type}`);
          await handleWebSocketMessage(ws, data);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            payload: { message: 'Invalid message format' },
            timestamp: new Date().toISOString()
          }));
        }
      });

      ws.on('close', () => {
        console.log(`Client disconnected from WebSocket (${clientIP})`);
      });

      ws.on('error', (error: Error) => {
        console.error('WebSocket client error:', error);
      });
    });

    wss.on('error', (error: Error) => {
      console.error('WebSocket server error:', error);
    });

    console.log('✅ WebSocket server initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize WebSocket server:', error);
  }
};

const handleWebSocketMessage = async (ws: AuthenticatedWebSocket, data: { type: string; payload: unknown }) => {
  switch (data.type) {
    case 'login':
      if (isLoginPayload(data.payload)) {
        await handleLogin(ws, data.payload);
      } else {
        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid login payload' } }));
      }
      break;
    case 'authenticate':
      if (isAuthenticatePayload(data.payload)) {
        await authenticateWebSocket(ws, data.payload);
      } else {
        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid authenticate payload' } }));
      }
      break;
    case 'join_contest':
      if (isJoinContestPayload(data.payload)) {
        await joinContest(ws, data.payload.contestId);
      } else {
        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid join_contest payload' } }));
      }
      break;
    case 'leave_contest':
      ws.contestId = undefined;
      break;
    default:
      console.log(`Received message: ${JSON.stringify(data)}`);
  }
};

const authenticateWebSocket = async (ws: AuthenticatedWebSocket, payload: { userId: string }) => {
  try {
    const userPermissions = await permissionService.getUserPermissions(payload.userId);
    ws.userId = payload.userId;
    ws.permissions = userPermissions.inheritedPermissions.map(p => p.code);
    
    ws.send(JSON.stringify({
      type: 'authenticated',
      payload: serializeJsonSafe({ 
        userId: payload.userId,
        permissions: ws.permissions
      }),
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    ws.send(JSON.stringify({
      type: 'authentication_failed',
      payload: { message: 'Invalid user ID' },
      timestamp: new Date().toISOString()
    }));
  }
};

const handleLogin = async (ws: AuthenticatedWebSocket, payload: { username: string; password: string }) => {
  const { username, password } = payload;
  const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

  console.log(`WebSocket login attempt for user: ${username}`);

  if (!username || !password) {
    ws.send(JSON.stringify({
      type: 'login_error',
      payload: { message: 'Username and password are required' },
      timestamp: new Date().toISOString()
    }));
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { 
        role: true,
        contestUsers: {
          include: {
            contest: true
          }
        }
      },
    });

    if (!user) {
      console.log(`User not found: ${username}`);
      ws.send(JSON.stringify({
        type: 'login_error',
        payload: { message: 'Invalid credentials' },
        timestamp: new Date().toISOString()
      }));
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log(`Invalid password for user: ${username}`);
      ws.send(JSON.stringify({
        type: 'login_error',
        payload: { message: 'Invalid credentials' },
        timestamp: new Date().toISOString()
      }));
      return;
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role.name,
        roleId: user.roleId
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    let permissions: number[] = [];
    try {
      const userPermissions = await permissionService.getUserPermissions(user.id);
      permissions = userPermissions.inheritedPermissions.map(p => p.code);
    } catch (permError) {
      console.warn('Failed to fetch permissions, using empty array:', permError);
    }
    
    ws.userId = user.id;
    ws.permissions = permissions;

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastActive: new Date(),
        ipAddress: 'websocket-connection'
      }
    });

    ws.send(JSON.stringify({
      type: 'login_success',
      payload: serializeJsonSafe({ 
        token,
        user,
        permissions: ws.permissions
      }),
      timestamp: new Date().toISOString()
    }));

    console.log(`User ${username} logged in successfully via WebSocket`);

  } catch (error) {
    console.error('WebSocket login error:', error);
    ws.send(JSON.stringify({
      type: 'login_error',
      payload: { message: 'Internal server error during login' },
      timestamp: new Date().toISOString()
    }));
  }
};

const joinContest = async (ws: AuthenticatedWebSocket, contestId: string) => {
  if (!ws.userId) {
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message: 'Must authenticate first' },
      timestamp: new Date().toISOString()
    }));
    return;
  }

  try {
    const contestUser = await prisma.contestUser.findUnique({
      where: {
        contestId_userId: {
          contestId,
          userId: ws.userId
        }
      }
    });

    if (contestUser || ws.permissions?.includes(100)) { // Admin can join any contest
      ws.contestId = contestId;
      ws.send(JSON.stringify({
        type: 'contest_joined',
        payload: { contestId },
        timestamp: new Date().toISOString()
      }));
    } else {
      ws.send(JSON.stringify({
        type: 'error',
        payload: { message: 'Not enrolled in contest' },
        timestamp: new Date().toISOString()
      }));
    }
  } catch (error) {
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message: 'Failed to join contest' },
      timestamp: new Date().toISOString()
    }));
  }
};

export const broadcastMessage = (type: string, payload?: unknown, options: BroadcastOptions = {}) => {
  if (!wss) {
    console.warn('WebSocket server not initialized. Cannot broadcast message.');
    return;
  }

  const message = {
    type,
    payload: serializeJsonSafe(payload),
    timestamp: new Date().toISOString()
  };

  const messageString = JSON.stringify(message);

  wss.clients.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN) return;

    const authenticatedClient = client as AuthenticatedWebSocket;

    if (options.targetUserId && authenticatedClient.userId !== options.targetUserId) return;
    if (options.excludeUserId && authenticatedClient.userId === options.excludeUserId) return;
    if (options.contestId && authenticatedClient.contestId !== options.contestId) return;

    if (options.requiredPermissions && options.requiredPermissions.length > 0) {
      const hasPermission = options.requiredPermissions.some(perm => 
        authenticatedClient.permissions?.includes(perm)
      );
      if (!hasPermission) return;
    }

    authenticatedClient.send(messageString);
  });

  console.log(`Broadcasted message: ${type} to ${Array.from(wss.clients).length} clients`);
};

// Event broadcasting functions now pass raw Prisma objects, letting broadcastMessage handle serialization.
export const broadcastSubmissionUpdate = (submission: Submission, contestId: string) => {
  broadcastMessage('submission_update', submission, {
    contestId,
    requiredPermissions: [220, 300, 100] // Participants, judges, admins
  });
};

export const broadcastLeaderboardUpdate = (leaderboard: Leaderboard[], contestId: string) => {
  broadcastMessage('leaderboard_update', leaderboard, {
    contestId
  });
};

export const broadcastContestPhaseChange = (contest: Contest) => {
  broadcastMessage('contest_phase_change', contest, {
    contestId: contest.id
  });
};

export const broadcastSystemControl = (control: SystemControl, contestId: string) => {
  broadcastMessage('system_control_update', control, {
    contestId,
    requiredPermissions: [800] // Admin only
  });
};

export const broadcastJudgeQueueUpdate = (queueData: object, contestId: string) => {
  broadcastMessage('judge_queue_update', queueData, {
    contestId,
    requiredPermissions: [300] // Judges only
  });
};

export const broadcastAnalyticsUpdate = (analytics: Analytics, contestId: string) => {
  broadcastMessage('analytics_update', analytics, {
    contestId,
    requiredPermissions: [600, 100] // Analytics permission or admin
  });
};

export const broadcastAttendanceUpdate = (attendance: Attendance, contestId: string) => {
  broadcastMessage('attendance_update', attendance, {
    contestId,
    requiredPermissions: [1100, 100] // Attendance permission or admin
  });
};

export const broadcastNewProblem = (problem: any, contestId: string) => {
  broadcastMessage('new_problem', problem, {
    contestId
  });
};

export const broadcastUserUpdate = (user: any) => {
  broadcastMessage('user_update', user, {
    targetUserId: user.id
  });
};

export const broadcastGlobalNotification = (message: string, level: 'info' | 'warning' | 'error') => {
  broadcastMessage('global_notification', { message, level });
};