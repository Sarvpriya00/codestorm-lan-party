import { PrismaClient, Permission, Role, RolePermission } from '@prisma/client';

export interface PermissionWithHierarchy extends Permission {
  childPermissions?: PermissionWithHierarchy[];
  parentPermission?: PermissionWithHierarchy | null;
}

export interface UserPermissions {
  userId: string;
  roleId: string;
  permissions: Permission[];
  inheritedPermissions: Permission[];
}

export class PermissionService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient();
  }
  /**
   * Get all permissions for a user, including inherited permissions
   */
  async getUserPermissions(userId: string): Promise<UserPermissions> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    const directPermissions = user.role.rolePermissions.map(rp => rp.permission);
    const inheritedPermissions = await this.getInheritedPermissions(directPermissions);

    // Combine and deduplicate permissions
    const allPermissions = [...directPermissions, ...inheritedPermissions];
    const uniquePermissions = allPermissions.filter((permission, index, self) => 
      index === self.findIndex(p => p.id === permission.id)
    );

    return {
      userId: user.id,
      roleId: user.roleId,
      permissions: directPermissions,
      inheritedPermissions: uniquePermissions
    };
  }

  /**
   * Check if a user has a specific permission (including inherited)
   */
  async checkPermission(userId: string, permissionCode: number): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return userPermissions.inheritedPermissions.some(p => p.code === permissionCode);
  }

  /**
   * Get all inherited permissions from a list of permissions
   */
  async getInheritedPermissions(permissions: Permission[]): Promise<Permission[]> {
    const inheritedPermissions: Permission[] = [];

    for (const permission of permissions) {
      const children = await this.getChildPermissions(permission.id);
      inheritedPermissions.push(...children);
    }

    // Remove duplicates
    return inheritedPermissions.filter((permission, index, self) => 
      index === self.findIndex(p => p.id === permission.id)
    );
  }

  /**
   * Get all child permissions recursively for a given permission
   */
  async getChildPermissions(permissionId: string): Promise<Permission[]> {
    const childPermissions: Permission[] = [];
    
    const directChildren = await this.prisma.permission.findMany({
      where: { parentPermissionId: permissionId }
    });

    for (const child of directChildren) {
      childPermissions.push(child);
      // Recursively get grandchildren
      const grandChildren = await this.getChildPermissions(child.id);
      childPermissions.push(...grandChildren);
    }

    return childPermissions;
  }

  /**
   * Get permission hierarchy starting from root permissions
   */
  async getPermissionHierarchy(): Promise<PermissionWithHierarchy[]> {
    const rootPermissions = await this.prisma.permission.findMany({
      where: { parentPermissionId: null },
      include: {
        childPermissions: true,
        parentPermission: true
      }
    });

    const hierarchyPromises = rootPermissions.map(async (permission) => {
      return await this.buildPermissionTree(permission);
    });

    return Promise.all(hierarchyPromises);
  }

  /**
   * Build a complete permission tree for a given permission
   */
  private async buildPermissionTree(permission: Permission): Promise<PermissionWithHierarchy> {
    const children = await this.prisma.permission.findMany({
      where: { parentPermissionId: permission.id }
    });

    const childTrees = await Promise.all(
      children.map(child => this.buildPermissionTree(child))
    );

    return {
      ...permission,
      childPermissions: childTrees
    };
  }

  /**
   * Create a new permission
   */
  async createPermission(data: {
    code: number;
    name: string;
    description?: string;
    parentPermissionId?: string;
  }): Promise<Permission> {
    // Check if permission code already exists
    const existingPermission = await this.prisma.permission.findUnique({
      where: { code: data.code }
    });

    if (existingPermission) {
      throw new Error(`Permission with code ${data.code} already exists`);
    }

    // Validate parent permission exists if provided
    if (data.parentPermissionId) {
      const parentPermission = await this.prisma.permission.findUnique({
        where: { id: data.parentPermissionId }
      });

      if (!parentPermission) {
        throw new Error(`Parent permission with id ${data.parentPermissionId} not found`);
      }
    }

    return await this.prisma.permission.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        parentPermissionId: data.parentPermissionId
      }
    });
  }

  /**
   * Update permission hierarchy
   */
  async updatePermissionParent(permissionId: string, newParentId?: string | null): Promise<Permission> {
    // Validate permission exists
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId }
    });

    if (!permission) {
      throw new Error(`Permission with id ${permissionId} not found`);
    }

    // Validate new parent exists if provided
    if (newParentId) {
      const parentPermission = await this.prisma.permission.findUnique({
        where: { id: newParentId }
      });

      if (!parentPermission) {
        throw new Error(`Parent permission with id ${newParentId} not found`);
      }

      // Prevent circular references
      const wouldCreateCycle = await this.wouldCreateCycle(permissionId, newParentId);
      if (wouldCreateCycle) {
        throw new Error('Cannot set parent: would create circular reference');
      }
    }

    return await this.prisma.permission.update({
      where: { id: permissionId },
      data: { parentPermissionId: newParentId }
    });
  }

  /**
   * Check if setting a parent would create a circular reference
   */
  private async wouldCreateCycle(permissionId: string, potentialParentId: string): Promise<boolean> {
    let currentParentId: string | null = potentialParentId;
    
    while (currentParentId) {
      if (currentParentId === permissionId) {
        return true; // Cycle detected
      }
      
      const parent: Permission | null = await this.prisma.permission.findUnique({
        where: { id: currentParentId }
      });
      
      currentParentId = parent?.parentPermissionId || null;
    }
    
    return false;
  }

  /**
   * Get all permissions with their codes for easy reference
   */
  async getAllPermissions(): Promise<Permission[]> {
    return await this.prisma.permission.findMany({
      orderBy: { code: 'asc' }
    });
  }

  /**
   * Get permission by code
   */
  async getPermissionByCode(code: number): Promise<Permission | null> {
    return await this.prisma.permission.findUnique({
      where: { code }
    });
  }
}

export const permissionService = new PermissionService();