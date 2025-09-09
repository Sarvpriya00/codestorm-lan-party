import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { GlobalHeader } from "@/components/GlobalHeader";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
  requiredPermissions?: number[];
  requireAll?: boolean;
}

export function Layout({ children, requiredPermissions, requireAll = false }: LayoutProps) {
  const { isAuthenticated, isLoading, hasAnyPermission, hasAllPermissions } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background font-sans flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
            <div className="absolute inset-0 rounded-full h-12 w-12 border-4 border-transparent border-t-primary/50 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-foreground">CodeStorm</p>
            <p className="text-sm text-muted-foreground">Loading contest platform...</p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check permissions if required
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPermission = requireAll 
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasPermission) {
      return (
        <div className="min-h-screen bg-background font-sans flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md mx-auto p-6">
            <div className="text-6xl mb-4">🚫</div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
              <p className="text-muted-foreground">
                You don't have permission to access this page. Please contact the contest administrator if you believe this is an error.
              </p>
            </div>
            <div className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
              Required permissions: {requiredPermissions.join(', ')}
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <GlobalHeader />
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}