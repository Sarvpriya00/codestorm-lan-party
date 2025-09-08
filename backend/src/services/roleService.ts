import { PrismaClient, Role, Permission, RolePermission } from '@prisma/client';
import { PermissionService } from './permissionService';

export interface RoleWithPermissions extends Role {
  rolePermissions: (RolePermission & {
    permission: Permission;
  })[];
}

export interface RolePermissionAssignment {
  roleId: string;
  permissionId: string;
  inherited: boolean;
}

export class RoleService {
  private prisma: PrismaClient;
  private permissionService: PermissionService;

  constructor(prismaClient?: PrismaClient, permissionService?: PermissionService) {
    this.prisma = prismaClient || new PrismaClient();
    this.permissionService = permissionService || new PermissionService(this.prisma);
  }
  /**
   * Get all roles with their permissions
   */
  async getAllRoles(): Promise<RoleWithPermissions[]> {
    return await this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });
  }

  /**
   * Get a specific role with its permissions
   */
  async getRoleById(roleId: string): Promise<RoleWithPermissions | null> {
    return await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });
  }

  /**
   * Get role by name
   */
  async getRoleByName(name: string): Promise<Role | null> {
    return await this.prisma.role.findUnique({
      where: { name }
    });
  }

  /**
   * Create a new role
   */
  async createRole(data: {
    name: string;
    description?: string;
  }): Promise<Role> {
    // Check if role name already exists
    const existingRole = await this.getRoleByName(data.name);
    if (existingRole) {
      throw new Error(`Role with name '${data.name}' already exists`);
    }

    return await this.prisma.role.create({
      data: {
        name: data.name,
        description: data.description
      }
    });
  }

  /**
   * Update role information
   */
  async updateRole(roleId: string, data: {
    name?: string;
    description?: string;
  }): Promise<Role> {
    // Check if role exists
    const existingRole = await this.prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!existingRole) {
      throw new Error(`Role with id ${roleId} not found`);
    }

    // Check if new name conflicts with existing role
    if (data.name && data.name !== existingRole.name) {
      const nameConflict = await this.getRoleByName(data.name);
      if (nameConflict) {
        throw new Error(`Role with name '${data.name}' already exists`);
      }
    }

    return await this.prisma.role.update({
      where: { id: roleId },
      data
    });
  }

  /**
   * Delete a role (only if no users are assigned to it)
   */
  async deleteRole(roleId: string): Promise<void> {
    // Check if role exists
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        users: true
      }
    });

    if (!role) {
      throw new Error(`Role with id ${roleId} not found`);
    }

    // Check if any users are assigned to this role
    if (role.users.length > 0) {
      throw new Error(`Cannot delete role: ${role.users.length} users are assigned to this role`);
    }

    // Delete all role permissions first
    await this.prisma.rolePermission.deleteMany({
      where: { roleId }
    });

    // Delete the role
    await this.prisma.role.delete({
      where: { id: roleId }
    });
  }

  /**
   * Assign a permission to a role
   */
  async assignPermissionToRole(
    roleId: string, 
    permissionId: string, 
    inherited: boolean = false
  ): Promise<RolePermission> {
    // Validate role exists
    const role = await this.prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      throw new Error(`Role with id ${roleId} not found`);
    }

    // Validate permission exists
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId }
    });

    if (!permission) {
      throw new Error(`Permission with id ${permissionId} not found`);
    }

    // Check if assignment already exists
    const existingAssignment = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId
        }
      }
    });

    if (existingAssignment) {
      throw new Error(`Permission is already assigned to this role`);
    }

    return await this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
        inherited
      }
    });
  }

  /**
   * Remove a permission from a role
   */
  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    const assignment = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId
        }
      }
    });

    if (!assignment) {
      throw new Error(`Permission is not assigned to this role`);
    }

    await this.prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId
        }
      }
    });
  }

  /**
   * Assign multiple permissions to a role
   */
  async assignMultiplePermissions(
    roleId: string, 
    permissionAssignments: { permissionId: string; inherited?: boolean }[]
  ): Promise<RolePermission[]> {
    // Validate role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      throw new Error(`Role with id ${roleId} not found`);
    }

    const results: RolePermission[] = [];

    for (const assignment of permissionAssignments) {
      try {
        const rolePermission = await this.assignPermissionToRole(
          roleId, 
          assignment.permissionId, 
          assignment.inherited || false
        );
        results.push(rolePermission);
      } catch (error) {
        // Continue with other assignments even if one fails
        console.warn(`Failed to assign permission ${assignment.permissionId} to role ${roleId}:`, error);
      }
    }

    return results;
  }

  /**
   * Get all permissions for a role (including inherited permissions from hierarchy)
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const role = await this.getRoleById(roleId);
    if (!role) {
      throw new Error(`Role with id ${roleId} not found`);
    }

    const directPermissions = role.rolePermissions.map(rp => rp.permission);
    const inheritedPermissions = await this.permissionService.getInheritedPermissions(directPermissions);

    // Combine and deduplicate
    const allPermissions = [...directPermissions, ...inheritedPermissions];
    return allPermissions.filter((permission, index, self) => 
      index === self.findIndex(p => p.id === permission.id)
    );
  }

  /**
   * Check if a role has a specific permission (including inherited)
   */
  async roleHasPermission(roleId: string, permissionCode: number): Promise<boolean> {
    const permissions = await this.getRolePermissions(roleId);
    return permissions.some(p => p.code === permissionCode);
  }

  /**
   * Assign user to role
   */
  async assignUserToRole(userId: string, roleId: string): Promise<void> {
    // Validate role exists
    const role = await this.prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      throw new Error(`Role with id ${roleId} not found`);
    }

    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    // Update user's role
    await this.prisma.user.update({
      where: { id: userId },
      data: { roleId }
    });
  }

  /**
   * Get all users assigned to a role
   */
  async getUsersInRole(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
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

    if (!role) {
      throw new Error(`Role with id ${roleId} not found`);
    }

    return role.users;
  }

  /**
   * Validate role-permission mapping
   */
  async validateRolePermissions(roleId: string): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    const role = await this.getRoleById(roleId);
    if (!role) {
      return {
        valid: false,
        issues: [`Role with id ${roleId} not found`]
      };
    }

    // Check for orphaned permissions (permissions that don't exist)
    for (const rp of role.rolePermissions) {
      const permission = await this.prisma.permission.findUnique({
        where: { id: rp.permissionId }
      });
      
      if (!permission) {
        issues.push(`Permission with id ${rp.permissionId} not found but assigned to role`);
      }
    }

    // Check for circular references in permission hierarchy
    for (const rp of role.rolePermissions) {
      try {
        await this.permissionService.getChildPermissions(rp.permissionId);
      } catch (error) {
        issues.push(`Circular reference detected in permission hierarchy for permission ${rp.permissionId}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Get role statistics
   */
  async getRoleStatistics(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        users: true,
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!role) {
      throw new Error(`Role with id ${roleId} not found`);
    }

    const allPermissions = await this.getRolePermissions(roleId);

    return {
      roleName: role.name,
      userCount: role.users.length,
      directPermissionCount: role.rolePermissions.length,
      totalPermissionCount: allPermissions.length,
      lastUserActivity: role.users.reduce((latest, user) => {
        if (!user.lastActive) return latest;
        if (!latest) return user.lastActive;
        return user.lastActive > latest ? user.lastActive : latest;
      }, null as Date | null)
    };
  }
}

export const roleService = new RoleService();