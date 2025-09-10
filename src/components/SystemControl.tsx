import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Server, 
  Database, 
  Wifi, 
  Monitor, 
  AlertTriangle, 
  Settings, 
  Power,
  RefreshCw,
  Shield,
  Clock
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SystemStatus {
  server: "online" | "offline" | "maintenance";
  database: "connected" | "disconnected" | "error";
  network: "stable" | "unstable" | "offline";
  storage: number; // percentage used
  memory: number; // percentage used
  uptime: string;
}

export function SystemControl() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    server: "online",
    database: "connected", 
    network: "stable",
    storage: 45,
    memory: 68,
    uptime: "2d 14h 32m"
  });

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [isRestartDialogOpen, setIsRestartDialogOpen] = useState(false);
  const { hasPermission } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
      case "connected":
      case "stable":
        return "default";
      case "offline":
      case "disconnected":
      case "error":
        return "destructive";
      case "maintenance":
      case "unstable":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (type: string, status: string) => {
    const iconClass = "h-5 w-5";
    switch (type) {
      case "server":
        return <Server className={iconClass} />;
      case "database":
        return <Database className={iconClass} />;
      case "network":
        return <Wifi className={iconClass} />;
      default:
        return <Monitor className={iconClass} />;
    }
  };

  const handleSystemRestart = () => {
    // In real app, this would call API to restart system
    console.log('System restart initiated');
    setIsRestartDialogOpen(false);
  };

  const handleEmergencyShutdown = () => {
    // In real app, this would call API for emergency shutdown
    console.log('Emergency shutdown initiated');
  };

  const handleClearCache = () => {
    // In real app, this would call API to clear system cache
    console.log('System cache cleared');
  };

  const handleDatabaseMaintenance = () => {
    // In real app, this would call API for database maintenance
    console.log('Database maintenance started');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Control</h2>
          <p className="text-muted-foreground">
            Monitor and control system operations
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={getStatusColor(systemStatus.server)} className="px-3 py-1">
            System {systemStatus.server}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Uptime: {systemStatus.uptime}
          </span>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon("server", systemStatus.server)}
                <div>
                  <p className="font-medium">Server</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {systemStatus.server}
                  </p>
                </div>
              </div>
              <Badge variant={getStatusColor(systemStatus.server)}>
                {systemStatus.server}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon("database", systemStatus.database)}
                <div>
                  <p className="font-medium">Database</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {systemStatus.database}
                  </p>
                </div>
              </div>
              <Badge variant={getStatusColor(systemStatus.database)}>
                {systemStatus.database}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon("network", systemStatus.network)}
                <div>
                  <p className="font-medium">Network</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {systemStatus.network}
                  </p>
                </div>
              </div>
              <Badge variant={getStatusColor(systemStatus.network)}>
                {systemStatus.network}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Storage Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Used</span>
                <span>{systemStatus.storage}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${systemStatus.storage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {systemStatus.storage < 80 ? "Storage levels normal" : "Storage levels high"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Used</span>
                <span>{systemStatus.memory}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    systemStatus.memory > 80 ? 'bg-destructive' : 'bg-primary'
                  }`}
                  style={{ width: `${systemStatus.memory}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {systemStatus.memory < 80 ? "Memory levels normal" : "Memory levels high"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Settings */}
      {hasPermission(840) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Maintenance Mode</p>
                <p className="text-sm text-muted-foreground">
                  Prevent new user logins and submissions
                </p>
              </div>
              <Switch 
                checked={maintenanceMode}
                onCheckedChange={setMaintenanceMode}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Automatic Backups</p>
                <p className="text-sm text-muted-foreground">
                  Automatically backup system data every hour
                </p>
              </div>
              <Switch 
                checked={autoBackup}
                onCheckedChange={setAutoBackup}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Debug Mode</p>
                <p className="text-sm text-muted-foreground">
                  Enable detailed logging and error reporting
                </p>
              </div>
              <Switch 
                checked={debugMode}
                onCheckedChange={setDebugMode}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Actions */}
      {hasPermission(840) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Power className="h-5 w-5" />
              System Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-16 flex-col"
                onClick={handleClearCache}
              >
                <RefreshCw className="h-6 w-6 mb-2" />
                Clear Cache
              </Button>
              
              <Button 
                variant="outline" 
                className="h-16 flex-col"
                onClick={handleDatabaseMaintenance}
              >
                <Database className="h-6 w-6 mb-2" />
                DB Maintenance
              </Button>
              
              <Dialog open={isRestartDialogOpen} onOpenChange={setIsRestartDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="h-16 flex-col">
                    <Power className="h-6 w-6 mb-2" />
                    Restart System
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Restart System</DialogTitle>
                    <DialogDescription>
                      This will restart the entire system. All users will be disconnected and the contest will be temporarily unavailable.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <div className="space-y-2">
                      <Label htmlFor="restart-reason">Reason for restart</Label>
                      <Input 
                        id="restart-reason" 
                        placeholder="System maintenance, updates, etc."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRestartDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="secondary" onClick={handleSystemRestart}>
                      Restart System
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="h-16 flex-col">
                    <AlertTriangle className="h-6 w-6 mb-2" />
                    Emergency Stop
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Emergency System Shutdown</DialogTitle>
                    <DialogDescription>
                      This will immediately shut down the system. This action should only be used in emergency situations. All data will be preserved but users will lose connection immediately.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {}}>Cancel</Button>
                    <Button variant="destructive" onClick={handleEmergencyShutdown}>
                      Emergency Shutdown
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                <strong>Warning:</strong> System actions will affect all users and contest operations. Use with extreme caution.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Logs Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Recent System Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>2025-01-15 14:32:15</span>
              <span>INFO</span>
              <span>System startup completed successfully</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>2025-01-15 14:30:42</span>
              <span>INFO</span>
              <span>Database connection established</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>2025-01-15 14:30:01</span>
              <span>INFO</span>
              <span>Contest service initialized</span>
            </div>
            <div className="flex items-center gap-2 text-accepted">
              <Clock className="h-3 w-3" />
              <span>2025-01-15 14:29:45</span>
              <span>INFO</span>
              <span>User authentication service started</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}