import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PermissionService } from '../../services/permissionService';

describe('PermissionService - Basic Tests', () => {
  let permissionService: PermissionService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      permission: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };
    permissionService = new PermissionService(mockPrisma);
  });

  describe('getPermissionByCode', () => {
    it('should return permission by code', async () => {
      const permission = {
        id: 'perm1',
        code: 100,
        name: 'Dashboard',
        description: 'Access dashboard'
      };

      mockPrisma.permission.findUnique.mockResolvedValue(permission);

      const result = await permissionService.getPermissionByCode(100);

      expect(result).toEqual(permission);
      expect(mockPrisma.permission.findUnique).toHaveBeenCalledWith({
        where: { code: 100 }
      });
    });

    it('should return null if permission not found', async () => {
      mockPrisma.permission.findUnique.mockResolvedValue(null);

      const result = await permissionService.getPermissionByCode(999);

      expect(result).toBeNull();
    });
  });

  describe('getAllPermissions', () => {
    it('should return all permissions ordered by code', async () => {
      const permissions = [
        { id: 'perm1', code: 100, name: 'Dashboard' },
        { id: 'perm2', code: 200, name: 'Problems' },
        { id: 'perm3', code: 300, name: 'Judge Queue' }
      ];

      mockPrisma.permission.findMany.mockResolvedValue(permissions);

      const result = await permissionService.getAllPermissions();

      expect(result).toEqual(permissions);
      expect(mockPrisma.permission.findMany).toHaveBeenCalledWith({
        orderBy: { code: 'asc' }
      });
    });
  });

  describe('createPermission', () => {
    it('should create a new permission successfully', async () => {
      const newPermission = {
        code: 300,
        name: 'New Permission',
        description: 'A new permission'
      };

      const createdPermission = {
        id: 'perm3',
        ...newPermission,
        parentPermissionId: null
      };

      mockPrisma.permission.findUnique.mockResolvedValue(null); // No existing permission
      mockPrisma.permission.create.mockResolvedValue(createdPermission);

      const result = await permissionService.createPermission(newPermission);

      expect(result).toEqual(createdPermission);
      expect(mockPrisma.permission.create).toHaveBeenCalledWith({
        data: {
          code: 300,
          name: 'New Permission',
          description: 'A new permission',
          parentPermissionId: undefined
        }
      });
    });

    it('should throw error if permission code already exists', async () => {
      const existingPermission = {
        id: 'perm1',
        code: 100,
        name: 'Existing Permission'
      };

      mockPrisma.permission.findUnique.mockResolvedValue(existingPermission);

      await expect(permissionService.createPermission({
        code: 100,
        name: 'Duplicate Permission'
      })).rejects.toThrow('Permission with code 100 already exists');
    });
  });
});