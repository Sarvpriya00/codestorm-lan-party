import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Trophy,
  User,
  Lock,
  Wifi,
  Monitor,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pcCode, setPcCode] = useState("");
  const [error, setError] = useState("");
  
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(username, password, pcCode);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl shadow-glow">
            <Trophy className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              CodeStorm 2024
            </h1>
            <p className="text-muted-foreground">
              Offline Coding Contest Platform
            </p>
          </div>
        </div>

        {/* System Info */}
        <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wifi className="h-4 w-4 text-accepted" />
                <span>LAN Connected</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Monitor className="h-4 w-4 text-primary" />
                <span>Host: 192.168.1.100</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Login Form */}
        <Card className="bg-gradient-card border-border/50 shadow-card">
          <CardHeader className="text-center">
            <CardTitle>Login to Contest</CardTitle>
            <CardDescription>
              Use your printed credentials to access the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="participant_001"
                  className="font-mono"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="font-mono"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pcCode" className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  PC Access Code
                  <span className="text-xs text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="pcCode"
                  type="text"
                  value={pcCode}
                  onChange={(e) => setPcCode(e.target.value)}
                  placeholder="PC-001"
                  className="font-mono"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                variant="hero"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Enter Contest"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-muted/20 border-border/30">
          <CardContent className="p-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">First time logging in?</p>
              <ul className="space-y-1 text-xs">
                <li>• Use credentials from your printed slip</li>
                <li>• PC code will be auto-detected if required</li>
                <li>• Your IP address will be logged for security</li>
                <li>• Contest rules apply once logged in</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>CodeStorm Contest Platform v1.0</p>
          <p>Offline Mode • No Internet Required</p>
        </div>
      </div>
    </div>
  );
}