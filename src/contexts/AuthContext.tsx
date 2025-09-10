import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient as api } from '@/lib/api';

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
  ipAddress?: string;
  lastActive?: Date;
  scored: number;
  problemsSolvedCount: number;
  role: Role;
}

export interface AuthContextType {
  user: User | null;
  permissions: number[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
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
  const [permissions, setPermissions] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.get('/user/me');
          setUser(response.data.user);
          await fetchPermissions();
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          localStorage.removeItem('authToken');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/dynamic/user/routes-and-permissions');
      setPermissions(response.data.userPermissions);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      console.log('Login API response:', response);
      const { token, user } = response.data;
      console.log('Destructured token and user:', { token, user });
      localStorage.setItem('authToken', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      await fetchPermissions();
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setPermissions([]);
  };

  const hasPermission = (permissionCode: number): boolean => {
    return permissions.includes(permissionCode);
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
