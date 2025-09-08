import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Trophy, 
  FileText, 
  Code,
  MessageSquare,
  Save,
  Send
} from "lucide-react";

interface SubmissionReviewProps {
  submission: {
    id: string;
    problemId: string;
    contestId: string;
    submittedById: string;
    timestamp: Date;
    status: "PENDING" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED";
    reviewedById: string | null;
    score: number;
    codeText: string;
    problem: {
      id: string;
      questionText: string;
      difficultyLevel: "EASY" | "MEDIUM" | "HARD";
      tags: string[];
      maxScore: number;
    };
    submittedBy: {
      id: string;
      username: string;
      displayName?: string;
    };
    contest: {
      id: string;
      name: string;
    };
  };
  onReviewSubmit?: (reviewData: {
    correct: boolean;
    scoreAwarded: number;
    remarks: string;
  }) => void;
  onSaveDraft?: (draftData: {
    scoreAwarded: number;
    remarks: string;
  }) => void;
}

export function SubmissionReview({ submission, onReviewSubmit, onSaveDraft }: SubmissionReviewProps) {
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [scoreAwarded, setScoreAwarded] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [testCaseResults, setTestCaseResults] = useState([
    { id: 1, input: "[2,7,11,15], target=9", expected: "[0,1]", actual: "[0,1]", passed: true },
    { id: 2, input: "[3,2,4], target=6", expected: "[1,2]", actual: "[1,2]", passed: true },
    { id: 3, input: "[3,3], target=6", expected: "[0,1]", actual: "[0,1]", passed: true },
  ]);

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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY": return "text-accepted";
      case "MEDIUM": return "text-warning";
      case "HARD": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const handleSubmitReview = () => {
    if (isCorrect === null) return;
    
    onReviewSubmit?.({
      correct: isCorrect,
      scoreAwarded,
      remarks
    });
  };

  const handleSaveDraft = () => {
    onSaveDraft?.({
      scoreAwarded,
      remarks
    });
  };

  const passedTests = testCaseResults.filter(test => test.passed).length;
  const totalTests = testCaseResults.length;

  return (
    <div className="space-y-6">
      {/* Submission Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Submission #{submission.id.split('_')[1]}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Contest: {submission.contest.name}
              </p>
            </div>
            <Badge variant="secondary">
              {submission.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium">Participant</p>
              <p className="text-sm text-muted-foreground">
                {submission.submittedBy.displayName || submission.submittedBy.username}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Submitted</p>
              <p className="text-sm text-muted-foreground">
                {formatTimeAgo(submission.timestamp)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Difficulty</p>
              <p className={`text-sm font-medium ${getDifficultyColor(submission.problem.difficultyLevel)}`}>
                {submission.problem.difficultyLevel}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Max Score</p>
              <p className="text-sm text-muted-foreground">
                {submission.problem.maxScore} points
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="problem" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="problem">Problem</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="tests">Test Results</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
        </TabsList>

        <TabsContent value="problem">
          <Card>
            <CardHeader>
              <CardTitle>Problem Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm leading-relaxed">
                  {submission.problem.questionText}
                </p>
                <div className="flex gap-2">
                  {submission.problem.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="code">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Submitted Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-black rounded-lg overflow-x-auto">
                <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                  {submission.codeText}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Test Case Results</span>
                <Badge variant={passedTests === totalTests ? "default" : "destructive"}>
                  {passedTests}/{totalTests} Passed
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testCaseResults.map((test) => (
                  <div 
                    key={test.id}
                    className={`p-3 rounded-lg border ${
                      test.passed ? 'border-accepted/20 bg-accepted/5' : 'border-destructive/20 bg-destructive/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Test Case {test.id}</span>
                      {test.passed ? (
                        <CheckCircle className="h-4 w-4 text-accepted" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs font-mono">
                      <div>
                        <p className="font-medium mb-1">Input:</p>
                        <p className="text-muted-foreground">{test.input}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Expected:</p>
                        <p className="text-muted-foreground">{test.expected}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Actual:</p>
                        <p className={test.passed ? "text-accepted" : "text-destructive"}>
                          {test.actual}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Review & Scoring
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Verdict */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Verdict</Label>
                <div className="flex gap-4">
                  <Button
                    variant={isCorrect === true ? "default" : "outline"}
                    onClick={() => {
                      setIsCorrect(true);
                      setScoreAwarded(submission.problem.maxScore);
                    }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Accept
                  </Button>
                  <Button
                    variant={isCorrect === false ? "destructive" : "outline"}
                    onClick={() => {
                      setIsCorrect(false);
                      setScoreAwarded(0);
                    }}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>

              {/* Score */}
              <div className="space-y-2">
                <Label htmlFor="score">Score Awarded</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max={submission.problem.maxScore}
                    value={scoreAwarded}
                    onChange={(e) => setScoreAwarded(Number(e.target.value))}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">
                    / {submission.problem.maxScore} points
                  </span>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks & Feedback</Label>
                <Textarea
                  id="remarks"
                  placeholder="Provide detailed feedback about the solution..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={handleSaveDraft}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button 
                  onClick={handleSubmitReview}
                  disabled={isCorrect === null}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}