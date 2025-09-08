import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Trophy, 
  Target, 
  TrendingUp, 
  Search, 
  RefreshCw, 
  AlertCircle,
  Medal,
  CheckCircle,
  FileText
} from "lucide-react";
import { ParticipantMetrics as ParticipantMetricsType } from "@/types/analytics";

// Mock data for now - in real implementation this would come from API
const mockParticipants: ParticipantMetricsType[] = [
  {
    userId: "user1",
    username: "participant_001",
    displayName: "Alice Johnson",
    totalSubmissions: 25,
    correctSubmissions: 18,
    totalScore: 450.5,
    problemsSolved: 12,
    averageScore: 25.0,
    rank: 1,
    lastSubmissionTime: new Date('2024-01-15T14:30:00'),
    contestsParticipated: 3
  },
  {
    userId: "user2", 
    username: "participant_002",
    displayName: "Bob Smith",
    totalSubmissions: 22,
    correctSubmissions: 15,
    totalScore: 380.0,
    problemsSolved: 10,
    averageScore: 25.3,
    rank: 2,
    lastSubmissionTime: new Date('2024-01-15T13:45:00'),
    contestsParticipated: 2
  },
  {
    userId: "user3",
    username: "participant_003", 
    displayName: "Carol Davis",
    totalSubmissions: 30,
    correctSubmissions: 20,
    totalScore: 375.0,
    problemsSolved: 15,
    averageScore: 18.8,
    rank: 3,
    lastSubmissionTime: new Date('2024-01-15T15:20:00'),
    contestsParticipated: 4
  },
  {
    userId: "user4",
    username: "participant_004",
    displayName: "David Wilson",
    totalSubmissions: 18,
    correctSubmissions: 12,
    totalScore: 290.0,
    problemsSolved: 8,
    averageScore: 24.2,
    rank: 4,
    lastSubmissionTime: new Date('2024-01-15T12:15:00'),
    contestsParticipated: 2
  },
  {
    userId: "user5",
    username: "participant_005",
    displayName: "Eva Brown",
    totalSubmissions: 16,
    correctSubmissions: 10,
    totalScore: 250.0,
    problemsSolved: 7,
    averageScore: 25.0,
    rank: 5,
    lastSubmissionTime: new Date('2024-01-15T11:30:00'),
    contestsParticipated: 1
  }
];

export function ParticipantMetrics() {
  const [participants, setParticipants] = useState<ParticipantMetricsType[]>(mockParticipants);
  const [filteredParticipants, setFilteredParticipants] = useState<ParticipantMetricsType[]>(mockParticipants);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("rank");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter and sort participants
  useEffect(() => {
    let filtered = participants.filter(participant => 
      participant.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort participants
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rank':
          return (a.rank || 999) - (b.rank || 999);
        case 'score':
          return b.totalScore - a.totalScore;
        case 'submissions':
          return b.totalSubmissions - a.totalSubmissions;
        case 'accuracy':
          const aAccuracy = a.totalSubmissions > 0 ? a.correctSubmissions / a.totalSubmissions : 0;
          const bAccuracy = b.totalSubmissions > 0 ? b.correctSubmissions / b.totalSubmissions : 0;
          return bAccuracy - aAccuracy;
        case 'problems':
          return b.problemsSolved - a.problemsSolved;
        default:
          return 0;
      }
    });

    setFilteredParticipants(filtered);
  }, [participants, searchTerm, sortBy]);

  const handleRefresh = async () => {
    setLoading(true);
    // In real implementation, fetch from API
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const getRankBadgeVariant = (rank?: number) => {
    if (!rank) return "outline";
    if (rank === 1) return "default";
    if (rank <= 3) return "secondary";
    return "outline";
  };

  const getRankIcon = (rank?: number) => {
    if (!rank) return null;
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
    return null;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <div>
            <p className="text-lg font-medium">Failed to load participant metrics</p>
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

  // Calculate summary statistics
  const totalParticipants = participants.length;
  const avgScore = participants.reduce((sum, p) => sum + p.totalScore, 0) / totalParticipants;
  const avgSubmissions = participants.reduce((sum, p) => sum + p.totalSubmissions, 0) / totalParticipants;
  const avgAccuracy = participants.reduce((sum, p) => {
    const accuracy = p.totalSubmissions > 0 ? p.correctSubmissions / p.totalSubmissions : 0;
    return sum + accuracy;
  }, 0) / totalParticipants * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Participant Metrics</h2>
          <Badge variant="secondary" className="text-sm">
            <Users className="h-3 w-3 mr-1" />
            {totalParticipants} participants
          </Badge>
        </div>
        
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Score</p>
                <p className="text-3xl font-bold">{avgScore.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground mt-1">per participant</p>
              </div>
              <Trophy className="h-10 w-10 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Submissions</p>
                <p className="text-3xl font-bold">{avgSubmissions.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground mt-1">per participant</p>
              </div>
              <FileText className="h-10 w-10 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Accuracy</p>
                <p className="text-3xl font-bold">{avgAccuracy.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">success rate</p>
              </div>
              <CheckCircle className="h-10 w-10 text-accepted opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-3xl font-bold">{totalParticipants}</p>
                <p className="text-xs text-muted-foreground mt-1">total participants</p>
              </div>
              <Users className="h-10 w-10 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Participant Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search participants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rank">Rank</SelectItem>
                <SelectItem value="score">Total Score</SelectItem>
                <SelectItem value="submissions">Submissions</SelectItem>
                <SelectItem value="accuracy">Accuracy</SelectItem>
                <SelectItem value="problems">Problems Solved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Submissions</TableHead>
                  <TableHead className="text-right">Accuracy</TableHead>
                  <TableHead className="text-right">Problems</TableHead>
                  <TableHead className="text-right">Contests</TableHead>
                  <TableHead className="text-right">Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParticipants.map((participant) => {
                  const accuracy = participant.totalSubmissions > 0 
                    ? Math.round((participant.correctSubmissions / participant.totalSubmissions) * 100)
                    : 0;
                  
                  return (
                    <TableRow key={participant.userId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRankIcon(participant.rank)}
                          <Badge variant={getRankBadgeVariant(participant.rank)}>
                            #{participant.rank || '-'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{participant.displayName || participant.username}</p>
                          <p className="text-sm text-muted-foreground">@{participant.username}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {participant.totalScore.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-right">
                          <span className="font-medium">{participant.totalSubmissions}</span>
                          <div className="text-xs text-muted-foreground">
                            {participant.correctSubmissions} accepted
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-medium">{accuracy}%</span>
                          <div className="w-16">
                            <Progress value={accuracy} className="h-1" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {participant.problemsSolved}
                      </TableCell>
                      <TableCell className="text-right">
                        {participant.contestsParticipated}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {participant.lastSubmissionTime 
                          ? new Date(participant.lastSubmissionTime).toLocaleDateString()
                          : 'Never'
                        }
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}