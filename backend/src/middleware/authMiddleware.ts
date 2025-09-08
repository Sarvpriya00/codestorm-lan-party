import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import { Role, Permission } from '@prisma/client';
import { permissionService } from '../services/permissionService';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';
const prisma = new PrismaClient();

interface AuthRequest extends Request {
  userId?: string;
  userRole?: Role;
  userPermissions?: Permission[];
  ipAddress?: string;
}

interface JWTPayload {
  userId: string;
  role: Role;
  roleId: string;
  iat?: number;
  exp?: number;
}

/**
 * Enhanced authentication middleware with IP tracking
 */
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ 
      success: false,
      error: {
        code: 'AUTH_TOKEN_REQUIRED',
        message: 'Authentication token required',
        timestamp: new Date().toISOString(),
        path: req.path
      }
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // Set user information
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    
    // Track IP address
    req.ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Update user's last active timestamp and IP (async, don't wait)
    prisma.user.update({
      where: { id: decoded.userId },
      data: { 
        lastActive: new Date(),
        ipAddress: req.ipAddress
      }
    }).catch(updateError => {
      console.warn('Failed to update user last active:', updateError);
    });

    // Load user permissions for hierarchical checking (async, don't wait)
    permissionService.getUserPermissions(decoded.userId)
      .then(userPermissions => {
        req.userPermissions = userPermissions.inheritedPermissions;
      })
      .catch(permError => {
        console.warn('Failed to load user permissions:', permError);
        req.userPermissions = [];
      });

    next();
  } catch (err) {
    return res.status(403).json({ 
      success: false,
      error: {
        code: 'AUTH_TOKEN_INVALID',
        message: 'Invalid or expired token',
        timestamp: new Date().toISOString(),
        path: req.path
      }
    });
  }
};

/**
 * Legacy role-based authorization (maintained for backward compatibility)
 */
export const authorizeRoles = (roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ 
        success: false,
        error: {
          code: 'ACCESS_DENIED_ROLE',
          message: 'Access denied: Insufficient role permissions',
          timestamp: new Date().toISOString(),
          path: req.path,
          details: {
            requiredRoles: roles,
            userRole: req.userRole
          }
        }
      });
    }
    next();
  };
};

/**
 * Enhanced permission-based authorization with hierarchical checking
 */
export const authorizePermissions = (requiredPermissions: number[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userId) {
      return res.status(401).json({ 
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    }

    try {
      // Check if user has all required permissions
      const hasAllPermissions = await Promise.all(
        requiredPermissions.map(permCode => 
          permissionService.checkPermission(req.userId!, permCode)
        )
      );

      const missingPermissions = requiredPermissions.filter((_, index) => !hasAllPermissions[index]);

      if (missingPermissions.length > 0) {
        return res.status(403).json({ 
          success: false,
          error: {
            code: 'ACCESS_DENIED_PERMISSION',
            message: 'Access denied: Insufficient permissions',
            timestamp: new Date().toISOString(),
            path: req.path,
            details: {
              requiredPermissions,
              missingPermissions,
              userId: req.userId
            }
          }
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ 
        success: false,
        error: {
          code: 'PERMISSION_CHECK_ERROR',
          message: 'Error checking permissions',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    }
  };
};

/**
 * Flexible authorization that accepts either roles or permissions
 */
export const authorize = (options: {
  roles?: Role[];
  permissions?: number[];
  requireAll?: boolean; // If true, user must have ALL permissions, if false, user needs ANY permission
}) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userId) {
      return res.status(401).json({ 
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    }

    try {
      let hasAccess = false;

      // Check role-based access first
      if (options.roles && req.userRole && options.roles.includes(req.userRole)) {
        hasAccess = true;
      }

      // Check permission-based access
      if (!hasAccess && options.permissions && options.permissions.length > 0) {
        const permissionChecks = await Promise.all(
          options.permissions.map(permCode => 
            permissionService.checkPermission(req.userId!, permCode)
          )
        );

        if (options.requireAll !== false) {
          // Default: require ALL permissions
          hasAccess = permissionChecks.every(check => check);
        } else {
          // Require ANY permission
          hasAccess = permissionChecks.some(check => check);
        }
      }

      if (!hasAccess) {
        return res.status(403).json({ 
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'Access denied: Insufficient permissions',
            timestamp: new Date().toISOString(),
            path: req.path,
            details: {
              requiredRoles: options.roles,
              requiredPermissions: options.permissions,
              userRole: req.userRole,
              userId: req.userId
            }
          }
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({ 
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Error during authorization',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    }
  };
};

/**
 * IP address validation middleware
 */
export const validateIPAddress = (allowedIPs?: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!allowedIPs || allowedIPs.length === 0) {
      return next(); // No IP restrictions
    }

    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (!allowedIPs.includes(clientIP)) {
      return res.status(403).json({ 
        success: false,
        error: {
          code: 'IP_ACCESS_DENIED',
          message: 'Access denied: IP address not allowed',
          timestamp: new Date().toISOString(),
          path: req.path,
          details: {
            clientIP,
            allowedIPs: allowedIPs.length // Don't expose actual allowed IPs for security
          }
        }
      });
    }

    next();
  };
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
};

/**
 * Rate limiting by user ID
 */
export const rateLimitByUser = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  const userRequestCounts = new Map<string, { count: number; resetTime: number }>();

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userId) {
      return next(); // Skip rate limiting for unauthenticated requests
    }

    const now = Date.now();
    const userKey = req.userId;
    const userLimit = userRequestCounts.get(userKey);

    if (!userLimit || now > userLimit.resetTime) {
      // Reset or initialize counter
      userRequestCounts.set(userKey, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    if (userLimit.count >= maxRequests) {
      return res.status(429).json({ 
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests',
          timestamp: new Date().toISOString(),
          path: req.path,
          details: {
            maxRequests,
            windowMs,
            resetTime: new Date(userLimit.resetTime).toISOString()
          }
        }
      });
    }

    // Increment counter
    userLimit.count++;
    userRequestCounts.set(userKey, userLimit);
    
    next();
  };
};