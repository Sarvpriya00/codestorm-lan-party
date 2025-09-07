import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Timer, User, Trophy } from "lucide-react";

export function GlobalHeader() {
  // Mock data - will be replaced with real data later
  const user = {
    username: "participant_001",
    role: "participant"
  };
  
  const contestTimer = {
    phase: "Running",
    timeLeft: "45:23"
  };

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

        {/* User Info */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{user.username}</span>
          <Badge variant="secondary" className="text-xs">
            {user.role}
          </Badge>
        </div>
      </div>
    </header>
  );
}