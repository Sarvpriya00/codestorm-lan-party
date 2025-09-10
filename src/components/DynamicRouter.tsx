import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { apiClient as api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import NotFound from '@/pages/NotFound';

const pageComponents: { [key: string]: React.LazyExoticComponent<React.ComponentType<any>> } = {
  Dashboard: lazy(() => import('@/pages/Dashboard')),
  Problems: lazy(() => import('@/pages/Problems')),
  Leaderboard: lazy(() => import('@/pages/Leaderboard')),
  JudgeQueue: lazy(() => import('@/pages/JudgeQueue')),
  MySubmissions: lazy(() => import('@/pages/MySubmissions')),
  AdminUsers: lazy(() => import('@/pages/AdminUsers')),
  AdminAnalytics: lazy(() => import('@/pages/AdminAnalytics')),
  AdminControl: lazy(() => import('@/pages/AdminControl')),
};

interface DynamicRoute {
  path: string;
  component: string;
  requiredPermissions: number[];
}

export const DynamicRouter = () => {
  const [routes, setRoutes] = useState<DynamicRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchRoutes = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await api.get('/dynamic/user/routes-and-permissions');
        setRoutes(response.data.dynamicRoutes);
      } catch (error) {
        console.error('Failed to fetch routes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoutes();
  }, [isAuthenticated]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {routes.map(({ path, component, requiredPermissions }) => {
          const PageComponent = pageComponents[component];
          if (PageComponent) {
            return (
              <Route
                key={path}
                path={path}
                element={
                  <Layout requiredPermissions={requiredPermissions}>
                    <PageComponent />
                  </Layout>
                }
              />
            );
          }
          return null;
        })}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};
