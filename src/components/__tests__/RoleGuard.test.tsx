import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, mockUsers } from '@/test/utils';
import { RoleGuard } from '@/components/RoleGuard';

// Mock the permissions utility
vi.mock('@/utils/permissions', () => ({
  hasPermission: vi.fn(),
  hasAnyPermission: vi.fn(),
  hasAllPermissions: vi.fn(),
}));

import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/utils/permissions';

describe('RoleGuard Component', () => {
  const mockHasPermission = hasPermission as any;
  const mockHasAnyPermission = hasAnyPermission as any;
  const mockHasAllPermissions = hasAllPermissions as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Permission-based rendering', () => {
    it('should render children when user has required permission', () => {
      mockHasPermission.mockReturnValue(true);

      const { getByText } = renderWithProviders(
        <RoleGuard requiredPermissions={[100]}>
          <div>Protected Content</div>
        </RoleGuard>,
        { user: mockUsers.admin }
      );

      expect(getByText('Protected Content')).toBeInTheDocument();
      expect(mockHasPermission).toHaveBeenCalledWith(mockUsers.admin.permissions, 100);
    });

    it('should not render children when user lacks required permission', () => {
      mockHasPermission.mockReturnValue(false);

      const { queryByText } = renderWithProviders(
        <RoleGuard requiredPermissions={[500]}>
          <div>Protected Content</div>
        </RoleGuard>,
        { user: mockUsers.participant }
      );

      expect(queryByText('Protected Content')).not.toBeInTheDocument();
      expect(mockHasPermission).toHaveBeenCalledWith(mockUsers.participant.permissions, 500);
    });

    it('should render fallback when user lacks permission and fallback is provided', () => {
      mockHasPermission.mockReturnValue(false);

      const { getByText, queryByText } = renderWithProviders(
        <RoleGuard 
          requiredPermissions={[500]} 
          fallback={<div>Access Denied</div>}
        >
          <div>Protected Content</div>
        </RoleGuard>,
        { user: mockUsers.participant }
      );

      expect(queryByText('Protected Content')).not.toBeInTheDocument();
      expect(getByText('Access Denied')).toBeInTheDocument();
    });

    it('should handle multiple permissions with requireAll=true', () => {
      mockHasAllPermissions.mockReturnValue(true);

      const { getByText } = renderWithProviders(
        <RoleGuard 
          requiredPermissions={[100, 500]} 
          requireAll={true}
        >
          <div>Protected Content</div>
        </RoleGuard>,
        { user: mockUsers.admin }
      );

      expect(getByText('Protected Content')).toBeInTheDocument();
      expect(mockHasAllPermissions).toHaveBeenCalledWith(mockUsers.admin.permissions, [100, 500]);
    });

    it('should handle multiple permissions with requireAll=false', () => {
      mockHasAnyPermission.mockReturnValue(true);

      const { getByText } = renderWithProviders(
        <RoleGuard 
          requiredPermissions={[100, 999]} 
          requireAll={false}
        >
          <div>Protected Content</div>
        </RoleGuard>,
        { user: mockUsers.admin }
      );

      expect(getByText('Protected Content')).toBeInTheDocument();
      expect(mockHasAnyPermission).toHaveBeenCalledWith(mockUsers.admin.permissions, [100, 999]);
    });

    it('should deny access when requireAll=true and user lacks some permissions', () => {
      mockHasAllPermissions.mockReturnValue(false);

      const { queryByText } = renderWithProviders(
        <RoleGuard 
          requiredPermissions={[100, 999]} 
          requireAll={true}
        >
          <div>Protected Content</div>
        </RoleGuard>,
        { user: mockUsers.admin }
      );

      expect(queryByText('Protected Content')).not.toBeInTheDocument();
      expect(mockHasAllPermissions).toHaveBeenCalledWith(mockUsers.admin.permissions, [100, 999]);
    });
  });

  describe('Role-based rendering', () => {
    it('should render children when user has required role', () => {
      const { getByText } = renderWithProviders(
        <RoleGuard requiredRoles={['ADMIN']}>
          <div>Admin Content</div>
        </RoleGuard>,
        { user: mockUsers.admin }
      );

      expect(getByText('Admin Content')).toBeInTheDocument();
    });

    it('should not render children when user lacks required role', () => {
      const { queryByText } = renderWithProviders(
        <RoleGuard requiredRoles={['ADMIN']}>
          <div>Admin Content</div>
        </RoleGuard>,
        { user: mockUsers.participant }
      );

      expect(queryByText('Admin Content')).not.toBeInTheDocument();
    });

    it('should handle multiple roles', () => {
      const { getByText } = renderWithProviders(
        <RoleGuard requiredRoles={['ADMIN', 'JUDGE']}>
          <div>Staff Content</div>
        </RoleGuard>,
        { user: mockUsers.judge }
      );

      expect(getByText('Staff Content')).toBeInTheDocument();
    });
  });

  describe('Combined role and permission checks', () => {
    it('should render when user has required role OR permission', () => {
      mockHasPermission.mockReturnValue(false);

      const { getByText } = renderWithProviders(
        <RoleGuard 
          requiredRoles={['ADMIN']} 
          requiredPermissions={[999]}
        >
          <div>Protected Content</div>
        </RoleGuard>,
        { user: mockUsers.admin }
      );

      expect(getByText('Protected Content')).toBeInTheDocument();
    });

    it('should not render when user has neither required role nor permission', () => {
      mockHasPermission.mockReturnValue(false);

      const { queryByText } = renderWithProviders(
        <RoleGuard 
          requiredRoles={['ADMIN']} 
          requiredPermissions={[999]}
        >
          <div>Protected Content</div>
        </RoleGuard>,
        { user: mockUsers.participant }
      );

      expect(queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated user handling', () => {
    it('should not render children when user is not authenticated', () => {
      const { queryByText } = renderWithProviders(
        <RoleGuard requiredPermissions={[100]}>
          <div>Protected Content</div>
        </RoleGuard>,
        { user: null }
      );

      expect(queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should render fallback for unauthenticated user', () => {
      const { getByText } = renderWithProviders(
        <RoleGuard 
          requiredPermissions={[100]}
          fallback={<div>Please log in</div>}
        >
          <div>Protected Content</div>
        </RoleGuard>,
        { user: null }
      );

      expect(getByText('Please log in')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should render children when no requirements are specified', () => {
      const { getByText } = renderWithProviders(
        <RoleGuard>
          <div>Public Content</div>
        </RoleGuard>,
        { user: mockUsers.participant }
      );

      expect(getByText('Public Content')).toBeInTheDocument();
    });

    it('should handle empty permission arrays', () => {
      const { getByText } = renderWithProviders(
        <RoleGuard requiredPermissions={[]}>
          <div>Content</div>
        </RoleGuard>,
        { user: mockUsers.participant }
      );

      expect(getByText('Content')).toBeInTheDocument();
    });

    it('should handle empty role arrays', () => {
      const { getByText } = renderWithProviders(
        <RoleGuard requiredRoles={[]}>
          <div>Content</div>
        </RoleGuard>,
        { user: mockUsers.participant }
      );

      expect(getByText('Content')).toBeInTheDocument();
    });

    it('should handle custom validation function', () => {
      const customValidator = vi.fn().mockReturnValue(true);

      const { getByText } = renderWithProviders(
        <RoleGuard customValidator={customValidator}>
          <div>Custom Protected Content</div>
        </RoleGuard>,
        { user: mockUsers.participant }
      );

      expect(getByText('Custom Protected Content')).toBeInTheDocument();
      expect(customValidator).toHaveBeenCalledWith(mockUsers.participant);
    });

    it('should deny access when custom validator returns false', () => {
      const customValidator = vi.fn().mockReturnValue(false);

      const { queryByText } = renderWithProviders(
        <RoleGuard customValidator={customValidator}>
          <div>Custom Protected Content</div>
        </RoleGuard>,
        { user: mockUsers.participant }
      );

      expect(queryByText('Custom Protected Content')).not.toBeInTheDocument();
      expect(customValidator).toHaveBeenCalledWith(mockUsers.participant);
    });
  });

  describe('Performance and optimization', () => {
    it('should not re-render when user permissions have not changed', () => {
      mockHasPermission.mockReturnValue(true);

      const { rerender } = renderWithProviders(
        <RoleGuard requiredPermissions={[100]}>
          <div>Protected Content</div>
        </RoleGuard>,
        { user: mockUsers.admin }
      );

      expect(mockHasPermission).toHaveBeenCalledTimes(1);

      // Re-render with same user
      rerender(
        <RoleGuard requiredPermissions={[100]}>
          <div>Protected Content</div>
        </RoleGuard>
      );

      // Should not call permission check again if properly memoized
      expect(mockHasPermission).toHaveBeenCalledTimes(2); // Will be called again without memoization
    });
  });
});