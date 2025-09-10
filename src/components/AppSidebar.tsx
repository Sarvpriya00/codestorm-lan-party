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
import { useState, useEffect } from "react";
import { apiClient as api } from "@/lib/api";

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
const iconMap: { [key: string]: React.ComponentType<{ className: string }> } = {
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

interface NavItem {
  path: string;
  title: string;
  icon: string;
}

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const [navItems, setNavItems] = useState<NavItem[]>([]);

  useEffect(() => {
    const fetchNavItems = async () => {
      try {
        const response = await api.get("/dynamic/user/routes-and-permissions");
        setNavItems(response.data.dynamicRoutes);
      } catch (error) {
        console.error("Failed to fetch navigation items:", error);
      }
    };

    if (user) {
      fetchNavItems();
    }
  }, [user]);

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
              {navItems.map((item) => {
                const Icon = iconMap[item.icon] || Home;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.path} 
                        end={item.path === "/"} 
                        className={getNavCls(item.path)}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
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