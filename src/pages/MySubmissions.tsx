import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge, Status } from "@/components/StatusBadge";
import { Search, FileText, Clock, Eye, Calendar, Wifi, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import websocketService from "@/lib/websocket";

// Updated submission interface based on new schema
interface Submission {
  id: string;
  problemId: string;
  contestId: string;
  submittedById: string;
  timestamp: Date;
  status: "PENDING" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED";
  reviewedById?: string;
  score: number;
  codeText: string;
  problem: {
    id: string;
    questionText: string;
    difficultyLevel: "EASY" | "MEDIUM" | "HARD";
    tags: string[];
    maxScore: number;
  };
  contest: {
    id: string;
    name: string;
  };
  review?: {
    id: string;
    correct: boolean;
    scoreAwarded: number;
    remarks?: string;
    timestamp: Date;
  };
}

// Mock submission data based on new schema
const mockSubmissions: Submission[] = [
  {
    id: "sub_001",
    problemId: "prob_001",
    contestId: "contest_001",
    submittedById: "user_001",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    status: "ACCEPTED",
    reviewedById: "judge_001",
    score: 100,
    codeText: "def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []",
    problem: {
      id: "prob_001",
      questionText: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
      difficultyLevel: "EASY",
      tags: ["Array", "Hash Table"],
      maxScore: 100
    },
    contest: {
      id: "contest_001",
      name: "CodeStorm 2025 Finals"
    },
    review: {
      id: "rev_001",
      correct: true,
      scoreAwarded: 100,
      remarks: "Excellent solution with optimal time complexity O(n).",
      timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000)
    }
  },
  {
    id: "sub_002",
    problemId: "prob_002",
    contestId: "contest_001",
    submittedById: "user_001",
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    status: "PENDING",
    score: 0,
    codeText: "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint binarySearch(vector<int>& arr, int target) {\n    int left = 0, right = arr.size() - 1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (arr[mid] == target) return mid;\n        if (arr[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}",
    problem: {
      id: "prob_002",
      questionText: "Implement binary search algorithm to find target element in sorted array.",
      difficultyLevel: "MEDIUM",
      tags: ["Binary Search", "Array"],
      maxScore: 150
    },
    contest: {
      id: "contest_001",
      name: "CodeStorm 2025 Finals"
    }
  },
  {
    id: "sub_003",
    problemId: "prob_004",
    contestId: "contest_002",
    submittedById: "user_001",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    status: "REJECTED",
    reviewedById: "judge_002",
    score: 0,
    codeText: "public boolean isValid(String s) {\n    // Incomplete implementation\n    return s.length() % 2 == 0;\n}",
    problem: {
      id: "prob_004",
      questionText: "Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
      difficultyLevel: "EASY",
      tags: ["Stack", "String"],
      maxScore: 100
    },
    contest: {
      id: "contest_002",
      name: "Practice Round"
    },
    review: {
      id: "rev_003",
      correct: false,
      scoreAwarded: 0,
      remarks: "Incorrect approach. You need to use a stack to match opening and closing brackets properly.",
      timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000)
    }
  },
  {
    id: "sub_004",
    problemId: "prob_002",
    contestId: "contest_001",
    submittedById: "user_001",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    status: "UNDER_REVIEW",
    reviewedById: "judge_001",
    score: 0,
    codeText: "def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1",
    problem: {
      id: "prob_002",
      questionText: "Implement binary search algorithm to find target element in sorted array.",
      difficultyLevel: "MEDIUM",
      tags: ["Binary Search", "Array"],
      maxScore: 150
    },
    contest: {
      id: "contest_001",
      name: "CodeStorm 2025 Finals"
    }
  }
];

export function MySubmissions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [contestFilter, setContestFilter] = useState<string>("all");
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const { user } = useAuth();

  // Fetch user submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.get(`/users/${user.id}/submissions`);
        setSubmissions(response as Submission[]);
      } catch (err) {
        console.error('Error fetching submissions:', err);
        setError('Failed to load submissions');
        // Fallback to mock data for development
        setSubmissions(mockSubmissions);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [user]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!user) return;

    const connectWebSocket = async () => {
      try {
        await websocketService.connect(user.id);
        setIsConnected(true);

        // Handle submission updates
        websocketService.onSubmissionUpdate((updatedSubmission: Submission) => {
          console.log('Received submission update:', updatedSubmission);
          
          setSubmissions(prevSubmissions => {
            const existingIndex = prevSubmissions.findIndex(s => s.id === updatedSubmission.id);
            
            if (existingIndex >= 0) {
              // Update existing submission
              const updated = [...prevSubmissions];
              updated[existingIndex] = updatedSubmission;
              return updated;
            } else {
              // Add new submission (if it belongs to this user)
              if (updatedSubmission.submittedById === user.id) {
                return [updatedSubmission, ...prevSubmissions];
              }
              return prevSubmissions;
            }
          });
        });

      } catch (error) {
        console.error('WebSocket connection failed:', error);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      websocketService.disconnect();
      setIsConnected(false);
    };
  }, [user]);

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.problem.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (submission.problem.tags && submission.problem.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesStatus = statusFilter === "all" || submission.status === statusFilter;
    const matchesContest = contestFilter === "all" || submission.contest.id === contestFilter;
    return matchesSearch && matchesStatus && matchesContest;
  });

  const totalPoints = submissions
    .filter(s => s.status === 'ACCEPTED')
    .reduce((sum, s) => sum + s.score, 0);
  
  const totalSubmissions = submissions.length;
  const acceptedCount = submissions.filter(s => s.status === 'ACCEPTED').length;
  const pendingCount = submissions.filter(s => s.status === 'PENDING' || s.status === 'UNDER_REVIEW').length;

  // Get unique contests for filtering
  const contests = Array.from(
    new Set(submissions.map(s => s.contest.id))
  ).map(contestId => {
    const submission = submissions.find(s => s.contest.id === contestId);
    return submission ? submission.contest : null;
  }).filter(Boolean);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading submissions...</p>
        </div>
      </div>
    );
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACCEPTED": return "accepted";
      case "REJECTED": return "rejected";
      case "PENDING": return "pending";
      case "UNDER_REVIEW": return "pending";
      default: return "not-started";
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

  const handleViewCode = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsCodeDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent flex items-center gap-3">
            My Submissions
            {isConnected ? (
              <Wifi className="h-6 w-6 text-green-500" />
            ) : (
              <WifiOff className="h-6 w-6 text-red-500" />
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your progress and submission history
            {isConnected ? ' • Live updates enabled' : ' • Offline mode'}
            {error && ` • ${error}`}
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-accepted">{totalPoints}</p>
              <p className="text-sm text-muted-foreground">Total Points</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{acceptedCount}/{totalSubmissions}</p>
              <p className="text-sm text-muted-foreground">Accepted</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-pending">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Under Review</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search problems or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={contestFilter} onValueChange={setContestFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by contest" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Contests</SelectItem>
            {contests.map((contest) => (
              <SelectItem key={contest!.id} value={contest!.id}>
                {contest!.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACCEPTED">Accepted</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Submission History ({filteredSubmissions.length} submissions)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Problem</TableHead>
                <TableHead>Contest</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">
                        Problem #{submission.problemId.split('_')[1]}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {submission.problem.questionText}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getDifficultyColor(submission.problem.difficultyLevel)} border-current`}
                        >
                          {submission.problem.difficultyLevel}
                        </Badge>
                        <div className="flex gap-1">
                          {submission.problem.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{submission.contest.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={getStatusColor(submission.status) as Status} />
                    {submission.review && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Reviewed {formatTimeAgo(submission.review.timestamp)}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <span className={submission.status === 'ACCEPTED' ? 'text-accepted font-medium' : 'text-muted-foreground'}>
                        {submission.score}/{submission.problem.maxScore}
                      </span>
                      {submission.review && submission.review.remarks && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {submission.review.remarks}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <div>
                        <p>{formatTimeAgo(submission.timestamp)}</p>
                        <p className="text-xs">{submission.timestamp.toLocaleString()}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewCode(submission)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Code
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {filteredSubmissions.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No submissions found</p>
              <p className="text-sm">Try adjusting your filters or start solving problems!</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Code View Dialog */}
      <Dialog open={isCodeDialogOpen} onOpenChange={setIsCodeDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              View your submitted code and feedback.
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-6">
              {/* Submission Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Problem</p>
                  <p className="text-sm text-muted-foreground">
                    #{selectedSubmission.problemId.split('_')[1]} - {selectedSubmission.problem.difficultyLevel}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Contest</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSubmission.contest.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <StatusBadge status={getStatusColor(selectedSubmission.status) as Status} />
                </div>
                <div>
                  <p className="text-sm font-medium">Score</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSubmission.score}/{selectedSubmission.problem.maxScore} points
                  </p>
                </div>
              </div>

              {/* Problem Statement */}
              <div>
                <h4 className="font-medium mb-2">Problem Statement</h4>
                <div className="p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm">{selectedSubmission.problem.questionText}</p>
                  <div className="flex gap-2 mt-2">
                    {selectedSubmission.problem.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submitted Code */}
              <div>
                <h4 className="font-medium mb-2">Your Code</h4>
                <div className="p-4 bg-black rounded-lg overflow-x-auto">
                  <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                    {selectedSubmission.codeText}
                  </pre>
                </div>
              </div>

              {/* Review Feedback */}
              {selectedSubmission.review && (
                <div>
                  <h4 className="font-medium mb-2">Judge Feedback</h4>
                  <div className={`p-4 rounded-lg ${
                    selectedSubmission.review.correct 
                      ? 'bg-accepted/10 border border-accepted/20' 
                      : 'bg-destructive/10 border border-destructive/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={selectedSubmission.review.correct ? "default" : "destructive"}>
                        {selectedSubmission.review.correct ? "Accepted" : "Rejected"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Score: {selectedSubmission.review.scoreAwarded}/{selectedSubmission.problem.maxScore}
                      </span>
                    </div>
                    {selectedSubmission.review.remarks && (
                      <p className="text-sm">{selectedSubmission.review.remarks}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}