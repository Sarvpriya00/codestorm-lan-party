import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RoleService } from '../../services/roleService';
import { PermissionService } from '../../services/permissionService';

describe('RoleService - Enhanced Tests', () => {
  let roleService: RoleService;
  let mockPrisma: any;
  let mockPermissionService: any;

  beforeEach(() => {
    mockPrisma = {
      role: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      rolePermission: {
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
      permission: {
        findUnique: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };

    mockPermissionService = {
      getInheritedPermissions: vi.fn(),
      getChildPermissions: vi.fn(),
    };

    roleService = new RoleService(mockPrisma, mockPermissionService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllRoles', () => {
    it('should return all roles with permissions', async () => {
      const mockRoles = [
        {
          id: 'role1',
          name: 'Admin',
          description: 'Administrator role',
          rolePermissions: [
            {
              permission: {
                id: 'perm1',
                code: 100,
                name: 'Dashboard'
              }
            }
          ]
        }
      ];

      mockPrisma.role.findMany.mockResolvedValue(mockRoles);

      const result = await roleService.getAllRoles();

      expect(result).toEqual(mockRoles);
      expect(mockPrisma.role.findMany).toHaveBeenCalledWith({
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          }
        }
      });
    });
  });

  describe('getRoleById', () => {
    it('should return role by id with permissions', async () => {
      const mockRole = {
        id: 'role1',
        name: 'Admin',
        description: 'Administrator role',
        rolePermissions: []
      };

      mockPrisma.role.findUnique.mockResolvedValue(mockRole);

      const result = await roleService.getRoleById('role1');

      expect(result).toEqual(mockRole);
      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role1' },
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          }
        }
      });
    });

    it('should return null if role not found', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);

      const result = await roleService.getRoleById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getRoleByName', () => {
    it('should return role by name', async () => {
      const mockRole = {
        id: 'role1',
        name: 'Admin',
        description: 'Administrator role'
      };

      mockPrisma.role.findUnique.mockResolvedValue(mockRole);

      const result = await roleService.getRoleByName('Admin');

      expect(result).toEqual(mockRole);
      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'Admin' }
      });
    });
  });

  describe('createRole', () => {
    it('should create a new role successfully', async () => {
      const newRoleData = {
        name: 'Judge',
        description: 'Judge role'
      };

      const createdRole = {
        id: 'role2',
        ...newRoleData
      };

      mockPrisma.role.findUnique.mockResolvedValue(null); // No existing role
      mockPrisma.role.create.mockResolvedValue(createdRole);

      const result = await roleService.createRole(newRoleData);

      expect(result).toEqual(createdRole);
      expect(mockPrisma.role.create).toHaveBeenCalledWith({
        data: newRoleData
      });
    });

    it('should throw error if role name already exists', async () => {
      const existingRole = {
        id: 'role1',
        name: 'Admin'
      };

      mockPrisma.role.findUnique.mockResolvedValue(existingRole);

      await expect(roleService.createRole({
        name: 'Admin',
        description: 'Duplicate admin'
      })).rejects.toThrow("Role with name 'Admin' already exists");
    });
  });

  describe('updateRole', () => {
    it('should update role successfully', async () => {
      const existingRole = {
        id: 'role1',
        name: 'Admin',
        description: 'Old description'
      };

      const updatedRole = {
        ...existingRole,
        description: 'New description'
      };

      mockPrisma.role.findUnique.mockResolvedValue(existingRole);
      mockPrisma.role.update.mockResolvedValue(updatedRole);

      const result = await roleService.updateRole('role1', {
        description: 'New description'
      });

      expect(result).toEqual(updatedRole);
      expect(mockPrisma.role.update).toHaveBeenCalledWith({
        where: { id: 'role1' },
        data: { description: 'New description' }
      });
    });

    it('should throw error if role does not exist', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);

      await expect(roleService.updateRole('nonexistent', {
        name: 'New Name'
      })).rejects.toThrow('Role with id nonexistent not found');
    });

    it('should throw error if new name conflicts with existing role', async () => {
      const existingRole = {
        id: 'role1',
        name: 'Admin'
      };

      const conflictingRole = {
        id: 'role2',
        name: 'Judge'
      };

      mockPrisma.role.findUnique
        .mockResolvedValueOnce(existingRole) // First call for role existence
        .mockResolvedValueOnce(conflictingRole); // Second call for name conflict

      await expect(roleService.updateRole('role1', {
        name: 'Judge'
      })).rejects.toThrow("Role with name 'Judge' already exists");
    });
  });

  describe('deleteRole', () => {
    it('should delete role successfully when no users assigned', async () => {
      const role = {
        id: 'role1',
        name: 'Admin',
        users: []
      };

      mockPrisma.role.findUnique.mockResolvedValue(role);
      mockPrisma.rolePermission.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.role.delete.mockResolvedValue(role);

      await roleService.deleteRole('role1');

      expect(mockPrisma.rolePermission.deleteMany).toHaveBeenCalledWith({
        where: { roleId: 'role1' }
      });
      expect(mockPrisma.role.delete).toHaveBeenCalledWith({
        where: { id: 'role1' }
      });
    });

    it('should throw error if role has assigned users', async () => {
      const role = {
        id: 'role1',
        name: 'Admin',
        users: [{ id: 'user1' }]
      };

      mockPrisma.role.findUnique.mockResolvedValue(role);

      await expect(roleService.deleteRole('role1'))
        .rejects.toThrow('Cannot delete role: 1 users are assigned to this role');
    });

    it('should throw error if role does not exist', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);

      await expect(roleService.deleteRole('nonexistent'))
        .rejects.toThrow('Role with id nonexistent not found');
    });
  });

  describe('assignPermissionToRole', () => {
    it('should assign permission to role successfully', async () => {
      const role = { id: 'role1', name: 'Admin' };
      const permission = { id: 'perm1', code: 100, name: 'Dashboard' };
      const rolePermission = {
        id: 'rp1',
        roleId: 'role1',
        permissionId: 'perm1',
        inherited: false
      };

      mockPrisma.role.findUnique.mockResolvedValue(role);
      mockPrisma.permission.findUnique.mockResolvedValue(permission);
      mockPrisma.rolePermission.findUnique.mockResolvedValue(null); // No existing assignment
      mockPrisma.rolePermission.create.mockResolvedValue(rolePermission);

      const result = await roleService.assignPermissionToRole('role1', 'perm1');

      expect(result).toEqual(rolePermission);
      expect(mockPrisma.rolePermission.create).toHaveBeenCalledWith({
        data: {
          roleId: 'role1',
          permissionId: 'perm1',
          inherited: false
        }
      });
    });

    it('should throw error if role does not exist', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);

      await expect(roleService.assignPermissionToRole('nonexistent', 'perm1'))
        .rejects.toThrow('Role with id nonexistent not found');
    });

    it('should throw error if permission does not exist', async () => {
      const role = { id: 'role1', name: 'Admin' };

      mockPrisma.role.findUnique.mockResolvedValue(role);
      mockPrisma.permission.findUnique.mockResolvedValue(null);

      await expect(roleService.assignPermissionToRole('role1', 'nonexistent'))
        .rejects.toThrow('Permission with id nonexistent not found');
    });

    it('should throw error if permission already assigned', async () => {
      const role = { id: 'role1', name: 'Admin' };
      const permission = { id: 'perm1', code: 100, name: 'Dashboard' };
      const existingAssignment = { id: 'rp1', roleId: 'role1', permissionId: 'perm1' };

      mockPrisma.role.findUnique.mockResolvedValue(role);
      mockPrisma.permission.findUnique.mockResolvedValue(permission);
      mockPrisma.rolePermission.findUnique.mockResolvedValue(existingAssignment);

      await expect(roleService.assignPermissionToRole('role1', 'perm1'))
        .rejects.toThrow('Permission is already assigned to this role');
    });
  });

  describe('removePermissionFromRole', () => {
    it('should remove permission from role successfully', async () => {
      const assignment = {
        id: 'rp1',
        roleId: 'role1',
        permissionId: 'perm1'
      };

      mockPrisma.rolePermission.findUnique.mockResolvedValue(assignment);
      mockPrisma.rolePermission.delete.mockResolvedValue(assignment);

      await roleService.removePermissionFromRole('role1', 'perm1');

      expect(mockPrisma.rolePermission.delete).toHaveBeenCalledWith({
        where: {
          roleId_permissionId: {
            roleId: 'role1',
            permissionId: 'perm1'
          }
        }
      });
    });

    it('should throw error if permission not assigned to role', async () => {
      mockPrisma.rolePermission.findUnique.mockResolvedValue(null);

      await expect(roleService.removePermissionFromRole('role1', 'perm1'))
        .rejects.toThrow('Permission is not assigned to this role');
    });
  });

  describe('assignUserToRole', () => {
    it('should assign user to role successfully', async () => {
      const role = { id: 'role1', name: 'Admin' };
      const user = { id: 'user1', username: 'admin' };

      mockPrisma.role.findUnique.mockResolvedValue(role);
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue({ ...user, roleId: 'role1' });

      await roleService.assignUserToRole('user1', 'role1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { roleId: 'role1' }
      });
    });

    it('should throw error if role does not exist', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);

      await expect(roleService.assignUserToRole('user1', 'nonexistent'))
        .rejects.toThrow('Role with id nonexistent not found');
    });

    it('should throw error if user does not exist', async () => {
      const role = { id: 'role1', name: 'Admin' };

      mockPrisma.role.findUnique.mockResolvedValue(role);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(roleService.assignUserToRole('nonexistent', 'role1'))
        .rejects.toThrow('User with id nonexistent not found');
    });
  });

  describe('getUsersInRole', () => {
    it('should return users in role', async () => {
      const role = {
        id: 'role1',
        name: 'Admin',
        users: [
          {
            id: 'user1',
            username: 'admin1',
            displayName: 'Admin User',
            lastActive: new Date()
          }
        ]
      };

      mockPrisma.role.findUnique.mockResolvedValue(role);

      const result = await roleService.getUsersInRole('role1');

      expect(result).toEqual(role.users);
      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role1' },
        include: {
          users: {
            select: {
              id: true,
              username: true,
              displayName: true,
              lastActive: true
            }
          }
        }
      });
    });

    it('should throw error if role does not exist', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);

      await expect(roleService.getUsersInRole('nonexistent'))
        .rejects.toThrow('Role with id nonexistent not found');
    });
  });
});  d
escribe('Role Validation and Statistics', () => {
    it('should validate role permissions and detect issues', async () => {
      const mockRole = {
        id: 'role1',
        name: 'Test Role',
        rolePermissions: [
          {
            permissionId: 'perm1',
            permission: { id: 'perm1', code: 100, name: 'Valid Permission' }
          },
          {
            permissionId: 'invalid-perm',
            permission: null
          }
        ]
      };

      mockPrisma.role.findUnique.mockResolvedValue(mockRole);
      mockPrisma.permission.findUnique
        .mockResolvedValueOnce({ id: 'perm1' }) // Valid permission
        .mockResolvedValueOnce(null); // Invalid permission

      mockPermissionService.getChildPermissions.mockResolvedValue([]);

      const result = await roleService.validateRolePermissions('role1');

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Permission with id invalid-perm not found but assigned to role');
    });

    it('should detect circular references in permission hierarchy', async () => {
      const mockRole = {
        id: 'role1',
        name: 'Test Role',
        rolePermissions: [
          {
            permissionId: 'perm1',
            permission: { id: 'perm1', code: 100, name: 'Permission' }
          }
        ]
      };

      mockPrisma.role.findUnique.mockResolvedValue(mockRole);
      mockPrisma.permission.findUnique.mockResolvedValue({ id: 'perm1' });
      mockPermissionService.getChildPermissions.mockRejectedValue(new Error('Circular reference'));

      const result = await roleService.validateRolePermissions('role1');

      expect(result.valid).toBe(false);
      expect(result.issues.some(issue => issue.includes('Circular reference'))).toBe(true);
    });

    it('should return valid result for healthy role', async () => {
      const mockRole = {
        id: 'role1',
        name: 'Test Role',
        rolePermissions: [
          {
            permissionId: 'perm1',
            permission: { id: 'perm1', code: 100, name: 'Valid Permission' }
          }
        ]
      };

      mockPrisma.role.findUnique.mockResolvedValue(mockRole);
      mockPrisma.permission.findUnique.mockResolvedValue({ id: 'perm1' });
      mockPermissionService.getChildPermissions.mockResolvedValue([]);

      const result = await roleService.validateRolePermissions('role1');

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('Role Statistics', () => {
    it('should calculate comprehensive role statistics', async () => {
      const mockRole = {
        id: 'role1',
        name: 'Admin Role',
        users: [
          { id: 'user1', lastActive: new Date('2024-01-01') },
          { id: 'user2', lastActive: new Date('2024-01-02') },
          { id: 'user3', lastActive: null }
        ],
        rolePermissions: [
          { permissionId: 'perm1', permission: { id: 'perm1' } },
          { permissionId: 'perm2', permission: { id: 'perm2' } }
        ]
      };

      const allPermissions = [
        { id: 'perm1' },
        { id: 'perm2' },
        { id: 'perm3' } // Inherited permission
      ];

      mockPrisma.role.findUnique.mockResolvedValue(mockRole);
      roleService.getRolePermissions = vi.fn().mockResolvedValue(allPermissions);

      const stats = await roleService.getRoleStatistics('role1');

      expect(stats.roleName).toBe('Admin Role');
      expect(stats.userCount).toBe(3);
      expect(stats.directPermissionCount).toBe(2);
      expect(stats.totalPermissionCount).toBe(3);
      expect(stats.lastUserActivity).toEqual(new Date('2024-01-02'));
    });

    it('should handle role with no users', async () => {
      const mockRole = {
        id: 'role1',
        name: 'Empty Role',
        users: [],
        rolePermissions: []
      };

      mockPrisma.role.findUnique.mockResolvedValue(mockRole);
      roleService.getRolePermissions = vi.fn().mockResolvedValue([]);

      const stats = await roleService.getRoleStatistics('role1');

      expect(stats.userCount).toBe(0);
      expect(stats.lastUserActivity).toBeNull();
    });
  });

  describe('Multiple Permission Assignment', () => {
    it('should assign multiple permissions successfully', async () => {
      const mockRole = { id: 'role1', name: 'Test Role' };
      const assignments = [
        { permissionId: 'perm1', inherited: false },
        { permissionId: 'perm2', inherited: true }
      ];

      mockPrisma.role.findUnique.mockResolvedValue(mockRole);
      
      // Mock successful assignments
      roleService.assignPermissionToRole = vi.fn()
        .mockResolvedValueOnce({ id: 'rp1', roleId: 'role1', permissionId: 'perm1' })
        .mockResolvedValueOnce({ id: 'rp2', roleId: 'role1', permissionId: 'perm2' });

      const results = await roleService.assignMultiplePermissions('role1', assignments);

      expect(results).toHaveLength(2);
      expect(roleService.assignPermissionToRole).toHaveBeenCalledTimes(2);
    });

    it('should continue with other assignments if one fails', async () => {
      const mockRole = { id: 'role1', name: 'Test Role' };
      const assignments = [
        { permissionId: 'perm1' },
        { permissionId: 'invalid-perm' },
        { permissionId: 'perm3' }
      ];

      mockPrisma.role.findUnique.mockResolvedValue(mockRole);
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      roleService.assignPermissionToRole = vi.fn()
        .mockResolvedValueOnce({ id: 'rp1' })
        .mockRejectedValueOnce(new Error('Permission not found'))
        .mockResolvedValueOnce({ id: 'rp3' });

      const results = await roleService.assignMultiplePermissions('role1', assignments);

      expect(results).toHaveLength(2); // Only successful assignments
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to assign permission invalid-perm'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('User Role Management', () => {
    it('should get users in role with proper data selection', async () => {
      const mockRole = {
        id: 'role1',
        name: 'Test Role',
        users: [
          {
            id: 'user1',
            username: 'testuser1',
            displayName: 'Test User 1',
            lastActive: new Date('2024-01-01')
          },
          {
            id: 'user2',
            username: 'testuser2',
            displayName: null,
            lastActive: null
          }
        ]
      };

      mockPrisma.role.findUnique.mockResolvedValue(mockRole);

      const users = await roleService.getUsersInRole('role1');

      expect(users).toHaveLength(2);
      expect(users[0]).toEqual({
        id: 'user1',
        username: 'testuser1',
        displayName: 'Test User 1',
        lastActive: new Date('2024-01-01')
      });
      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role1' },
        include: {
          users: {
            select: {
              id: true,
              username: true,
              displayName: true,
              lastActive: true
            }
          }
        }
      });
    });

    it('should assign user to role with validation', async () => {
      const mockRole = { id: 'role1', name: 'Test Role' };
      const mockUser = { id: 'user1', username: 'testuser' };

      mockPrisma.role.findUnique.mockResolvedValue(mockRole);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, roleId: 'role1' });

      await roleService.assignUserToRole('user1', 'role1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { roleId: 'role1' }
      });
    });

    it('should throw error when assigning user to non-existent role', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);

      await expect(roleService.assignUserToRole('user1', 'nonexistent'))
        .rejects.toThrow('Role with id nonexistent not found');
    });

    it('should throw error when assigning non-existent user to role', async () => {
      const mockRole = { id: 'role1', name: 'Test Role' };
      
      mockPrisma.role.findUnique.mockResolvedValue(mockRole);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(roleService.assignUserToRole('nonexistent', 'role1'))
        .rejects.toThrow('User with id nonexistent not found');
    });
  });

  describe('Role Permission Checking', () => {
    it('should check if role has permission including inherited', async () => {
      const permissions = [
        { id: 'perm1', code: 100, name: 'Dashboard' },
        { id: 'perm2', code: 110, name: 'Analytics' }
      ];

      roleService.getRolePermissions = vi.fn().mockResolvedValue(permissions);

      const hasPermission = await roleService.roleHasPermission('role1', 100);
      const lacksPermission = await roleService.roleHasPermission('role1', 200);

      expect(hasPermission).toBe(true);
      expect(lacksPermission).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors in role operations', async () => {
      mockPrisma.role.findMany.mockRejectedValue(new Error('Database error'));

      await expect(roleService.getAllRoles())
        .rejects.toThrow('Database error');
    });

    it('should handle concurrent role name conflicts', async () => {
      mockPrisma.role.findUnique
        .mockResolvedValueOnce(null) // No existing role initially
        .mockResolvedValueOnce({ id: 'other', name: 'Admin' }); // But exists when creating

      mockPrisma.role.create.mockRejectedValue(new Error('Unique constraint violation'));

      await expect(roleService.createRole({ name: 'Admin' }))
        .rejects.toThrow();
    });
  });