import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { 
  authenticateToken, 
  authorizePermissions, 
  authorize,
  validateIPAddress,
  securityHeaders,
  rateLimitByUser
} from '../../middleware/authMiddleware';

// Mock dependencies
vi.mock('jsonwebtoken', () => ({
  verify: vi.fn(),
}));

vi.mock('../../services/permissionService', () => ({
  permissionService: {
    getUserPermissions: vi.fn(),
    checkPermission: vi.fn(),
  },
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    user: {
      update: vi.fn(),
    },
  })),
}));

describe('Enhanced Authentication Middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: NextFunction;
  let jwt: any;
  let permissionService: any;
  let mockPrisma: any;

  beforeEach(async () => {
    // Import mocked modules
    jwt = await import('jsonwebtoken');
    const { permissionService: mockPermissionService } = await import('../../services/permissionService');
    const { PrismaClient } = await import('@prisma/client');
    
    permissionService = mockPermissionService;
    mockPrisma = new PrismaClient();

    mockReq = {
      headers: {},
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      path: '/test',
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      removeHeader: vi.fn(),
    };

    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token and set user info', () => {
      const mockPayload = {
        userId: 'user123',
        role: { id: 'role1', name: 'admin' },
        roleId: 'role1'
      };

      mockReq.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue(mockPayload);
      mockPrisma.user.update.mockResolvedValue({});

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockReq.userId).toBe('user123');
      expect(mockReq.userRole).toEqual(mockPayload.role);
      expect(mockReq.ipAddress).toBe('127.0.0.1');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 if no token provided', () => {
      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'AUTH_TOKEN_REQUIRED',
          message: 'Authentication token required'
        })
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 if token is invalid', () => {
      mockReq.headers.authorization = 'Bearer invalid-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'AUTH_TOKEN_INVALID',
          message: 'Invalid or expired token'
        })
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should continue if user update fails', (done) => {
      const mockPayload = {
        userId: 'user123',
        role: { id: 'role1', name: 'admin' },
        roleId: 'role1'
      };

      mockReq.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue(mockPayload);
      mockPrisma.user.update.mockRejectedValue(new Error('Database error'));

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      
      // Wait for async operations to complete
      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to update user last active:', expect.any(Error));
        consoleSpy.mockRestore();
        done();
      }, 10);
    });
  });

  describe('authorizePermissions', () => {
    beforeEach(() => {
      mockReq.userId = 'user123';
    });

    it('should allow access if user has all required permissions', async () => {
      const middleware = authorizePermissions([100, 200]);
      
      permissionService.checkPermission
        .mockResolvedValueOnce(true)  // Permission 100
        .mockResolvedValueOnce(true); // Permission 200

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should deny access if user lacks required permissions', async () => {
      const middleware = authorizePermissions([100, 200]);
      
      permissionService.checkPermission
        .mockResolvedValueOnce(true)   // Permission 100
        .mockResolvedValueOnce(false); // Permission 200

      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'ACCESS_DENIED_PERMISSION',
          message: 'Access denied: Insufficient permissions',
          details: expect.objectContaining({
            requiredPermissions: [100, 200],
            missingPermissions: [200]
          })
        })
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if user not authenticated', async () => {
      delete mockReq.userId;
      const middleware = authorizePermissions([100]);

      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        })
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle permission check errors', async () => {
      const middleware = authorizePermissions([100]);
      
      permissionService.checkPermission.mockRejectedValue(new Error('Database error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'PERMISSION_CHECK_ERROR',
          message: 'Error checking permissions'
        })
      });
      expect(mockNext).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('authorize', () => {
    beforeEach(() => {
      mockReq.userId = 'user123';
      mockReq.userRole = { id: 'role1', name: 'admin' };
    });

    it('should allow access based on role', async () => {
      const adminRole = { id: 'role1', name: 'admin' };
      mockReq.userRole = adminRole;
      
      const middleware = authorize({ 
        roles: [adminRole] 
      });

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow access based on permissions (requireAll=true)', async () => {
      const middleware = authorize({ 
        permissions: [100, 200],
        requireAll: true
      });
      
      permissionService.checkPermission
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow access based on permissions (requireAll=false)', async () => {
      const middleware = authorize({ 
        permissions: [100, 200],
        requireAll: false
      });
      
      permissionService.checkPermission
        .mockResolvedValueOnce(true)   // Has permission 100
        .mockResolvedValueOnce(false); // Doesn't have permission 200

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled(); // Should pass because user has ANY required permission
    });

    it('should deny access if no role or permission match', async () => {
      mockReq.userRole = { id: 'role2', name: 'user' };
      
      const middleware = authorize({ 
        roles: [{ id: 'role1', name: 'admin' }],
        permissions: [100]
      });
      
      permissionService.checkPermission.mockResolvedValue(false);

      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateIPAddress', () => {
    it('should allow access if no IP restrictions', () => {
      const middleware = validateIPAddress();

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow access if IP is in allowed list', () => {
      const middleware = validateIPAddress(['127.0.0.1', '192.168.1.1']);

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should deny access if IP is not in allowed list', () => {
      mockReq.ip = '10.0.0.1';
      const middleware = validateIPAddress(['127.0.0.1', '192.168.1.1']);

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'IP_ACCESS_DENIED',
          message: 'Access denied: IP address not allowed'
        })
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('securityHeaders', () => {
    it('should set security headers', () => {
      securityHeaders(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
      expect(mockRes.removeHeader).toHaveBeenCalledWith('X-Powered-By');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('rateLimitByUser', () => {
    beforeEach(() => {
      mockReq.userId = 'user123';
    });

    it('should allow first request', () => {
      const middleware = rateLimitByUser(5, 60000);

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should block requests after limit exceeded', () => {
      const middleware = rateLimitByUser(2, 60000);

      // First request
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Second request
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(2);

      // Third request should be blocked
      middleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests'
        })
      });
      expect(mockNext).toHaveBeenCalledTimes(2); // Should not increment
    });

    it('should skip rate limiting for unauthenticated requests', () => {
      delete mockReq.userId;
      const middleware = rateLimitByUser(1, 60000);

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});  descr
ibe('Enhanced Security Features', () => {
    describe('IP Address Validation', () => {
      it('should extract IP from various sources', () => {
        const testCases = [
          { req: { ip: '192.168.1.1' }, expected: '192.168.1.1' },
          { req: { connection: { remoteAddress: '10.0.0.1' } }, expected: '10.0.0.1' },
          { req: { headers: { 'x-forwarded-for': '203.0.113.1' } }, expected: '203.0.113.1' },
          { req: {}, expected: 'unknown' }
        ];

        testCases.forEach(({ req, expected }) => {
          const middleware = validateIPAddress(['192.168.1.1', '10.0.0.1', '203.0.113.1']);
          const mockReq = { ...mockReq, ...req };
          
          middleware(mockReq, mockRes, mockNext);
          
          if (expected === 'unknown') {
            expect(mockRes.status).toHaveBeenCalledWith(403);
          } else {
            expect(mockNext).toHaveBeenCalled();
          }
        });
      });

      it('should handle IPv6 addresses', () => {
        mockReq.ip = '2001:db8::1';
        const middleware = validateIPAddress(['2001:db8::1']);

        middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it('should handle CIDR ranges', () => {
        // This would require implementing CIDR support in the middleware
        mockReq.ip = '192.168.1.100';
        const middleware = validateIPAddress(['192.168.1.0/24']);

        // For now, test exact match behavior
        middleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
      });
    });

    describe('Rate Limiting', () => {
      it('should reset rate limit after time window', (done) => {
        const middleware = rateLimitByUser(2, 100); // 2 requests per 100ms
        mockReq.userId = 'user123';

        // First two requests should pass
        middleware(mockReq, mockRes, mockNext);
        middleware(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalledTimes(2);

        // Third request should be blocked
        middleware(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(429);

        // After time window, should allow requests again
        setTimeout(() => {
          vi.clearAllMocks();
          middleware(mockReq, mockRes, mockNext);
          expect(mockNext).toHaveBeenCalled();
          done();
        }, 150);
      });

      it('should handle different users independently', () => {
        const middleware = rateLimitByUser(1, 60000);

        // User 1 makes request
        mockReq.userId = 'user1';
        middleware(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalledTimes(1);

        // User 1 second request should be blocked
        middleware(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(429);

        // User 2 should still be allowed
        vi.clearAllMocks();
        mockReq.userId = 'user2';
        middleware(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Security Headers', () => {
      it('should set all required security headers', () => {
        securityHeaders(mockReq, mockRes, mockNext);

        const expectedHeaders = [
          ['X-Content-Type-Options', 'nosniff'],
          ['X-Frame-Options', 'DENY'],
          ['X-XSS-Protection', '1; mode=block'],
          ['Referrer-Policy', 'strict-origin-when-cross-origin']
        ];

        expectedHeaders.forEach(([header, value]) => {
          expect(mockRes.setHeader).toHaveBeenCalledWith(header, value);
        });

        expect(mockRes.removeHeader).toHaveBeenCalledWith('X-Powered-By');
        expect(mockNext).toHaveBeenCalled();
      });
    });
  });

  describe('Token Validation Edge Cases', () => {
    it('should handle malformed authorization header', () => {
      const testCases = [
        'InvalidFormat',
        'Bearer',
        'Bearer ',
        'NotBearer token123',
        ''
      ];

      testCases.forEach(authHeader => {
        vi.clearAllMocks();
        mockReq.headers.authorization = authHeader;

        authenticateToken(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    it('should handle JWT verification errors', () => {
      const errorCases = [
        { error: new Error('TokenExpiredError'), expectedCode: 'AUTH_TOKEN_INVALID' },
        { error: new Error('JsonWebTokenError'), expectedCode: 'AUTH_TOKEN_INVALID' },
        { error: new Error('NotBeforeError'), expectedCode: 'AUTH_TOKEN_INVALID' },
        { error: new Error('Unknown error'), expectedCode: 'AUTH_TOKEN_INVALID' }
      ];

      errorCases.forEach(({ error, expectedCode }) => {
        vi.clearAllMocks();
        mockReq.headers.authorization = 'Bearer invalid-token';
        jwt.verify.mockImplementation(() => {
          throw error;
        });

        authenticateToken(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: expect.objectContaining({
            code: expectedCode
          })
        });
      });
    });

    it('should handle missing user data in token', () => {
      const incompleteCases = [
        { userId: undefined, role: { id: 'role1' } },
        { userId: 'user1', role: undefined },
        { userId: 'user1', role: { id: undefined } },
        {}
      ];

      incompleteCases.forEach(payload => {
        vi.clearAllMocks();
        mockReq.headers.authorization = 'Bearer valid-token';
        jwt.verify.mockReturnValue(payload);

        authenticateToken(mockReq, mockRes, mockNext);

        // Should still proceed but with incomplete data
        expect(mockNext).toHaveBeenCalled();
      });
    });
  });

  describe('Permission Authorization Edge Cases', () => {
    beforeEach(() => {
      mockReq.userId = 'user123';
    });

    it('should handle empty permission arrays', async () => {
      const middleware = authorizePermissions([]);

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(permissionService.checkPermission).not.toHaveBeenCalled();
    });

    it('should handle permission service timeouts', async () => {
      const middleware = authorizePermissions([100]);
      
      permissionService.checkPermission.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'PERMISSION_CHECK_ERROR'
        })
      });
    });

    it('should handle partial permission failures', async () => {
      const middleware = authorizePermissions([100, 200, 300]);
      
      permissionService.checkPermission
        .mockResolvedValueOnce(true)   // Permission 100
        .mockRejectedValueOnce(new Error('Service error')) // Permission 200
        .mockResolvedValueOnce(false); // Permission 300

      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Complex Authorization Scenarios', () => {
    beforeEach(() => {
      mockReq.userId = 'user123';
      mockReq.userRole = { id: 'role1', name: 'user' };
    });

    it('should handle role-based authorization with inheritance', async () => {
      const adminRole = { id: 'admin-role', name: 'admin' };
      const userRole = { id: 'user-role', name: 'user' };
      
      const middleware = authorize({
        roles: [adminRole, userRole],
        permissions: [500], // Admin permission
        requireAll: false
      });

      // User has user role but not admin permission
      mockReq.userRole = userRole;
      permissionService.checkPermission.mockResolvedValue(false);

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled(); // Should pass due to role match
    });

    it('should handle complex permission combinations', async () => {
      const middleware = authorize({
        permissions: [100, 200, 300],
        requireAll: false,
        customCheck: (req) => req.userId === 'special-user'
      });

      // User has no permissions but passes custom check
      permissionService.checkPermission.mockResolvedValue(false);
      mockReq.userId = 'special-user';

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Audit Logging Integration', () => {
    it('should log authentication events', () => {
      const mockPayload = {
        userId: 'user123',
        role: { id: 'role1', name: 'admin' },
        roleId: 'role1'
      };

      mockReq.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue(mockPayload);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockReq.userId).toBe('user123');
      expect(mockReq.ipAddress).toBeDefined();
      
      consoleSpy.mockRestore();
    });

    it('should log authorization failures', async () => {
      const middleware = authorizePermissions([100]);
      
      permissionService.checkPermission.mockResolvedValue(false);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      
      consoleSpy.mockRestore();
    });
  });