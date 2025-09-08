import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Users, FileText, CheckCircle, RefreshCw, AlertCircle, Trophy, Clock } from "lucide-react";
import { analyticsApi, contestApi } from "@/lib/api";
import { ContestStatistics, ProblemAnalytics } from "@/types/analytics";

interface Contest {
  id: string;
  name: string;
  status: string;
  startTime?: Date;
  endTime?: Date;
}

export function ContestAnalytics() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContestId, setSelectedContestId] = useState<string>("");
  const [contestStats, setContestStats] = useState<ContestStatistics | null>(null);
  const [problemAnalytics, setProblemAnalytics] = useState<ProblemAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContests = async () => {
    try {
      const contestsData = await contestApi.getContests({ status: ['RUNNING', 'ENDED'] });
      setContests(contestsData);
      if (contestsData.length > 0 && !selectedContestId) {
        setSelectedContestId(contestsData[0].id);
      }
    } catch (err) {
      console.error('Error fetching contests:', err);
    }
  };

  const fetchContestAnalytics = async (contestId: string) => {
    if (!contestId) return;
    
    try {
      setError(null);
      setLoading(true);
      const stats = await analyticsApi.getContestStatistics(contestId);
      setContestStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contest analytics');
      console.error('Error fetching contest analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, []);

  useEffect(() => {
    if (selectedContestId) {
      fetchContestAnalytics(selectedContestId);
    }
  }, [selectedContestId]);

  const handleRefresh = () => {
    if (selectedContestId) {
      fetchContestAnalytics(selectedContestId);
    }
  };  if (
loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading contest analytics...</span>
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
            <p className="text-lg font-medium">Failed to load contest analytics</p>
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

  const acceptanceRate = contestStats && contestStats.totalSubmissions > 0 
    ? Math.round((contestStats.correctSubmissions / contestStats.totalSubmissions) * 100) 
    : 0;

  const participationRate = contestStats && contestStats.totalParticipants > 0
    ? Math.round((contestStats.activeParticipants / contestStats.totalParticipants) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Contest Analytics</h2>
          <Select value={selectedContestId} onValueChange={setSelectedContestId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a contest" />
            </SelectTrigger>
            <SelectContent>
              {contests.map((contest) => (
                <SelectItem key={contest.id} value={contest.id}>
                  <div className="flex items-center gap-2">
                    <span>{contest.name}</span>
                    <Badge variant={contest.status === 'RUNNING' ? 'default' : 'secondary'} className="text-xs">
                      {contest.status}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {contestStats && (
        <>
          {/* Contest Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Participants</p>
                    <p className="text-3xl font-bold">{contestStats.totalParticipants}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {contestStats.activeParticipants} active
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
                    <p className="text-sm text-muted-foreground">Total Submissions</p>
                    <p className="text-3xl font-bold">{contestStats.totalSubmissions}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {contestStats.correctSubmissions} accepted
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
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="text-3xl font-bold text-accepted">{acceptanceRate}%</p>
                    <p className="text-xs text-muted-foreground mt-1">acceptance rate</p>
                  </div>
                  <CheckCircle className="h-10 w-10 text-accepted opacity-60" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Average Score</p>
                    <p className="text-3xl font-bold">{contestStats.averageScore.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground mt-1">per participant</p>
                  </div>
                  <Trophy className="h-10 w-10 text-primary opacity-60" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contest Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Contest Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Contest Name</span>
                  <span className="font-medium">{contestStats.contestName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={contestStats.status === 'RUNNING' ? 'default' : 'secondary'}>
                    {contestStats.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Problems Count</span>
                  <span className="font-medium">{contestStats.problemsCount}</span>
                </div>
                {contestStats.startTime && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Start Time</span>
                    <span className="font-medium">
                      {new Date(contestStats.startTime).toLocaleString()}
                    </span>
                  </div>
                )}
                {contestStats.endTime && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">End Time</span>
                    <span className="font-medium">
                      {new Date(contestStats.endTime).toLocaleString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Participation Rate</span>
                    <span className="font-medium">{participationRate}%</span>
                  </div>
                  <Progress value={participationRate} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Acceptance Rate</span>
                    <span className="font-medium">{acceptanceRate}%</span>
                  </div>
                  <Progress value={acceptanceRate} className="h-2" />
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg. Submissions per Participant</span>
                    <span className="font-medium">
                      {contestStats.activeParticipants > 0 
                        ? (contestStats.totalSubmissions / contestStats.activeParticipants).toFixed(1)
                        : '0'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}