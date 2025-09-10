import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Play, Pause, Square, Clock, Settings, AlertTriangle, Eye, EyeOff, Shield, Users, FileText, Calendar, Server } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ContestManagement } from "@/components/ContestManagement";
import { SystemControl } from "@/components/SystemControl";
import { apiClient } from "@/lib/api";

interface Contest {
  id: string;
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  status: string;
  participants: number;
  problems: number;
  totalSubmissions: number;
}

export function AdminControl() {
  const [contest, setContest] = useState<Contest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contestPhase, setContestPhase] = useState("RUNNING");
  const [showPendingPoints, setShowPendingPoints] = useState(true);
  const [emergencyPause, setEmergencyPause] = useState(false);
  const [isEmergencyDialogOpen, setIsEmergencyDialogOpen] = useState(false);
  
  const { hasPermission } = useAuth();

  useEffect(() => {
    const fetchActiveContest = async () => {
      try {
        const response = await apiClient.get("/contests/active");
        setContest((response as any)[0]);
      } catch (error) {
        console.error("Failed to fetch active contest:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveContest();
  }, []);
  
  const timeProgress = 65; // 65% of contest time elapsed
  const timeRemaining = "21:15";

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "PLANNED": return "secondary";
      case "RUNNING": return "default";
      case "ENDED": return "destructive";
      case "ARCHIVED": return "outline";
      default: return "secondary";
    }
  };

  const phases = [
    { key: "PLANNED", label: "Setup", description: "Contest preparation phase" },
    { key: "RUNNING", label: "Active", description: "Contest is running" },
    { key: "ENDED", label: "Ended", description: "Contest has ended" },
    { key: "ARCHIVED", label: "Archived", description: "Contest archived" }
  ];

  const handlePhaseChange = (newPhase: string) => {
    // In real app, this would call API to update contest phase
    setContestPhase(newPhase);
    console.log('Phase changed to:', newPhase);
  };

  const handleEmergencyAction = (action: string) => {
    // In real app, this would call API for emergency actions
    console.log('Emergency action:', action);
    setIsEmergencyDialogOpen(false);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!contest) {
    return <div>No active contest found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Admin Control Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive system and contest management
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant={getPhaseColor(contestPhase)} className="text-lg px-4 py-2">
            {phases.find(p => p.key === contestPhase)?.label || contestPhase} Phase
          </Badge>
          <div className="text-sm text-muted-foreground">
            {contest.name}
          </div>
        </div>
      </div>

      <Tabs defaultValue="contest-control" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contest-control" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Contest Control
          </TabsTrigger>
          <TabsTrigger value="contest-management" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Contest Management
          </TabsTrigger>
          <TabsTrigger value="system-control" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            System Control
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contest-control" className="space-y-6">

      {/* Contest Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Participants</p>
                <p className="text-2xl font-bold">{contest.participants}</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Problems</p>
                <p className="text-2xl font-bold">{contest.problems}</p>
              </div>
              <FileText className="h-8 w-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Submissions</p>
                <p className="text-2xl font-bold">{contest.totalSubmissions}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                <span className="text-sm font-bold">S</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Time Left</p>
                <p className="text-2xl font-bold font-mono">{timeRemaining}</p>
              </div>
              <Clock className="h-8 w-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
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
              <span>Started: {new Date(contest.startTime).toLocaleTimeString()}</span>
              <span>End: {new Date(contest.endTime).toLocaleTimeString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Control */}
      {hasPermission(820) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Phase Control
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {phases.map((phase, index) => (
                <div key={phase.key} className="text-center space-y-2">
                  <div className={`h-8 w-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold ${
                    phase.key === contestPhase 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium">{phase.label}</span>
                  <Button 
                    variant={phase.key === contestPhase ? "default" : "outline"}
                    size="sm"
                    className="w-full"
                    disabled={phase.key === contestPhase}
                    onClick={() => handlePhaseChange(phase.key)}
                  >
                    {phase.key === contestPhase ? "Active" : "Start"}
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Current Phase:</strong> {phases.find(p => p.key === contestPhase)?.description || 'Unknown phase'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contest Settings */}
      {hasPermission(830) && (
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
      )}

      {/* Emergency Actions */}
      {hasPermission(840) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Emergency Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-16 flex-col">
                    <Pause className="h-6 w-6 mb-2" />
                    Pause Contest
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Pause Contest</DialogTitle>
                    <DialogDescription>
                      This will temporarily pause the contest. Participants will not be able to submit solutions.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {}}>Cancel</Button>
                    <Button onClick={() => handleEmergencyAction('pause')}>Pause Contest</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-16 flex-col">
                    <Play className="h-6 w-6 mb-2" />
                    Resume Contest
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Resume Contest</DialogTitle>
                    <DialogDescription>
                      This will resume the contest. Participants will be able to submit solutions again.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {}}>Cancel</Button>
                    <Button onClick={() => handleEmergencyAction('resume')}>Resume Contest</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isEmergencyDialogOpen} onOpenChange={setIsEmergencyDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="h-16 flex-col">
                    <Square className="h-6 w-6 mb-2" />
                    Force End
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Force End Contest</DialogTitle>
                    <DialogDescription>
                      This will immediately end the contest. This action cannot be undone. All submissions will be locked and results will be finalized.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEmergencyDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={() => handleEmergencyAction('force_end')}>
                      Force End Contest
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                <strong>Warning:</strong> Emergency actions will immediately affect all participants. Use with caution.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="contest-management">
          <ContestManagement />
        </TabsContent>

        <TabsContent value="system-control">
          <SystemControl />
        </TabsContent>
      </Tabs>
    </div>
  );
}