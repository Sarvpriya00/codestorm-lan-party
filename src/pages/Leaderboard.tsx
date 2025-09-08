import { useState, useEffect, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy,
  Medal,
  Award, 
  Crown,
  Maximize,
  Eye,
  EyeOff,
  Timer,
  Wifi,
  WifiOff
} from "lucide-react";
import { AuthContext } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import websocketService from "@/lib/websocket";

interface LeaderboardEntry {
  id: string;
  contestId: string;
  userId: string;
  rank: number;
  score: number;
  problemsSolved: number;
  lastSubmissionTime: string | null;
  user: {
    username: string;
    displayName?: string;
  };
}

interface Contest {
  id: string;
  name: string;
  status: 'PLANNED' | 'RUNNING' | 'ENDED' | 'ARCHIVED';
  startTime: string | null;
  endTime: string | null;
}

export function Leaderboard() {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [contest, setContest] = useState<Contest | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useContext(AuthContext);

  // Get current contest and leaderboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current contest (assuming there's an active contest)
        const contestsResponse = await api.get('/contests?status=RUNNING');
        const contests = contestsResponse.data;
        
        if (contests.length === 0) {
          setError('No active contest found');
          return;
        }

        const currentContest = contests[0];
        setContest(currentContest);

        // Get leaderboard for the contest
        const leaderboardResponse = await api.get(`/analytics/leaderboard/${currentContest.id}`);
        setLeaderboard(leaderboardResponse.data);

      } catch (err) {
        console.error('Error fetching leaderboard data:', err);
        setError('Failed to load leaderboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // WebSocket connection and real-time updates
  useEffect(() => {
    if (!user || !contest) return;

    const connectWebSocket = async () => {
      try {
        await websocketService.connect(user.id);
        websocketService.joinContest(contest.id);
        setIsConnected(true);

        // Handle leaderboard updates
        websocketService.onLeaderboardUpdate((updatedLeaderboard: LeaderboardEntry[]) => {
          console.log('Received leaderboard update:', updatedLeaderboard);
          setLeaderboard(updatedLeaderboard);
        });

        // Handle contest phase changes
        websocketService.onContestPhaseChange((updatedContest: Contest) => {
          console.log('Contest phase changed:', updatedContest);
          setContest(updatedContest);
        });

      } catch (error) {
        console.error('WebSocket connection failed:', error);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      websocketService.leaveContest();
      websocketService.disconnect();
      setIsConnected(false);
    };
  }, [user, contest]);

  const formatTimeAgo = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const submissionTime = new Date(timestamp);
    const diffMs = now.getTime() - submissionTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getContestTimeRemaining = () => {
    if (!contest?.endTime) return 'No time limit';
    
    const now = new Date();
    const endTime = new Date(contest.endTime);
    const diffMs = endTime.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Contest ended';
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <Trophy className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/50";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-orange-500/20 border-amber-600/50";
      default:
        return "bg-gradient-card border-border/50";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to Load Leaderboard</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const maxPoints = Math.max(...leaderboard.map(entry => entry.score), 1);

  return (
    <div className={`space-y-6 ${isFullScreen ? 'fixed inset-0 bg-background z-50 p-6 overflow-auto' : ''}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            Live Leaderboard
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
          </h1>
          <p className="text-muted-foreground">
            {contest?.name || 'Contest'} • Real-time rankings
            {isConnected ? ' • Connected' : ' • Disconnected'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullScreen(!isFullScreen)}
          >
            <Maximize className="h-4 w-4 mr-2" />
            {isFullScreen ? "Exit" : "Fullscreen"}
          </Button>
        </div>
      </div>

      {/* Contest Status */}
      {contest && (
        <Card className="bg-gradient-primary text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Timer className="h-6 w-6" />
                <div>
                  <h3 className="text-lg font-semibold">
                    {contest.status === 'RUNNING' ? 'Contest Running' : 
                     contest.status === 'PLANNED' ? 'Contest Planned' :
                     contest.status === 'ENDED' ? 'Contest Ended' : 'Contest Archived'}
                  </h3>
                  <p className="text-primary-foreground/80">
                    {contest.status === 'RUNNING' ? `Time Remaining: ${getContestTimeRemaining()}` :
                     contest.status === 'PLANNED' ? 'Starting soon' :
                     'Contest has ended'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-primary-foreground/80">Total Participants</p>
                <p className="text-2xl font-bold">{leaderboard.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <div className="space-y-3">
        {leaderboard.length === 0 ? (
          <Card className="bg-muted/50">
            <CardContent className="p-12 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No participants yet</h3>
              <p className="text-muted-foreground">
                The leaderboard will update as participants submit solutions.
              </p>
            </CardContent>
          </Card>
        ) : (
          leaderboard.map((entry) => {
            const progressPercentage = (entry.score / maxPoints) * 100;
            
            return (
              <Card key={entry.id} className={`${getRankStyle(entry.rank)} hover:scale-[1.02] transition-all duration-200`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    {/* Rank */}
                    <div className="flex items-center gap-2 min-w-[60px]">
                      {getRankIcon(entry.rank)}
                      <span className="text-2xl font-bold">#{entry.rank}</span>
                    </div>

                    {/* Username */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold font-mono truncate">
                        {entry.user.displayName || entry.user.username}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {entry.problemsSolved} problems • Last: {formatTimeAgo(entry.lastSubmissionTime)}
                      </p>
                    </div>

                    {/* Points Progress Bar */}
                    <div className="flex-1 max-w-md">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="bg-accepted/20 text-accepted border-accepted/50">
                          {entry.score} pts
                        </Badge>
                        <span className="text-sm font-medium">{entry.score} total</span>
                      </div>
                      
                      <Progress 
                        value={progressPercentage} 
                        className="h-3"
                      />
                    </div>

                    {/* Problems Solved */}
                    <div className="text-right min-w-[80px]">
                      <p className="font-mono text-lg font-semibold">{entry.problemsSolved}</p>
                      <p className="text-xs text-muted-foreground">Problems</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-accepted rounded-full" />
              <span>Final Scores</span>
            </div>
            <span>•</span>
            <span>
              {isConnected ? (
                <span className="flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  Live Updates
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <WifiOff className="h-3 w-3" />
                  Offline
                </span>
              )}
            </span>
            <span>•</span>
            <span>CodeStorm 2024</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}