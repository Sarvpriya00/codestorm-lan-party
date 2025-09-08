import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Timer, User, Trophy, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function GlobalHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Mock contest timer - will be replaced with real data later
  const contestTimer = {
    phase: "Running",
    timeLeft: "45:23"
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold bg-gradient-primary bg-clip-text text-transparent">
            CodeStorm
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Contest Timer */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-primary rounded-lg">
          <Timer className="h-4 w-4 text-primary-foreground" />
          <div className="text-sm">
            <span className="text-primary-foreground/80">{contestTimer.phase}</span>
            <span className="mx-2 text-primary-foreground">•</span>
            <span className="font-mono font-semibold text-primary-foreground">
              {contestTimer.timeLeft}
            </span>
          </div>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-auto p-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {user.displayName || user.username}
              </span>
              <Badge variant="secondary" className="text-xs">
                {user.role.name}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user.displayName || user.username}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.role.name} • Score: {user.scored}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}