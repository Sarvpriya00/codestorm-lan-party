import * as WebSocket from 'ws';
import { PrismaClient } from '@prisma/client';
import { permissionService } from './permissionService';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  contestId?: string;
  permissions?: number[];
}

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
}

interface BroadcastOptions {
  requiredPermissions?: number[];
  contestId?: string;
  excludeUserId?: string;
  targetUserId?: string;
}

let wss: WebSocket.Server;
const prisma = new PrismaClient();

export const initWebSocket = (server: any) => {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws: AuthenticatedWebSocket) => {
    console.log('Client connected to WebSocket');

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
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
      console.log('Client disconnected from WebSocket');
    });

    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });
  });

  console.log('WebSocket server initialized');
};

const handleWebSocketMessage = async (ws: AuthenticatedWebSocket, data: any) => {
  switch (data.type) {
    case 'authenticate':
      await authenticateWebSocket(ws, data.payload);
      break;
    case 'join_contest':
      await joinContest(ws, data.payload.contestId);
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
      payload: { 
        userId: payload.userId,
        permissions: ws.permissions
      },
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
    // Verify user is enrolled in contest
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

export const broadcastMessage = (type: string, payload: any, options: BroadcastOptions = {}) => {
  if (!wss) {
    console.warn('WebSocket server not initialized. Cannot broadcast message.');
    return;
  }

  const message: WebSocketMessage = {
    type,
    payload,
    timestamp: new Date().toISOString()
  };

  const messageString = JSON.stringify(message);

  wss.clients.forEach((client: AuthenticatedWebSocket) => {
    if (client.readyState !== WebSocket.OPEN) return;

    // Skip if targeting specific user and this isn't them
    if (options.targetUserId && client.userId !== options.targetUserId) return;

    // Skip if excluding specific user and this is them
    if (options.excludeUserId && client.userId === options.excludeUserId) return;

    // Check contest membership if required
    if (options.contestId && client.contestId !== options.contestId) return;

    // Check permissions if required
    if (options.requiredPermissions && options.requiredPermissions.length > 0) {
      const hasPermission = options.requiredPermissions.some(perm => 
        client.permissions?.includes(perm)
      );
      if (!hasPermission) return;
    }

    client.send(messageString);
  });

  console.log(`Broadcasted message: ${type} to ${Array.from(wss.clients).length} clients`);
};

// Event broadcasting functions for specific events
export const broadcastSubmissionUpdate = (submission: any, contestId: string) => {
  broadcastMessage('submission_update', submission, {
    contestId,
    requiredPermissions: [220, 300, 100] // Participants, judges, admins
  });
};

export const broadcastLeaderboardUpdate = (leaderboard: any[], contestId: string) => {
  broadcastMessage('leaderboard_update', leaderboard, {
    contestId
  });
};

export const broadcastContestPhaseChange = (contest: any) => {
  broadcastMessage('contest_phase_change', contest, {
    contestId: contest.id
  });
};

export const broadcastSystemControl = (control: any, contestId: string) => {
  broadcastMessage('system_control_update', control, {
    contestId,
    requiredPermissions: [800] // Admin only
  });
};

export const broadcastJudgeQueueUpdate = (queueData: any, contestId: string) => {
  broadcastMessage('judge_queue_update', queueData, {
    contestId,
    requiredPermissions: [300] // Judges only
  });
};

export const broadcastAnalyticsUpdate = (analytics: any, contestId: string) => {
  broadcastMessage('analytics_update', analytics, {
    contestId,
    requiredPermissions: [600, 100] // Analytics permission or admin
  });
};

export const broadcastAttendanceUpdate = (attendance: any, contestId: string) => {
  broadcastMessage('attendance_update', attendance, {
    contestId,
    requiredPermissions: [1100, 100] // Attendance permission or admin
  });
};