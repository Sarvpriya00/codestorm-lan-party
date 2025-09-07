import { useState } from "react";
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

// Mock user role - will come from auth context later
const userRole = "participant";

const participantItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Problems", url: "/problems", icon: FileText },
  { title: "My Submissions", url: "/submissions", icon: Send },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
];

const judgeItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Judge Queue", url: "/judge", icon: Gavel },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
];

const adminItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Problems", url: "/problems", icon: FileText },
  { title: "Judge Queue", url: "/judge", icon: Gavel },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Exports", url: "/admin/exports", icon: FileX },
  { title: "Contest Control", url: "/admin/control", icon: Settings },
  { title: "Audit Log", url: "/admin/audit", icon: Shield },
  { title: "Backup", url: "/admin/backup", icon: Database },
];

const getItemsForRole = (role: string) => {
  switch (role) {
    case "judge":
      return judgeItems;
    case "admin":
      return adminItems;
    default:
      return participantItems;
  }
};

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const items = getItemsForRole(userRole);
  const collapsed = state === "collapsed";

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
              {items.map((item) => (
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

        {/* Status Indicator */}
        {!collapsed && (
          <div className="mt-auto p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-2 text-xs text-sidebar-foreground/60">
              <Activity className="h-3 w-3 text-accepted animate-pulse" />
              <span>Contest Active</span>
            </div>
            <div className="text-xs text-sidebar-foreground/40 mt-1">
              LAN Host: 192.168.1.100
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}