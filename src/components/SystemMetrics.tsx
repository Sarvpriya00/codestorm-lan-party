import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  FileText, 
  Trophy, 
  Target, 
  Activity, 
  Database, 
  Server, 
  CheckCircle,
  Clock,
  BarChart3
} from "lucide-react";
import { SystemMetrics as SystemMetricsType } from "@/types/analytics";

interface SystemMetricsProps {
  metrics: SystemMetricsType;
}

export function SystemMetrics({ metrics }: SystemMetricsProps) {
  const reviewRate = metrics.totalSubmissions > 0 
    ? Math.round((metrics.totalReviews / metrics.totalSubmissions) * 100) 
    : 0;

  const contestUtilization = metrics.totalContests > 0
    ? Math.round((metrics.activeContests / metrics.totalContests) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold">System Metrics</h2>
        <Badge variant="secondary" className="text-sm">
          <Activity className="h-3 w-3 mr-1" />
          Platform Overview
        </Badge>
      </div>

      {/* System Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold">{metrics.totalUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">registered users</p>
              </div>
              <Users className="h-10 w-10 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Problems</p>
                <p className="text-3xl font-bold">{metrics.totalProblems}</p>
                <p className="text-xs text-muted-foreground mt-1">active problems</p>
              </div>
              <Target className="h-10 w-10 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Submissions</p>
                <p className="text-3xl font-bold">{metrics.totalSubmissions}</p>
                <p className="text-xs text-muted-foreground mt-1">all time</p>
              </div>
              <FileText className="h-10 w-10 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Contests</p>
                <p className="text-3xl font-bold">{metrics.totalContests}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.activeContests} active
                </p>
              </div>
              <Trophy className="h-10 w-10 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Platform Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Reviews</span>
              <span className="font-medium">{metrics.totalReviews}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Review Coverage</span>
                <span className="font-medium">{reviewRate}%</span>
              </div>
              <Progress value={reviewRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {metrics.totalReviews} of {metrics.totalSubmissions} submissions reviewed
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Contest Utilization</span>
                <span className="font-medium">{contestUtilization}%</span>
              </div>
              <Progress value={contestUtilization} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {metrics.activeContests} of {metrics.totalContests} contests active
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Average Score</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{metrics.averageScore.toFixed(2)}</span>
                <Badge variant="outline" className="text-xs">
                  system-wide
                </Badge>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Submissions per User</span>
              <span className="font-medium">
                {metrics.totalUsers > 0 
                  ? (metrics.totalSubmissions / metrics.totalUsers).toFixed(1)
                  : '0'
                }
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Problems per Contest</span>
              <span className="font-medium">
                {metrics.totalContests > 0 
                  ? (metrics.totalProblems / metrics.totalContests).toFixed(1)
                  : '0'
                }
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Reviews per Contest</span>
              <span className="font-medium">
                {metrics.totalContests > 0 
                  ? (metrics.totalReviews / metrics.totalContests).toFixed(1)
                  : '0'
                }
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Database</p>
                <p className="text-sm text-muted-foreground">Operational</p>
                <Badge variant="outline" className="text-xs mt-1">
                  {metrics.totalSubmissions + metrics.totalUsers + metrics.totalContests} records
                </Badge>
              </div>
            </div>

            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">Activity Level</p>
                <p className="text-sm text-muted-foreground">
                  {metrics.activeContests > 0 ? 'High' : 'Low'}
                </p>
                <Badge variant="outline" className="text-xs mt-1">
                  {metrics.activeContests} active contests
                </Badge>
              </div>
            </div>

            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
              <div>
                <p className="font-medium">Review Queue</p>
                <p className="text-sm text-muted-foreground">
                  {reviewRate > 80 ? 'Healthy' : reviewRate > 50 ? 'Moderate' : 'Needs Attention'}
                </p>
                <Badge variant="outline" className="text-xs mt-1">
                  {reviewRate}% coverage
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}