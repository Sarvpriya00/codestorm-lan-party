import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, Square, Clock, Settings, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function AdminControl() {
  const [contestPhase, setContestPhase] = useState("Running");
  const [showPendingPoints, setShowPendingPoints] = useState(true);
  const [emergencyPause, setEmergencyPause] = useState(false);
  
  const timeProgress = 65; // 65% of contest time elapsed
  const timeRemaining = "21:15";

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "Setup": return "secondary";
      case "Reading": return "default";
      case "Running": return "default";
      case "Locked": return "destructive";
      case "Results": return "outline";
      default: return "secondary";
    }
  };

  const phases = ["Setup", "Reading", "Running", "Locked", "Results"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Contest Control
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage contest lifecycle and settings
          </p>
        </div>
        
        <Badge variant={getPhaseColor(contestPhase)} className="text-lg px-4 py-2">
          {contestPhase} Phase
        </Badge>
      </div>

      {/* Contest Timer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Contest Timer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-mono font-bold">{timeRemaining}</span>
              <span className="text-muted-foreground">Time Remaining</span>
            </div>
            <Progress value={timeProgress} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Started: 13:00</span>
              <span>End: 14:00</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Phase Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3">
            {phases.map((phase, index) => (
              <div key={phase} className="text-center space-y-2">
                <div className={`h-8 w-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold ${
                  phase === contestPhase 
                    ? 'bg-primary text-primary-foreground' 
                    : index < phases.indexOf(contestPhase)
                    ? 'bg-accepted text-white'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                <span className="text-sm font-medium">{phase}</span>
                <Button 
                  variant={phase === contestPhase ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                  disabled={phase === contestPhase}
                >
                  {phase === contestPhase ? "Active" : "Start"}
                </Button>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Current Phase:</strong> {contestPhase} - Participants can submit solutions and judges can review submissions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contest Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Display Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Show Pending Points on Leaderboard</p>
              <p className="text-sm text-muted-foreground">
                Participants can see points for submissions under review
              </p>
            </div>
            <Switch 
              checked={showPendingPoints}
              onCheckedChange={setShowPendingPoints}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Emergency Pause</p>
              <p className="text-sm text-muted-foreground">
                Temporarily prevent new submissions without ending contest
              </p>
            </div>
            <Switch 
              checked={emergencyPause}
              onCheckedChange={setEmergencyPause}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Emergency Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Button variant="outline" className="h-16 flex-col">
              <Pause className="h-6 w-6 mb-2" />
              Pause Contest
            </Button>
            
            <Button variant="outline" className="h-16 flex-col">
              <Play className="h-6 w-6 mb-2" />
              Resume Contest
            </Button>
            
            <Button variant="destructive" className="h-16 flex-col">
              <Square className="h-6 w-6 mb-2" />
              Force End
            </Button>
          </div>
          
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              <strong>Warning:</strong> Emergency actions will immediately affect all participants. Use with caution.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}