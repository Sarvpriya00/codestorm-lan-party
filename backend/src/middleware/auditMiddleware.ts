import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { Role } from '@prisma/client'; // Import Role enum
import { auditService, AUDIT_ACTIONS } from '../services/auditService';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  userId?: string;
  userRole?: Role;
  userPermissions?: number[];
}

export const auditLogMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  res.json = function (body?: any) {
    // Capture response body
    res.locals.responseBody = body;
    return originalJson.call(this, body);
  };

  res.on('finish', async () => {
    const { method, originalUrl, ip, body } = req;
    const { userId, userRole, userPermissions } = req;
    const { statusCode } = res;
    const responseBody = res.locals.responseBody;

    // Skip logging for non-sensitive routes or failed requests
    if (statusCode >= 400 || originalUrl.includes('/health') || originalUrl.includes('/metrics')) {
      return;
    }

    try {
      await logRouteAction(originalUrl, method, statusCode, userId, ip, body, responseBody, userPermissions);
    } catch (logError) {
      console.error('Error logging audit event:', logError);
    }
  });

  next();
};

/**
 * Log specific route actions with permission tracking
 */
async function logRouteAction(
  originalUrl: string,
  method: string,
  statusCode: number,
  userId?: string,
  ip?: string,
  requestBody?: any,
  responseBody?: any,
  userPermissions?: number[]
): Promise<void> {
  let action: string;
  let details: any = {
    method,
    statusCode,
    url: originalUrl
  };
  let permissionId: string | undefined;

  // Authentication routes
  if (originalUrl.includes('/api/auth/login') && statusCode === 200) {
    action = AUDIT_ACTIONS.LOGIN;
    details = { 
      username: requestBody?.username,
      status: 'success',
      userAgent: requestBody?.userAgent
    };
  } else if (originalUrl.includes('/api/auth/logout')) {
    action = AUDIT_ACTIONS.LOGOUT;
    details = { status: 'success' };
  }
  
  // User management routes
  else if (originalUrl.includes('/api/admin/users') && method === 'POST' && statusCode === 201) {
    action = AUDIT_ACTIONS.USER_CREATED;
    details = { 
      targetUsername: requestBody?.username,
      targetRole: requestBody?.role,
      status: 'success'
    };
    permissionId = await getPermissionId(500); // Users permission
  } else if (originalUrl.includes('/api/admin/users') && originalUrl.includes('/role') && method === 'PUT') {
    action = AUDIT_ACTIONS.USER_ROLE_CHANGED;
    details = { 
      targetUserId: originalUrl.split('/')[4],
      newRole: requestBody?.role,
      status: 'success'
    };
    permissionId = await getPermissionId(500); // Users permission
  }
  
  // Contest management routes
  else if (originalUrl.includes('/api/contests') && method === 'POST' && statusCode === 201) {
    action = AUDIT_ACTIONS.CONTEST_CREATED;
    details = { 
      contestId: responseBody?.id,
      contestName: requestBody?.name,
      status: 'success'
    };
    permissionId = await getPermissionId(800); // Contest control permission
  } else if (originalUrl.includes('/api/admin/contest/state') && method === 'POST') {
    action = AUDIT_ACTIONS.CONTEST_PHASE_CHANGED;
    details = { 
      contestId: requestBody?.contestId,
      phase: requestBody?.phase,
      startTime: requestBody?.startTime,
      endTime: requestBody?.endTime,
      status: 'success'
    };
    permissionId = await getPermissionId(820); // Phase control permission
  } else if (originalUrl.includes('/api/admin/contest/emergency') && method === 'POST') {
    action = AUDIT_ACTIONS.CONTEST_EMERGENCY_ACTION;
    details = { 
      contestId: requestBody?.contestId,
      emergencyAction: requestBody?.action,
      reason: requestBody?.reason,
      status: 'success'
    };
    permissionId = await getPermissionId(840); // Emergency actions permission
  }
  
  // Problem management routes
  else if (originalUrl.includes('/api/admin/problems') && method === 'POST' && statusCode === 201) {
    action = AUDIT_ACTIONS.PROBLEM_CREATED;
    details = { 
      problemId: responseBody?.problem?.id,
      title: requestBody?.title,
      difficulty: requestBody?.difficulty,
      status: 'success'
    };
    permissionId = await getPermissionId(850); // Problem control permission
  } else if (originalUrl.includes('/api/admin/problems') && method === 'PUT' && statusCode === 200) {
    action = AUDIT_ACTIONS.PROBLEM_UPDATED;
    details = { 
      problemId: originalUrl.split('/').pop(),
      title: requestBody?.title,
      status: 'success'
    };
    permissionId = await getPermissionId(850); // Problem control permission
  }
  
  // Submission routes
  else if (originalUrl.includes('/api/submissions') && method === 'POST' && statusCode === 201) {
    action = AUDIT_ACTIONS.SUBMISSION_CREATED;
    details = { 
      submissionId: responseBody?.id,
      problemId: requestBody?.problemId,
      contestId: requestBody?.contestId,
      language: requestBody?.language,
      status: 'success'
    };
    permissionId = await getPermissionId(220); // Add submission permission
  }
  
  // Judge routes
  else if (originalUrl.includes('/api/judge/claim') && method === 'POST' && statusCode === 200) {
    action = AUDIT_ACTIONS.SUBMISSION_CLAIMED;
    details = { 
      submissionId: requestBody?.submissionId,
      status: 'success'
    };
    permissionId = await getPermissionId(310); // View submission permission
  } else if (originalUrl.includes('/api/judge/review') && method === 'POST' && statusCode === 201) {
    action = AUDIT_ACTIONS.REVIEW_SUBMITTED;
    details = { 
      submissionId: requestBody?.submissionId,
      reviewId: responseBody?.id,
      correct: requestBody?.correct,
      scoreAwarded: requestBody?.scoreAwarded,
      status: 'success'
    };
    permissionId = await getPermissionId(310); // View submission permission
  }
  
  // System administration routes
  else if (originalUrl.includes('/api/admin/exports') && method === 'GET') {
    action = AUDIT_ACTIONS.DATA_EXPORTED;
    details = { 
      exportType: originalUrl.split('/').pop(),
      status: 'success'
    };
    permissionId = await getPermissionId(700); // Exports permission
  }
  
  // Default case for other routes
  else {
    action = `${method}_${originalUrl.replace(/\/api\//, '').replace(/\//g, '_').toUpperCase()}`;
    details = { 
      method,
      statusCode,
      url: originalUrl,
      hasRequestBody: !!requestBody,
      hasResponseBody: !!responseBody
    };
  }

  // Create audit log entry
  await auditService.createAuditLog({
    userId,
    action,
    permissionId,
    ipAddress: ip,
    details
  });
}

/**
 * Get permission ID by permission code
 */
async function getPermissionId(permissionCode: number): Promise<string | undefined> {
  try {
    const permission = await prisma.permission.findUnique({
      where: { code: permissionCode }
    });
    return permission?.id;
  } catch (error) {
    console.error('Error fetching permission:', error);
    return undefined;
  }
}