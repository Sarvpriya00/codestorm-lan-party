import { User } from '@/contexts/AuthContext';

export interface RouteConfig {
  path: string;
  component: string;
  title: string;
  icon: string;
  requiredPermissions: number[];
  isDefault?: boolean;
  priority?: number;
}

export class NavigationService {
  /**
   * Determines the default route for a user based on their permissions and role
   */
  static determineDefaultRoute(userPermissions: number[], availableRoutes: RouteConfig[]): string {
    // Filter routes the user can access
    const accessibleRoutes = availableRoutes.filter(route =>
      route.requiredPermissions.every(permission => userPermissions.includes(permission))
    );

    if (accessibleRoutes.length === 0) {
      return '/login'; // Fallback if no accessible routes
    }

    // Priority-based route selection for different user types
    
    // Admin users (permission 500+) - go to admin control
    if (userPermissions.includes(800)) {
      const adminRoute = accessibleRoutes.find(r => r.path === '/admin/control');
      if (adminRoute) return adminRoute.path;
    }
    
    // Admin users with user management (permission 500) - go to admin users
    if (userPermissions.includes(500)) {
      const adminUsersRoute = accessibleRoutes.find(r => r.path === '/admin/users');
      if (adminUsersRoute) return adminUsersRoute.path;
    }

    // Judge users (permission 300) - go to judge queue
    if (userPermissions.includes(300)) {
      const judgeRoute = accessibleRoutes.find(r => r.path === '/judge');
      if (judgeRoute) return judgeRoute.path;
    }

    // Participants (permission 200) - go to problems
    if (userPermissions.includes(200)) {
      const problemsRoute = accessibleRoutes.find(r => r.path === '/problems');
      if (problemsRoute) return problemsRoute.path;
    }

    // Fallback to dashboard if available
    const dashboardRoute = accessibleRoutes.find(r => r.path === '/');
    if (dashboardRoute) return dashboardRoute.path;

    // Final fallback to first accessible route
    return accessibleRoutes[0].path;
  }

  /**
   * Validates if a user can access a specific route
   */
  static validateRouteAccess(path: string, userPermissions: number[], availableRoutes: RouteConfig[]): boolean {
    const route = availableRoutes.find(r => r.path === path);
    if (!route) return false;
    
    return route.requiredPermissions.every(permission => userPermissions.includes(permission));
  }

  /**
   * Gets user-friendly role name based on permissions
   */
  static getUserRoleType(permissions: number[]): 'admin' | 'judge' | 'participant' | 'viewer' {
    if (permissions.includes(500)) return 'admin';
    if (permissions.includes(300)) return 'judge';
    if (permissions.includes(200)) return 'participant';
    return 'viewer';
  }

  /**
   * Gets accessible routes for a user
   */
  static getAccessibleRoutes(userPermissions: number[], allRoutes: RouteConfig[]): RouteConfig[] {
    return allRoutes.filter(route =>
      route.requiredPermissions.every(permission => userPermissions.includes(permission))
    );
  }
}