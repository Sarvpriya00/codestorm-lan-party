import { 
  Home, 
  FileText, 
  Send, 
  Trophy,
  Gavel,
  Settings,
  Users,
  BarChart3,
  FileX,
  Shield,
  Database,
  Activity
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NAVIGATION_ITEMS } from "@/constants/permissions";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// Icon mapping
const iconMap = {
  Home,
  FileText,
  Send,
  Trophy,
  Gavel,
  Settings,
  Users,
  BarChart3,
  FileX,
  Shield,
  Database,
  Activity,
};

// Convert navigation items to array with icon components
const navigationItems = Object.values(NAVIGATION_ITEMS).map(item => ({
  ...item,
  icon: iconMap[item.icon as keyof typeof iconMap] || Home,
}));

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { hasAnyPermission, user } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  // Filter navigation items based on user permissions
  const visibleItems = navigationItems.filter(item => 
    hasAnyPermission([...item.permissions])
  );

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const getNavCls = (path: string) => {
    const active = isActive(path);
    return active 
      ? "bg-sidebar-accent text-sidebar-primary font-medium border-r-2 border-sidebar-primary" 
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground";
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">
            Navigation
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"} 
                      className={getNavCls(item.url)}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Info */}
        {!collapsed && user && (
          <div className="mt-auto p-4 border-t border-sidebar-border">
            <div className="space-y-2">
              <div className="text-sm font-medium text-sidebar-foreground">
                {user.displayName || user.username}
              </div>
              <div className="text-xs text-sidebar-foreground/60">
                Role: {user.role.name}
              </div>
              <div className="flex items-center gap-2 text-xs text-sidebar-foreground/60">
                <Activity className="h-3 w-3 text-accepted animate-pulse" />
                <span>Contest Active</span>
              </div>
              <div className="text-xs text-sidebar-foreground/40">
                LAN Host: 192.168.1.100
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}