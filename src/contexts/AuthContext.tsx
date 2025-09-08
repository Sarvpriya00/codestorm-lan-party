import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types based on the database schema
export interface Permission {
  id: string;
  code: number;
  name: string;
  description?: string;
  parentPermissionId?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface User {
  id: string;
  username: string;
  displayName?: string;
  roleId: string;
  pcCode?: string;
  ipAddress?: string;
  lastActive?: Date;
  scored: number;
  problemsSolvedCount: number;
  role: Role;
}

export interface AuthContextType {
  user: User | null;
  permissions: Permission[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, pcCode?: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permissionCode: number) => boolean;
  hasAnyPermission: (permissionCodes: number[]) => boolean;
  hasAllPermissions: (permissionCodes: number[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage or API
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          // In a real app, validate token with backend
          // For now, simulate with mock data
          await loadMockUserData();
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        localStorage.removeItem('authToken');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const loadMockUserData = async () => {
    // Mock user data - in real app this would come from API
    const mockUser: User = {
      id: '1',
      username: 'admin_user',
      displayName: 'Administrator',
      roleId: 'admin-role',
      scored: 0,
      problemsSolvedCount: 0,
      role: {
        id: 'admin-role',
        name: 'admin',
        description: 'System Administrator'
      }
    };

    const mockPermissions: Permission[] = [
      { id: '1', code: 100, name: 'Dashboard', description: 'Access dashboard' },
      { id: '2', code: 200, name: 'Problems', description: 'Access problems' },
      { id: '3', code: 210, name: 'View Question', description: 'View question details' },
      { id: '4', code: 220, name: 'Add Submission', description: 'Submit solutions' },
      { id: '5', code: 230, name: 'Total Score', description: 'View total score' },
      { id: '6', code: 300, name: 'Judge Queue', description: 'Access judge queue' },
      { id: '7', code: 310, name: 'View Submission', description: 'View submissions for judging' },
      { id: '8', code: 320, name: 'View Queue List', description: 'View judge queue list' },
      { id: '9', code: 500, name: 'Users', description: 'Manage users' },
      { id: '10', code: 600, name: 'Analytics', description: 'View analytics' },
      { id: '11', code: 700, name: 'Exports', description: 'Export data' },
      { id: '12', code: 800, name: 'Contest Control', description: 'Control contests' },
      { id: '13', code: 810, name: 'Timer Control', description: 'Control contest timer' },
      { id: '14', code: 820, name: 'Phase Control', description: 'Control contest phases' },
      { id: '15', code: 830, name: 'Display Control', description: 'Control display settings' },
      { id: '16', code: 840, name: 'Emergency Actions', description: 'Perform emergency actions' },
      { id: '17', code: 850, name: 'Problem Control', description: 'Control problems' },
      { id: '18', code: 860, name: 'User Control', description: 'Control users' },
      { id: '19', code: 900, name: 'Audit Log', description: 'View audit logs' },
      { id: '20', code: 1000, name: 'Backup', description: 'Manage backups' },
      { id: '21', code: 1100, name: 'Attendance', description: 'Track attendance' }
    ];

    setUser(mockUser);
    setPermissions(mockPermissions);
  };

  const login = async (username: string, password: string, pcCode?: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock login logic - in real app this would call the backend
      if (username && password) {
        const token = 'mock-jwt-token';
        localStorage.setItem('authToken', token);
        await loadMockUserData();
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setPermissions([]);
  };

  const hasPermission = (permissionCode: number): boolean => {
    return permissions.some(permission => permission.code === permissionCode);
  };

  const hasAnyPermission = (permissionCodes: number[]): boolean => {
    return permissionCodes.some(code => hasPermission(code));
  };

  const hasAllPermissions = (permissionCodes: number[]): boolean => {
    return permissionCodes.every(code => hasPermission(code));
  };

  const value: AuthContextType = {
    user,
    permissions,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};