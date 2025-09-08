import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface RoleGuardProps {
  requiredPermissions: number[];
  children: ReactNode;
  fallback?: ReactNode;
  requireAll?: boolean; // If true, user must have ALL permissions. If false, user needs ANY permission.
  showFallback?: boolean; // If true, shows fallback/error message. If false, renders nothing.
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  requiredPermissions,
  children,
  fallback,
  requireAll = false,
  showFallback = true
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated) {
    if (!showFallback) return null;
    
    return fallback || (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You must be logged in to access this content.
        </AlertDescription>
      </Alert>
    );
  }

  // Check permissions
  const hasRequiredPermissions = requireAll 
    ? hasAllPermissions(requiredPermissions)
    : hasAnyPermission(requiredPermissions);

  if (!hasRequiredPermissions) {
    if (!showFallback) return null;
    
    return fallback || (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to access this content.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};

// Convenience wrapper for single permission checks
interface PermissionGuardProps {
  permission: number;
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback,
  showFallback = true
}) => {
  return (
    <RoleGuard
      requiredPermissions={[permission]}
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </RoleGuard>
  );
};

// Hook for conditional rendering based on permissions
export const usePermissionCheck = () => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess: (permissions: number[], requireAll = false) => {
      return requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
    }
  };
};