import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Clock, Code, FileText, Search, User, Trophy, Eye } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import { PERMISSIONS } from "@/constants/permissions";

// Mock data for submissions based on new schema
const mockSubmissions = [
  {
    id: "sub_001",
    problemId: "prob_001",
    contestId: "contest_001",
    submittedById: "user_001",
    timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    status: "PENDING" as const,
    reviewedById: null,
    score: 0,
    codeText: "def two_sum(nums, target):\n    for i in range(len(nums)):\n        for j in range(i+1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]\n    return []",
    problem: {
      id: "prob_001",
      questionText: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
      difficultyLevel: "EASY" as const,
      tags: ["Array", "Hash Table"],
      maxScore: 100
    },
    submittedBy: {
      id: "user_001",
      username: "participant_001",
      displayName: "John Doe"
    },
    contest: {
      id: "contest_001",
      name: "CodeStorm 2024"
    }
  },
  {
    id: "sub_002", 
    problemId: "prob_002",
    contestId: "contest_001",
    submittedById: "user_002",
    timestamp: new Date(Date.now() - 4 * 60 * 1000), // 4 minutes ago
    status: "PENDING" as const,
    reviewedById: null,
    score: 0,
    codeText: "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint binarySearch(vector<int>& arr, int target) {\n    int left = 0, right = arr.size() - 1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (arr[mid] == target) return mid;\n        if (arr[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}",
    problem: {
      id: "prob_002",
      questionText: "Implement binary search algorithm to find target element in sorted array.",
      difficultyLevel: "MEDIUM" as const,
      tags: ["Binary Search", "Array"],
      maxScore: 150
    },
    submittedBy: {
      id: "user_002",
      username: "participant_002",
      displayName: "Jane Smith"
    },
    contest: {
      id: "contest_001",
      name: "CodeStorm 2024"
    }
  },
  {
    id: "sub_003",
    problemId: "prob_003",
    contestId: "contest_001",
    submittedById: "user_003",
    timestamp: new Date(Date.now() - 6 * 60 * 1000), // 6 minutes ago
    status: "UNDER_REVIEW" as const,
    reviewedById: "judge_001",
    score: 0,
    codeText: "public class Solution {\n    public int fibonacci(int n) {\n        if (n <= 1) return n;\n        int[] dp = new int[n + 1];\n        dp[0] = 0;\n        dp[1] = 1;\n        for (int i = 2; i <= n; i++) {\n            dp[i] = dp[i-1] + dp[i-2];\n        }\n        return dp[n];\n    }\n}",
    problem: {
      id: "prob_003",
      questionText: "Calculate the nth Fibonacci number using dynamic programming.",
      difficultyLevel: "EASY" as const,
      tags: ["Dynamic Programming", "Math"],
      maxScore: 100
    },
    submittedBy: {
      id: "user_003",
      username: "participant_003",
      displayName: "Bob Wilson"
    },
    contest: {
      id: "contest_001",
      name: "CodeStorm 2024"
    }
  }
];

type SubmissionStatus = "PENDING" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED";
type Difficulty = "EASY" | "MEDIUM" | "HARD";

export function JudgeQueue() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState<typeof mockSubmissions[0] | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  
  const { user } = useAuth();

  const filteredSubmissions = mockSubmissions.filter(submission => {
    const matchesSearch = submission.problem.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.submittedBy.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || submission.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const getStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case "PENDING": return "secondary";
      case "UNDER_REVIEW": return "default";
      case "ACCEPTED": return "default";
      case "REJECTED": return "destructive";
      default: return "outline";
    }
  };

  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case "EASY": return "text-accepted";
      case "MEDIUM": return "text-warning";
      case "HARD": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const handleReviewSubmission = (submission: typeof mockSubmissions[0]) => {
    setSelectedSubmission(submission);
    setIsReviewDialogOpen(true);
  };

  const handleClaimSubmission = (submissionId: string) => {
    // In real app, this would call API to claim submission for review
    console.log('Claim submission:', submissionId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Judge Queue
          </h1>
          <p className="text-muted-foreground mt-1">
            Review pending submissions ({filteredSubmissions.length} items)
          </p>
        </div>
        
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {filteredSubmissions.length} Pending
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search problems..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            <SelectItem value="ACCEPTED">Accepted</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submissions Queue */}
      <div className="grid gap-4">
        {filteredSubmissions.map((submission) => (
          <Card 
            key={submission.id} 
            className={`hover:shadow-md transition-shadow border-l-4 ${
              submission.status === 'PENDING' ? 'border-l-warning' :
              submission.status === 'UNDER_REVIEW' ? 'border-l-primary' :
              submission.status === 'ACCEPTED' ? 'border-l-accepted' :
              'border-l-destructive'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Problem #{submission.problemId.split('_')[1]}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {submission.problem.questionText}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline" className="font-mono">
                    #{submission.id.split('_')[1]}
                  </Badge>
                  <Badge variant={getStatusColor(submission.status)}>
                    {submission.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{submission.submittedBy.displayName || submission.submittedBy.username}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatTimeAgo(submission.timestamp)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    <span className={getDifficultyColor(submission.problem.difficultyLevel)}>
                      {submission.problem.difficultyLevel}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span>Max: {submission.problem.maxScore}pts</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <RoleGuard requiredPermissions={[PERMISSIONS.VIEW_SUBMISSION]} showFallback={false}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleReviewSubmission(submission)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Code
                    </Button>
                    {submission.status === 'PENDING' && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleClaimSubmission(submission.id)}
                      >
                        Claim & Review
                      </Button>
                    )}
                    {submission.status === 'UNDER_REVIEW' && submission.reviewedById === user?.id && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleReviewSubmission(submission)}
                      >
                        Continue Review
                      </Button>
                    )}
                  </RoleGuard>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredSubmissions.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No submissions found</p>
              <p className="text-sm">Try adjusting your filters or check back later!</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submission Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
            <DialogDescription>
              Evaluate the submitted code and provide feedback.
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-6">
              {/* Submission Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Participant</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSubmission.submittedBy.displayName || selectedSubmission.submittedBy.username}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Submitted</p>
                  <p className="text-sm text-muted-foreground">
                    {formatTimeAgo(selectedSubmission.timestamp)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Difficulty</p>
                  <p className={`text-sm font-medium ${getDifficultyColor(selectedSubmission.problem.difficultyLevel)}`}>
                    {selectedSubmission.problem.difficultyLevel}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Max Score</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSubmission.problem.maxScore} points
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
                <h4 className="font-medium mb-2">Submitted Code</h4>
                <div className="p-4 bg-black rounded-lg overflow-x-auto">
                  <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                    {selectedSubmission.codeText}
                  </pre>
                </div>
              </div>

              {/* Review Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
                  Close
                </Button>
                <Button 
                  variant="default"
                  onClick={() => {
                    // In real app, this would open the review form
                    console.log('Start detailed review for:', selectedSubmission.id);
                    setIsReviewDialogOpen(false);
                  }}
                >
                  Start Review
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}