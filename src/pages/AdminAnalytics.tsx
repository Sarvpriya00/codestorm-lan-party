import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Users, FileText, CheckCircle, Clock, Target, Activity, RefreshCw, AlertCircle } from "lucide-react";
import { analyticsApi } from "@/lib/api";
import { AnalyticsDashboard, SystemMetrics } from "@/types/analytics";
import { ContestAnalytics } from "@/components/ContestAnalytics";
import { SystemMetrics as SystemMetricsComponent } from "@/components/SystemMetrics";

export function AdminAnalytics() {
  const [dashboardData, setDashboardData] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const data = await analyticsApi.getAnalyticsDashboard();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <div>
            <p className="text-lg font-medium">Failed to load analytics</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const totalSubmissions = dashboardData.activeContests.reduce((sum, contest) => sum + contest.totalSubmissions, 0);
  const totalCorrectSubmissions = dashboardData.activeContests.reduce((sum, contest) => sum + contest.correctSubmissions, 0);
  const totalActiveParticipants = dashboardData.activeContests.reduce((sum, contest) => sum + contest.activeParticipants, 0);
  const acceptanceRate = totalSubmissions > 0 ? Math.round((totalCorrectSubmissions / totalSubmissions) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time statistics and performance metrics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Activity className="h-4 w-4 mr-2" />
            Live Data
          </Badge>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contests">Contest Analytics</TabsTrigger>
          <TabsTrigger value="system">System Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Submissions</p>
                    <p className="text-3xl font-bold">{totalSubmissions}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last updated: {new Date(dashboardData.lastUpdated).toLocaleTimeString()}
                    </p>
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
                    <p className="text-3xl font-bold text-accepted">{totalCorrectSubmissions}</p>
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
                    <p className="text-3xl font-bold">{totalActiveParticipants}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      across {dashboardData.activeContests.length} contests
                    </p>
                  </div>
                  <Users className="h-10 w-10 text-primary opacity-60" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Contests</p>
                    <p className="text-3xl font-bold">{dashboardData.systemMetrics.activeContests}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      of {dashboardData.systemMetrics.totalContests} total
                    </p>
                  </div>
                  <Target className="h-10 w-10 text-primary opacity-60" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Contests Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Active Contests Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.activeContests.map((contest) => {
                  const contestAcceptanceRate = contest.totalSubmissions > 0 
                    ? Math.round((contest.correctSubmissions / contest.totalSubmissions) * 100) 
                    : 0;
                  
                  return (
                    <div key={contest.contestId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">Contest {contest.contestId.slice(-8)}</span>
                          <Badge variant="outline" className="text-xs">
                            {contest.activeParticipants} participants
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{contest.correctSubmissions}/{contest.totalSubmissions} accepted</span>
                          <span className="font-medium">{contestAcceptanceRate}%</span>
                        </div>
                      </div>
                      <Progress value={contestAcceptanceRate} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contests">
          <ContestAnalytics />
        </TabsContent>

        <TabsContent value="system">
          <SystemMetricsComponent metrics={dashboardData.systemMetrics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}