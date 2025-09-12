import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { NavigationService, RouteConfig } from '@/lib/navigationService';
import { apiClient as api } from '@/lib/api';

interface NavigationContextType {
  availableRoutes: RouteConfig[];
  defaultRoute: string;
  currentRoute: string;
  isLoading: boolean;
  navigateToDefault: () => void;
  isValidRoute: (path: string) => boolean;
  getUserRoleType: () => 'admin' | 'judge' | 'participant' | 'viewer';
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [availableRoutes, setAvailableRoutes] = useState<RouteConfig[]>([]);
  const [defaultRoute, setDefaultRoute] = useState<string>('/');
  const [isLoading, setIsLoading] = useState(true);
  
  const { isAuthenticated, permissions, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchRoutes = async () => {
      if (!isAuthenticated) {
        setAvailableRoutes([]);
        setDefaultRoute('/login');
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get<{ dynamicRoutes: RouteConfig[] }>('/dynamic/user/routes-and-permissions');
        const routes = response.dynamicRoutes || [];
        
        setAvailableRoutes(routes);
        
        const determinedDefaultRoute = NavigationService.determineDefaultRoute(permissions, routes);
        setDefaultRoute(determinedDefaultRoute);
        
        // If user is on root path or invalid path, redirect to default
        if (location.pathname === '/' || !NavigationService.validateRouteAccess(location.pathname, permissions, routes)) {
          navigate(determinedDefaultRoute, { replace: true });
        }
      } catch (error) {
        console.error('Failed to fetch routes:', error);
        setAvailableRoutes([]);
        setDefaultRoute('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoutes();
  }, [isAuthenticated, permissions, navigate, location.pathname]);

  const navigateToDefault = () => {
    navigate(defaultRoute, { replace: true });
  };

  const isValidRoute = (path: string): boolean => {
    return NavigationService.validateRouteAccess(path, permissions, availableRoutes);
  };

  const getUserRoleType = () => {
    return NavigationService.getUserRoleType(permissions);
  };

  const value: NavigationContextType = {
    availableRoutes,
    defaultRoute,
    currentRoute: location.pathname,
    isLoading,
    navigateToDefault,
    isValidRoute,
    getUserRoleType
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};