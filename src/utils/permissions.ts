import { Permission } from '@/contexts/AuthContext';

/**
 * Check if a user has a specific permission
 */
export const hasPermission = (userPermissions: Permission[], permissionCode: number): boolean => {
  return userPermissions.some(permission => permission.code === permissionCode);
};

/**
 * Check if a user has any of the specified permissions
 */
export const hasAnyPermission = (userPermissions: Permission[], permissionCodes: number[]): boolean => {
  return permissionCodes.some(code => hasPermission(userPermissions, code));
};

/**
 * Check if a user has all of the specified permissions
 */
export const hasAllPermissions = (userPermissions: Permission[], permissionCodes: number[]): boolean => {
  return permissionCodes.every(code => hasPermission(userPermissions, code));
};

/**
 * Get all permission codes that a user has
 */
export const getUserPermissionCodes = (userPermissions: Permission[]): number[] => {
  return userPermissions.map(permission => permission.code);
};

/**
 * Check if a user has hierarchical permissions (including inherited permissions)
 * This would be used when permission inheritance is implemented
 */
export const hasHierarchicalPermission = (
  userPermissions: Permission[], 
  permissionCode: number,
  allPermissions: Permission[]
): boolean => {
  // First check direct permission
  if (hasPermission(userPermissions, permissionCode)) {
    return true;
  }

  // Check for parent permissions that would grant this permission
  const targetPermission = allPermissions.find(p => p.code === permissionCode);
  if (!targetPermission?.parentPermissionId) {
    return false;
  }

  // Find parent permission and check if user has it
  const parentPermission = allPermissions.find(p => p.id === targetPermission.parentPermissionId);
  if (parentPermission) {
    return hasHierarchicalPermission(userPermissions, parentPermission.code, allPermissions);
  }

  return false;
};

/**
 * Filter navigation items based on user permissions
 */
export const filterNavigationByPermissions = <T extends { permissions: number[] }>(
  items: T[],
  userPermissions: Permission[]
): T[] => {
  return items.filter(item => hasAnyPermission(userPermissions, item.permissions));
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (roleName: string): string => {
  const roleNames: Record<string, string> = {
    'admin': 'Administrator',
    'judge': 'Judge',
    'participant': 'Participant',
  };
  
  return roleNames[roleName.toLowerCase()] || roleName;
};

/**
 * Check if a role has admin privileges
 */
export const isAdminRole = (roleName: string): boolean => {
  return roleName.toLowerCase() === 'admin';
};

/**
 * Check if a role has judge privileges
 */
export const isJudgeRole = (roleName: string): boolean => {
  return roleName.toLowerCase() === 'judge';
};

/**
 * Check if a role has participant privileges
 */
export const isParticipantRole = (roleName: string): boolean => {
  return roleName.toLowerCase() === 'participant';
};