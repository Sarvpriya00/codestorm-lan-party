import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PermissionService } from '../../services/permissionService';

describe('PermissionService - Enhanced Tests', () => {
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

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserPermissions', () => {
    it('should return user permissions with inherited permissions', async () => {
      const mockUser = {
        id: 'user1',
        roleId: 'role1',
        role: {
          rolePermissions: [
            {
              permission: {
                id: 'perm1',
                code: 100,
                name: 'Dashboard',
                description: 'Access dashboard',
                parentPermissionId: null
              }
            }
          ]
        }
      };

      const mockChildPermissions = [
        {
          id: 'perm2',
          code: 110,
          name: 'View Analytics',
          description: 'View dashboard analytics',
          parentPermissionId: 'perm1'
        }
      ];

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.permission.findMany.mockResolvedValue(mockChildPermissions);

      const result = await permissionService.getUserPermissions('user1');

      expect(result.userId).toBe('user1');
      expect(result.roleId).toBe('role1');
      expect(result.permissions).toHaveLength(1);
      expect(result.inheritedPermissions).toHaveLength(2); // Direct + inherited
    });

    it('should throw error for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(permissionService.getUserPermissions('nonexistent'))
        .rejects.toThrow('User with id nonexistent not found');
    });
  });

  describe('checkPermission', () => {
    it('should return true if user has permission', async () => {
      const mockUser = {
        id: 'user1',
        roleId: 'role1',
        role: {
          rolePermissions: [
            {
              permission: {
                id: 'perm1',
                code: 100,
                name: 'Dashboard',
                description: 'Access dashboard',
                parentPermissionId: null
              }
            }
          ]
        }
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.permission.findMany.mockResolvedValue([]);

      const result = await permissionService.checkPermission('user1', 100);

      expect(result).toBe(true);
    });

    it('should return false if user does not have permission', async () => {
      const mockUser = {
        id: 'user1',
        roleId: 'role1',
        role: {
          rolePermissions: [
            {
              permission: {
                id: 'perm1',
                code: 100,
                name: 'Dashboard',
                description: 'Access dashboard',
                parentPermissionId: null
              }
            }
          ]
        }
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.permission.findMany.mockResolvedValue([]);

      const result = await permissionService.checkPermission('user1', 200);

      expect(result).toBe(false);
    });
  });

  describe('getChildPermissions', () => {
    it('should return direct child permissions', async () => {
      const mockDirectChildren = [
        {
          id: 'child1',
          code: 110,
          name: 'Child 1',
          parentPermissionId: 'parent1'
        }
      ];

      mockPrisma.permission.findMany
        .mockResolvedValueOnce(mockDirectChildren) // First call for direct children
        .mockResolvedValueOnce([]); // Second call for grandchildren (none)

      const result = await permissionService.getChildPermissions('parent1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('child1');
    });

    it('should return empty array if no children exist', async () => {
      mockPrisma.permission.findMany.mockResolvedValue([]);

      const result = await permissionService.getChildPermissions('parent1');

      expect(result).toHaveLength(0);
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

    it('should throw error if parent permission does not exist', async () => {
      mockPrisma.permission.findUnique
        .mockResolvedValueOnce(null) // No existing permission with same code
        .mockResolvedValueOnce(null); // Parent permission not found

      await expect(permissionService.createPermission({
        code: 300,
        name: 'New Permission',
        parentPermissionId: 'nonexistent'
      })).rejects.toThrow('Parent permission with id nonexistent not found');
    });
  });

  describe('updatePermissionParent', () => {
    it('should update permission parent successfully', async () => {
      const permission = {
        id: 'perm1',
        code: 100,
        name: 'Permission 1',
        parentPermissionId: null
      };

      const parentPermission = {
        id: 'parent1',
        code: 50,
        name: 'Parent Permission',
        parentPermissionId: null
      };

      const updatedPermission = {
        ...permission,
        parentPermissionId: 'parent1'
      };

      mockPrisma.permission.findUnique
        .mockResolvedValueOnce(permission) // Permission exists
        .mockResolvedValueOnce(parentPermission); // Parent exists

      mockPrisma.permission.update.mockResolvedValue(updatedPermission);

      const result = await permissionService.updatePermissionParent('perm1', 'parent1');

      expect(result.parentPermissionId).toBe('parent1');
      expect(mockPrisma.permission.update).toHaveBeenCalledWith({
        where: { id: 'perm1' },
        data: { parentPermissionId: 'parent1' }
      });
    });

    it('should throw error if permission does not exist', async () => {
      mockPrisma.permission.findUnique.mockResolvedValue(null);

      await expect(permissionService.updatePermissionParent('nonexistent', 'parent1'))
        .rejects.toThrow('Permission with id nonexistent not found');
    });
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

  describe('getPermissionHierarchy', () => {
    it('should return complete permission hierarchy', async () => {
      const rootPermissions = [
        {
          id: 'perm1',
          code: 100,
          name: 'Dashboard',
          parentPermissionId: null,
          childPermissions: [],
          parentPermission: null
        }
      ];

      const childPermissions = [
        {
          id: 'perm2',
          code: 110,
          name: 'View Analytics',
          parentPermissionId: 'perm1'
        }
      ];

      mockPrisma.permission.findMany
        .mockResolvedValueOnce(rootPermissions) // Root permissions
        .mockResolvedValueOnce(childPermissions); // Child permissions

      const result = await permissionService.getPermissionHierarchy();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('perm1');
      expect(result[0].childPermissions).toHaveLength(1);
    });

    it('should handle empty hierarchy', async () => {
      mockPrisma.permission.findMany
        .mockResolvedValueOnce([]) // No root permissions
        .mockResolvedValue([]); // No child permissions

      const result = await permissionService.getPermissionHierarchy();

      expect(result).toHaveLength(0);
    });
  });

  describe('wouldCreateCycle - Circular Reference Prevention', () => {
    it('should detect circular references in permission hierarchy', async () => {
      // Mock a scenario where setting parent would create a cycle
      const permission1 = { id: 'perm1', parentPermissionId: 'perm2' };
      const permission2 = { id: 'perm2', parentPermissionId: null };

      mockPrisma.permission.findUnique
        .mockResolvedValueOnce(permission1) // First permission exists
        .mockResolvedValueOnce(permission2) // Parent exists
        .mockResolvedValueOnce(permission1); // Would create cycle

      await expect(permissionService.updatePermissionParent('perm2', 'perm1'))
        .rejects.toThrow('Cannot set parent: would create circular reference');
    });
  });

  describe('Complex Permission Inheritance', () => {
    it('should handle multi-level permission inheritance', async () => {
      const mockUser = {
        id: 'user1',
        roleId: 'role1',
        role: {
          rolePermissions: [
            {
              permission: {
                id: 'perm1',
                code: 100,
                name: 'Dashboard',
                parentPermissionId: null
              }
            }
          ]
        }
      };

      const level1Children = [
        { id: 'perm2', code: 110, name: 'View Analytics', parentPermissionId: 'perm1' }
      ];

      const level2Children = [
        { id: 'perm3', code: 111, name: 'Export Analytics', parentPermissionId: 'perm2' }
      ];

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.permission.findMany
        .mockResolvedValueOnce(level1Children) // Direct children of perm1
        .mockResolvedValueOnce(level2Children) // Children of perm2
        .mockResolvedValueOnce([]); // No children of perm3

      const result = await permissionService.getUserPermissions('user1');

      expect(result.inheritedPermissions).toHaveLength(3); // Original + 2 levels of children
      expect(result.inheritedPermissions.some(p => p.code === 111)).toBe(true);
    });

    it('should handle permission inheritance with multiple root permissions', async () => {
      const mockUser = {
        id: 'user1',
        roleId: 'role1',
        role: {
          rolePermissions: [
            {
              permission: {
                id: 'perm1',
                code: 100,
                name: 'Dashboard',
                parentPermissionId: null
              }
            },
            {
              permission: {
                id: 'perm4',
                code: 200,
                name: 'Problems',
                parentPermissionId: null
              }
            }
          ]
        }
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.permission.findMany
        .mockResolvedValueOnce([]) // No children for perm1
        .mockResolvedValueOnce([{ id: 'perm5', code: 210, name: 'View Problems', parentPermissionId: 'perm4' }]) // Children for perm4
        .mockResolvedValueOnce([]); // No children for perm5

      const result = await permissionService.getUserPermissions('user1');

      expect(result.permissions).toHaveLength(2); // Two direct permissions
      expect(result.inheritedPermissions).toHaveLength(3); // Direct + 1 inherited
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await expect(permissionService.getUserPermissions('user1'))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle malformed permission data', async () => {
      const mockUser = {
        id: 'user1',
        roleId: 'role1',
        role: {
          rolePermissions: [
            {
              permission: null // Malformed data
            }
          ]
        }
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(permissionService.getUserPermissions('user1'))
        .rejects.toThrow();
    });

    it('should validate permission code uniqueness', async () => {
      const existingPermission = { id: 'existing', code: 100 };
      mockPrisma.permission.findUnique.mockResolvedValue(existingPermission);

      await expect(permissionService.createPermission({
        code: 100,
        name: 'Duplicate Permission'
      })).rejects.toThrow('Permission with code 100 already exists');
    });

    it('should validate parent permission existence', async () => {
      mockPrisma.permission.findUnique
        .mockResolvedValueOnce(null) // No existing permission with same code
        .mockResolvedValueOnce(null); // Parent permission not found

      await expect(permissionService.createPermission({
        code: 300,
        name: 'New Permission',
        parentPermissionId: 'nonexistent'
      })).rejects.toThrow('Parent permission with id nonexistent not found');
    });
  });

  describe('Performance and Optimization', () => {
    it('should deduplicate permissions efficiently', async () => {
      const mockUser = {
        id: 'user1',
        roleId: 'role1',
        role: {
          rolePermissions: [
            {
              permission: {
                id: 'perm1',
                code: 100,
                name: 'Dashboard',
                parentPermissionId: null
              }
            }
          ]
        }
      };

      // Mock scenario where same permission appears multiple times in hierarchy
      const duplicateChildren = [
        { id: 'perm1', code: 100, name: 'Dashboard', parentPermissionId: null },
        { id: 'perm2', code: 110, name: 'Analytics', parentPermissionId: 'perm1' }
      ];

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.permission.findMany
        .mockResolvedValueOnce(duplicateChildren)
        .mockResolvedValueOnce([]);

      const result = await permissionService.getUserPermissions('user1');

      // Should not have duplicates
      const permissionIds = result.inheritedPermissions.map(p => p.id);
      const uniqueIds = [...new Set(permissionIds)];
      expect(permissionIds.length).toBe(uniqueIds.length);
    });
  });
});