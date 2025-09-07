import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  FileText, 
  Send, 
  Clock, 
  TrendingUp,
  Users,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";

export function Dashboard() {
  // Mock data - will be replaced with real data
  const stats = {
    totalProblems: 25,
    solvedProblems: 8,
    pendingSubmissions: 3,
    rank: 15,
    totalParticipants: 120,
    contestProgress: 65,
    timeSpent: "2h 45m"
  };

  const quickActions = [
    {
      title: "Browse Problems",
      description: "Explore and solve coding challenges",
      icon: FileText,
      href: "/problems",
      variant: "hero" as const
    },
    {
      title: "View Submissions", 
      description: "Check your submission history",
      icon: Send,
      href: "/submissions",
      variant: "default" as const
    },
    {
      title: "Leaderboard",
      description: "See live contest rankings",
      icon: Trophy,
      href: "/leaderboard", 
      variant: "secondary" as const
    }
  ];

  const recentActivity = [
    { problem: "Two Sum", status: "accepted", time: "10:23 AM" },
    { problem: "Binary Search", status: "pending", time: "10:15 AM" },
    { problem: "Merge Sort", status: "rejected", time: "09:45 AM" }
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-primary rounded-full text-primary-foreground text-sm font-medium">
          <Zap className="h-4 w-4" />
          Contest Phase: Running
        </div>
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Welcome to CodeStorm
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Test your coding skills in this intense programming competition. Solve problems, climb the leaderboard!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Problems Solved</p>
                <p className="text-2xl font-bold text-accepted">
                  {stats.solvedProblems}/{stats.totalProblems}
                </p>
              </div>
              <div className="p-3 bg-accepted/20 rounded-full">
                <FileText className="h-6 w-6 text-accepted" />
              </div>
            </div>
            <Progress value={(stats.solvedProblems / stats.totalProblems) * 100} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Rank</p>
                <p className="text-2xl font-bold text-primary">#{stats.rank}</p>
              </div>
              <div className="p-3 bg-primary/20 rounded-full">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Out of {stats.totalParticipants} participants
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-pending">{stats.pendingSubmissions}</p>
              </div>
              <div className="p-3 bg-pending/20 rounded-full">
                <Send className="h-6 w-6 text-pending" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Time Spent</p>
                <p className="text-2xl font-bold text-foreground">{stats.timeSpent}</p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-full">
                <Clock className="h-6 w-6 text-secondary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Total contest time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                variant={action.variant}
                size="lg"
                asChild
                className="h-auto p-6 flex flex-col items-center gap-3 text-center"
              >
                <Link to={action.href}>
                  <action.icon className="h-8 w-8" />
                  <div>
                    <div className="font-semibold">{action.title}</div>
                    <div className="text-sm opacity-80">{action.description}</div>
                  </div>
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    activity.status === 'accepted' ? 'bg-accepted' :
                    activity.status === 'pending' ? 'bg-pending' : 'bg-rejected'
                  }`} />
                  <span className="font-medium">{activity.problem}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="capitalize">{activity.status}</span>
                  <span>•</span>
                  <span>{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}