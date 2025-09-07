import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, Users, FileText, CheckCircle, Clock, Target, Activity } from "lucide-react";

// Mock analytics data
const mockAnalytics = {
  overview: {
    totalSubmissions: 127,
    acceptedSubmissions: 45,
    activeParticipants: 23,
    averageTime: "14:32"
  },
  problemStats: [
    { title: "Two Sum", difficulty: "Easy", submissions: 18, accepted: 12, acceptanceRate: 67 },
    { title: "Binary Search", difficulty: "Medium", submissions: 15, accepted: 8, acceptanceRate: 53 },
    { title: "Dynamic Programming", difficulty: "Hard", submissions: 12, accepted: 3, acceptanceRate: 25 },
    { title: "Graph Traversal", difficulty: "Medium", submissions: 14, accepted: 7, acceptanceRate: 50 }
  ],
  recentActivity: [
    { time: "14:35", action: "Submission accepted", user: "participant_001", problem: "Two Sum" },
    { time: "14:33", action: "New submission", user: "participant_003", problem: "Binary Search" },
    { time: "14:30", action: "Submission rejected", user: "participant_002", problem: "DP Basic" },
    { time: "14:28", action: "User login", user: "participant_005", problem: null }
  ]
};

export function AdminAnalytics() {
  const acceptanceRate = Math.round((mockAnalytics.overview.acceptedSubmissions / mockAnalytics.overview.totalSubmissions) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Contest Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time statistics and performance metrics
          </p>
        </div>
        
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Activity className="h-4 w-4 mr-2" />
          Live Data
        </Badge>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Submissions</p>
                <p className="text-3xl font-bold">{mockAnalytics.overview.totalSubmissions}</p>
                <p className="text-xs text-muted-foreground mt-1">+12 in last hour</p>
              </div>
              <FileText className="h-10 w-10 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accepted</p>
                <p className="text-3xl font-bold text-accepted">{mockAnalytics.overview.acceptedSubmissions}</p>
                <p className="text-xs text-muted-foreground mt-1">{acceptanceRate}% success rate</p>
              </div>
              <CheckCircle className="h-10 w-10 text-accepted opacity-60" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Participants</p>
                <p className="text-3xl font-bold">{mockAnalytics.overview.activeParticipants}</p>
                <p className="text-xs text-muted-foreground mt-1">of 30 registered</p>
              </div>
              <Users className="h-10 w-10 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Solution Time</p>
                <p className="text-3xl font-bold font-mono">{mockAnalytics.overview.averageTime}</p>
                <p className="text-xs text-muted-foreground mt-1">per problem</p>
              </div>
              <Clock className="h-10 w-10 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Problem Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Problem Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAnalytics.problemStats.map((problem, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{problem.title}</span>
                    <Badge variant={problem.difficulty === 'Easy' ? 'default' : problem.difficulty === 'Medium' ? 'secondary' : 'destructive'}>
                      {problem.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{problem.accepted}/{problem.submissions} accepted</span>
                    <span className="font-medium">{problem.acceptanceRate}%</span>
                  </div>
                </div>
                <Progress value={problem.acceptanceRate} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAnalytics.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-muted-foreground">{activity.time}</span>
                  <span className="text-sm">{activity.action}</span>
                  <Badge variant="outline" className="text-xs">{activity.user}</Badge>
                </div>
                {activity.problem && (
                  <span className="text-sm text-muted-foreground">{activity.problem}</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}