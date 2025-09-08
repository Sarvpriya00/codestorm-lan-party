import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Filter,
  Clock,
  Trophy,
  ChevronRight,
  Calendar,
  Code,
  Star
} from "lucide-react";
import { Link } from "react-router-dom";
import { DifficultyBadge, type Difficulty } from "@/components/DifficultyBadge";
import { StatusBadge, type Status } from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import { PERMISSIONS } from "@/constants/permissions";

// Updated interface based on QuestionProblem model
interface QuestionProblem {
  id: string;
  questionText: string;
  difficultyLevel: "EASY" | "MEDIUM" | "HARD";
  tags: string[];
  createdById?: string;
  createdAt: Date;
  maxScore: number;
  isActive: boolean;
  // Contest relationship
  contestProblems: {
    contestId: string;
    order?: number;
    points: number;
    contest: {
      id: string;
      name: string;
      status: "PLANNED" | "RUNNING" | "ENDED" | "ARCHIVED";
    };
  }[];
  // User's submission status for this problem
  userStatus?: Status;
  userScore?: number;
  submissionCount?: number;
}

export function Problems() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<"all" | "EASY" | "MEDIUM" | "HARD">("all");
  const [filterContest, setFilterContest] = useState<string>("all");
  
  const { user } = useAuth();

  // Mock problems data based on QuestionProblem model
  const problems: QuestionProblem[] = [
    {
      id: "prob_001",
      questionText: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
      difficultyLevel: "EASY",
      tags: ["Array", "Hash Table"],
      createdAt: new Date("2024-01-10"),
      maxScore: 100,
      isActive: true,
      contestProblems: [
        {
          contestId: "contest_001",
          order: 1,
          points: 100,
          contest: {
            id: "contest_001",
            name: "CodeStorm 2024 Finals",
            status: "RUNNING"
          }
        }
      ],
      userStatus: "accepted",
      userScore: 100,
      submissionCount: 2
    },
    {
      id: "prob_002",
      questionText: "Implement binary search algorithm to find target element in sorted array. Return the index of target if found, otherwise return -1.",
      difficultyLevel: "MEDIUM",
      tags: ["Binary Search", "Array"],
      createdAt: new Date("2024-01-11"),
      maxScore: 150,
      isActive: true,
      contestProblems: [
        {
          contestId: "contest_001",
          order: 2,
          points: 150,
          contest: {
            id: "contest_001",
            name: "CodeStorm 2024 Finals",
            status: "RUNNING"
          }
        }
      ],
      userStatus: "pending",
      userScore: 0,
      submissionCount: 1
    },
    {
      id: "prob_003",
      questionText: "Calculate the nth Fibonacci number using dynamic programming approach. Optimize for both time and space complexity.",
      difficultyLevel: "EASY",
      tags: ["Dynamic Programming", "Math"],
      createdAt: new Date("2024-01-12"),
      maxScore: 100,
      isActive: true,
      contestProblems: [
        {
          contestId: "contest_001",
          order: 3,
          points: 100,
          contest: {
            id: "contest_001",
            name: "CodeStorm 2024 Finals",
            status: "RUNNING"
          }
        }
      ],
      userStatus: "not-started",
      userScore: 0,
      submissionCount: 0
    },
    {
      id: "prob_004",
      questionText: "Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if brackets are closed in the correct order.",
      difficultyLevel: "EASY",
      tags: ["Stack", "String"],
      createdAt: new Date("2024-01-13"),
      maxScore: 100,
      isActive: true,
      contestProblems: [
        {
          contestId: "contest_002",
          order: 1,
          points: 100,
          contest: {
            id: "contest_002",
            name: "Practice Round",
            status: "RUNNING"
          }
        }
      ],
      userStatus: "rejected",
      userScore: 0,
      submissionCount: 3
    },
    {
      id: "prob_005",
      questionText: "Merge k sorted linked lists and return it as one sorted list. Analyze and describe its complexity.",
      difficultyLevel: "HARD",
      tags: ["Linked List", "Divide and Conquer", "Heap"],
      createdAt: new Date("2024-01-14"),
      maxScore: 250,
      isActive: true,
      contestProblems: [
        {
          contestId: "contest_001",
          order: 8,
          points: 250,
          contest: {
            id: "contest_001",
            name: "CodeStorm 2024 Finals",
            status: "RUNNING"
          }
        }
      ],
      userStatus: "not-started",
      userScore: 0,
      submissionCount: 0
    }
  ];

  // Get unique contests for filtering
  const contests = Array.from(
    new Set(
      problems.flatMap(p => 
        p.contestProblems.map(cp => ({
          id: cp.contest.id,
          name: cp.contest.name,
          status: cp.contest.status
        }))
      )
    )
  );

  const filteredProblems = problems.filter(problem => {
    const matchesSearch = problem.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         problem.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDifficulty = filterDifficulty === "all" || problem.difficultyLevel === filterDifficulty;
    const matchesContest = filterContest === "all" || 
                          problem.contestProblems.some(cp => cp.contest.id === filterContest);
    return matchesSearch && matchesDifficulty && matchesContest && problem.isActive;
  });

  const stats = {
    total: problems.filter(p => p.isActive).length,
    solved: problems.filter(p => p.userStatus === "accepted").length,
    pending: problems.filter(p => p.userStatus === "pending").length,
    totalScore: problems.filter(p => p.userStatus === "accepted").reduce((sum, p) => sum + (p.userScore || 0), 0)
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY": return "text-accepted";
      case "MEDIUM": return "text-warning";
      case "HARD": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Contest Problems</h1>
          <p className="text-muted-foreground">
            Solve {stats.total} coding challenges • {stats.solved} solved • {stats.pending} pending review
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-accepted/20 text-accepted border-accepted/50">
            <Trophy className="h-3 w-3 mr-1" />
            {stats.solved} Solved
          </Badge>
          <Badge variant="outline" className="bg-pending/20 text-pending border-pending/50">
            <Clock className="h-3 w-3 mr-1" />
            {stats.pending} Pending
          </Badge>
          <Badge variant="outline" className="bg-primary/20 text-primary border-primary/50">
            <Star className="h-3 w-3 mr-1" />
            {stats.totalScore} Points
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search problems by title or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filterContest} onValueChange={setFilterContest}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by contest" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contests</SelectItem>
                  {contests.map((contest) => (
                    <SelectItem key={contest.id} value={contest.id}>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {contest.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {["all", "EASY", "MEDIUM", "HARD"].map((difficulty) => (
                <Button
                  key={difficulty}
                  variant={filterDifficulty === difficulty ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterDifficulty(difficulty as any)}
                  className="capitalize"
                >
                  <Filter className="h-3 w-3 mr-1" />
                  {difficulty === "all" ? "All" : difficulty.toLowerCase()}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Problems List */}
      <div className="grid gap-4">
        {filteredProblems.map((problem) => (
          <Card key={problem.id} className="bg-gradient-card border-border/50 hover:border-primary/50 transition-all duration-200 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                      Problem #{problem.id.split('_')[1]}
                    </h3>
                    <Badge 
                      variant="outline" 
                      className={`${getDifficultyColor(problem.difficultyLevel)} border-current`}
                    >
                      {problem.difficultyLevel}
                    </Badge>
                    <Badge variant="secondary">
                      {problem.maxScore} pts
                    </Badge>
                    {problem.userStatus && <StatusBadge status={problem.userStatus} />}
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {problem.questionText}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{problem.contestProblems[0]?.contest.name}</span>
                    </div>
                    {problem.submissionCount !== undefined && (
                      <span>
                        Attempts: {problem.submissionCount}
                      </span>
                    )}
                    {problem.userScore !== undefined && problem.userScore > 0 && (
                      <span className="text-accepted font-medium">
                        Score: {problem.userScore}/{problem.maxScore}
                      </span>
                    )}
                    <div className="flex gap-1">
                      {problem.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <RoleGuard requiredPermissions={[PERMISSIONS.VIEW_QUESTION]} showFallback={false}>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="shrink-0 group-hover:bg-primary/10 group-hover:text-primary"
                    >
                      <Link to={`/problems/${problem.id}`}>
                        <Code className="h-4 w-4 mr-2" />
                        Solve
                      </Link>
                    </Button>
                  </RoleGuard>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="shrink-0"
                  >
                    <Link to={`/problems/${problem.id}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProblems.length === 0 && (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No problems found</p>
              <p>Try adjusting your search terms or filters</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}