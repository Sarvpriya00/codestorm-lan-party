import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  Trophy, 
  Target, 
  TrendingUp,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star
} from "lucide-react";
import { Link } from "react-router-dom";

interface ContestDashboardProps {
  contestId?: string;
}

export function ContestDashboard({ contestId }: ContestDashboardProps) {
  // Mock contest data
  const contestData = {
    id: "contest_001",
    name: "CodeStorm 2024 Finals",
    description: "Annual programming contest finals",
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // Started 2 hours ago
    endTime: new Date(Date.now() + 1 * 60 * 60 * 1000), // Ends in 1 hour
    status: "RUNNING" as const,
    totalProblems: 8,
    totalParticipants: 45,
    timeRemaining: "58:42"
  };

  // Mock user progress data
  const userProgress = {
    problemsSolved: 3,
    totalScore: 350,
    rank: 12,
    submissions: 7,
    acceptedSubmissions: 3,
    pendingSubmissions: 1,
    rejectedSubmissions: 3
  };

  // Mock recent problems
  const recentProblems = [
    {
      id: "prob_001",
      order: 1,
      title: "Two Sum Problem",
      difficulty: "EASY" as const,
      maxScore: 100,
      userScore: 100,
      status: "ACCEPTED" as const,
      attempts: 2
    },
    {
      id: "prob_002", 
      order: 2,
      title: "Binary Search Implementation",
      difficulty: "MEDIUM" as const,
      maxScore: 150,
      userScore: 0,
      status: "PENDING" as const,
      attempts: 1
    },
    {
      id: "prob_003",
      order: 3,
      title: "Dynamic Programming Basic",
      difficulty: "EASY" as const,
      maxScore: 100,
      userScore: 100,
      status: "ACCEPTED" as const,
      attempts: 1
    },
    {
      id: "prob_004",
      order: 4,
      title: "Valid Parentheses",
      difficulty: "EASY" as const,
      maxScore: 100,
      userScore: 0,
      status: "REJECTED" as const,
      attempts: 3
    }
  ];

  // Mock leaderboard data (top 5)
  const topParticipants = [
    { rank: 1, username: "coder_pro", score: 750, solved: 6 },
    { rank: 2, username: "algo_master", score: 650, solved: 5 },
    { rank: 3, username: "dev_ninja", score: 550, solved: 4 },
    { rank: 4, username: "code_wizard", score: 450, solved: 4 },
    { rank: 5, username: "participant_001", score: 350, solved: 3 }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return <CheckCircle className="h-4 w-4 text-accepted" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "PENDING":
        return <AlertCircle className="h-4 w-4 text-warning" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY": return "text-accepted";
      case "MEDIUM": return "text-warning";
      case "HARD": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const progressPercentage = (userProgress.problemsSolved / contestData.totalProblems) * 100;
  const accuracyPercentage = userProgress.submissions > 0 
    ? (userProgress.acceptedSubmissions / userProgress.submissions) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Contest Timer */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-mono">Contest Timer: 45:23</span>
              </div>
              <Badge variant="secondary" className="px-3 py-1">
                RUNNING
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contest Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{contestData.name}</h1>
          <p className="text-muted-foreground mt-1">
            {contestData.description}
          </p>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Problems Solved</p>
                <p className="text-2xl font-bold">
                  {userProgress.problemsSolved}/{contestData.totalProblems}
                </p>
              </div>
              <Target className="h-8 w-8 text-primary opacity-60" />
            </div>
            <Progress value={progressPercentage} className="mt-2 h-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Score</p>
                <p className="text-2xl font-bold text-accepted">{userProgress.totalScore}</p>
              </div>
              <Star className="h-8 w-8 text-accepted opacity-60" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Rank</p>
                <p className="text-2xl font-bold">#{userProgress.rank}</p>
              </div>
              <Trophy className="h-8 w-8 text-warning opacity-60" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-2xl font-bold">{Math.round(accuracyPercentage)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-60" />
            </div>
            <Progress value={accuracyPercentage} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Problem Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Problem Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentProblems.map((problem) => (
                <div 
                  key={problem.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(problem.status)}
                    <div>
                      <p className="font-medium text-sm">
                        Problem {problem.order}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {problem.title}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getDifficultyColor(problem.difficulty)} border-current`}
                    >
                      {problem.difficulty}
                    </Badge>
                    <div className="text-right text-xs">
                      <p className={problem.userScore > 0 ? "text-accepted font-medium" : "text-muted-foreground"}>
                        {problem.userScore}/{problem.maxScore}
                      </p>
                      <p className="text-muted-foreground">
                        {problem.attempts} attempts
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Button asChild className="w-full">
                <Link to="/problems">
                  View All Problems
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Leaderboard (Top 5)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topParticipants.map((participant) => (
                <div 
                  key={participant.rank}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    participant.rank === userProgress.rank 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      participant.rank === 1 ? 'bg-yellow-500 text-white' :
                      participant.rank === 2 ? 'bg-gray-400 text-white' :
                      participant.rank === 3 ? 'bg-amber-600 text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {participant.rank}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {participant.username}
                        {participant.rank === userProgress.rank && (
                          <span className="text-primary ml-2">(You)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {participant.solved} problems solved
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-accepted">{participant.score}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" asChild className="w-full">
                <Link to="/leaderboard">
                  View Full Leaderboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Button asChild className="h-16 flex-col">
              <Link to="/problems">
                <FileText className="h-6 w-6 mb-2" />
                Solve Problems
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="h-16 flex-col">
              <Link to="/submissions">
                <Clock className="h-6 w-6 mb-2" />
                My Submissions
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="h-16 flex-col">
              <Link to="/leaderboard">
                <Trophy className="h-6 w-6 mb-2" />
                Leaderboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}