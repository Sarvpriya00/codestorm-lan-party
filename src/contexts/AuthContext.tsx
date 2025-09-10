import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient as api } from '@/lib/api';
import websocketService from '@/lib/websocket';

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
          // Token is automatically included in API requests via getAuthHeaders()
          const response = await api.get('/user/me');
          
          // Safely handle response data
          if (response && typeof response === 'object' && 'user' in response) {
            const userData = (response as any).user;
            setUser(userData);
            await fetchPermissions();
            
            // Establish WebSocket connection for authenticated user
            if (!websocketService.isConnected() && userData?.id) {
              try {
                await websocketService.connect(userData.id);
              } catch (wsError) {
                console.warn('WebSocket connection failed during initialization:', wsError);
                // Continue without WebSocket - HTTP API will still work
              }
            }
          } else {
            throw new Error('Invalid response format from /user/me');
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          localStorage.removeItem('authToken');
          websocketService.disconnect();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/dynamic/user/routes-and-permissions');
      
      // Safely handle response data
      if (response && typeof response === 'object' && 'userPermissions' in response) {
        const userPermissions = (response as any).userPermissions;
        setPermissions(Array.isArray(userPermissions) ? userPermissions : []);
      } else {
        console.warn('Invalid permissions response format, using empty permissions');
        setPermissions([]);
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      setPermissions([]);
    }
  };

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    let wsLoginSuccessful = false;
    
    try {
      // First try WebSocket login if connection is available or can be established
      try {
        if (!websocketService.isConnected()) {
          await websocketService.connect();
        }

        // Use WebSocket for login authentication
        const loginResponse = await websocketService.login(username, password);
        console.log('WebSocket login response:', loginResponse);
        
        // Safely handle WebSocket response
        if (loginResponse && typeof loginResponse === 'object') {
          const { token, user, permissions } = loginResponse;
          
          // Validate required fields
          if (!token || !user) {
            throw new Error('Invalid WebSocket login response: missing token or user');
          }
          
          console.log('Destructured token, user, and permissions:', { token, user, permissions });
          
          // Store token (API client will automatically use it via getAuthHeaders())
          localStorage.setItem('authToken', token);
          
          // Set user and permissions from WebSocket response
          setUser(user);
          setPermissions(Array.isArray(permissions) ? permissions : []);
          
          // Authenticate the WebSocket connection with the user ID
          if (user.id) {
            websocketService.authenticate(user.id);
          }
          
          wsLoginSuccessful = true;
        } else {
          throw new Error('Invalid WebSocket login response format');
        }
        
      } catch (wsError) {
        console.error('WebSocket login error:', wsError);
        
        // Fallback to HTTP login if WebSocket fails
        try {
          console.log('Attempting HTTP login fallback...');
          const response = await api.post('/auth/login', { username, password });
          
          // Safely handle HTTP response
          if (response && typeof response === 'object') {
            const responseData = response as any;
            const token = responseData.token || responseData.data?.token;
            const user = responseData.user || responseData.data?.user;
            
            if (!token || !user) {
              throw new Error('Invalid HTTP login response: missing token or user');
            }
            
            // Store token
            localStorage.setItem('authToken', token);
            
            // Set user and fetch permissions separately
            setUser(user);
            await fetchPermissions();
            
            // Try to authenticate WebSocket with the logged-in user if connected
            if (websocketService.isConnected() && user.id) {
              try {
                websocketService.authenticate(user.id);
              } catch (wsAuthError) {
                console.warn('WebSocket authentication failed after HTTP login:', wsAuthError);
                // Continue without WebSocket authentication
              }
            }
            
            console.log('HTTP login fallback successful');
          } else {
            throw new Error('Invalid HTTP login response format');
          }
          
        } catch (httpError) {
          console.error('HTTP login fallback failed:', httpError);
          
          // Clean up any partial state
          localStorage.removeItem('authToken');
          setUser(null);
          setPermissions([]);
          
          // Throw a user-friendly error message
          if (httpError instanceof Error) {
            throw new Error(`Login failed: ${httpError.message}`);
          } else {
            throw new Error('Login failed: Unable to authenticate with server');
          }
        }
      }
      
    } catch (error) {
      // If we haven't already cleaned up, do so now
      if (!wsLoginSuccessful) {
        localStorage.removeItem('authToken');
        setUser(null);
        setPermissions([]);
        websocketService.disconnect();
      }
      
      // Re-throw the error for the UI to handle
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear authentication state
    localStorage.removeItem('authToken');
    setUser(null);
    setPermissions([]);
    
    // Disconnect WebSocket on logout
    websocketService.disconnect();
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
