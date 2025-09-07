import { useState } from "react";
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
  Timer
} from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  username: string;
  confirmedPoints: number;
  pendingPoints: number;
  totalTime: string; // mm:ss format
  problemsSolved: number;
  lastSubmission: string;
}

export function Leaderboard() {
  const [showPending, setShowPending] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Mock leaderboard data
  const leaderboard: LeaderboardEntry[] = [
    {
      rank: 1,
      username: "coder_alpha",
      confirmedPoints: 85,
      pendingPoints: 15,
      totalTime: "42:15",
      problemsSolved: 12,
      lastSubmission: "2 min ago"
    },
    {
      rank: 2,
      username: "algo_master",
      confirmedPoints: 80,
      pendingPoints: 5,
      totalTime: "45:23",
      problemsSolved: 11,
      lastSubmission: "5 min ago"
    },
    {
      rank: 3,
      username: "debug_ninja", 
      confirmedPoints: 75,
      pendingPoints: 10,
      totalTime: "38:47",
      problemsSolved: 10,
      lastSubmission: "1 min ago"
    },
    {
      rank: 4,
      username: "code_wizard",
      confirmedPoints: 70,
      pendingPoints: 0,
      totalTime: "52:10",
      problemsSolved: 9,
      lastSubmission: "12 min ago"
    },
    {
      rank: 5,
      username: "byte_crusher",
      confirmedPoints: 65,
      pendingPoints: 20,
      totalTime: "46:33",
      problemsSolved: 8,
      lastSubmission: "3 min ago"
    }
  ];

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

  const maxPoints = Math.max(...leaderboard.map(entry => entry.confirmedPoints + (showPending ? entry.pendingPoints : 0)));

  return (
    <div className={`space-y-6 ${isFullScreen ? 'fixed inset-0 bg-background z-50 p-6 overflow-auto' : ''}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            Live Leaderboard
          </h1>
          <p className="text-muted-foreground">
            Real-time contest rankings • Updates every few seconds
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPending(!showPending)}
          >
            {showPending ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            {showPending ? "Hide" : "Show"} Pending
          </Button>
          
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
      <Card className="bg-gradient-primary text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Timer className="h-6 w-6" />
              <div>
                <h3 className="text-lg font-semibold">Contest Running</h3>
                <p className="text-primary-foreground/80">Time Remaining: 17:42</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-primary-foreground/80">Total Participants</p>
              <p className="text-2xl font-bold">127</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <div className="space-y-3">
        {leaderboard.map((entry) => {
          const totalPoints = entry.confirmedPoints + (showPending ? entry.pendingPoints : 0);
          const progressPercentage = (totalPoints / maxPoints) * 100;
          
          return (
            <Card key={entry.username} className={`${getRankStyle(entry.rank)} hover:scale-[1.02] transition-all duration-200`}>
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
                      {entry.username}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {entry.problemsSolved} problems • Last: {entry.lastSubmission}
                    </p>
                  </div>

                  {/* Points Progress Bar */}
                  <div className="flex-1 max-w-md">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-accepted/20 text-accepted border-accepted/50">
                          {entry.confirmedPoints} pts
                        </Badge>
                        {showPending && entry.pendingPoints > 0 && (
                          <Badge variant="outline" className="bg-pending/20 text-pending border-pending/50">
                            +{entry.pendingPoints} pending
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm font-medium">{totalPoints} total</span>
                    </div>
                    
                    <div className="relative">
                      <Progress 
                        value={progressPercentage} 
                        className="h-3"
                      />
                      {showPending && entry.pendingPoints > 0 && (
                        <div 
                          className="absolute top-0 h-3 bg-pending/60 rounded-r-full"
                          style={{
                            left: `${(entry.confirmedPoints / maxPoints) * 100}%`,
                            width: `${(entry.pendingPoints / maxPoints) * 100}%`
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="text-right min-w-[80px]">
                    <p className="font-mono text-lg font-semibold">{entry.totalTime}</p>
                    <p className="text-xs text-muted-foreground">Total time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer Info */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-accepted rounded-full" />
              <span>Confirmed Points</span>
            </div>
            {showPending && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-pending rounded-full" />
                <span>Pending Review</span>
              </div>
            )}
            <span>•</span>
            <span>Updates automatically</span>
            <span>•</span>
            <span>CodeStorm 2024</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}