import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter,
  Clock,
  Trophy,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { DifficultyBadge, type Difficulty } from "@/components/DifficultyBadge";
import { StatusBadge, type Status } from "@/components/StatusBadge";

interface Problem {
  id: string;
  title: string;
  difficulty: Difficulty;
  points: number;
  status: Status;
  description: string;
  solvedCount: number;
  totalSubmissions: number;
  tags: string[];
}

export function Problems() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<"all" | Difficulty>("all");

  // Mock problems data
  const problems: Problem[] = [
    {
      id: "1",
      title: "Two Sum",
      difficulty: "easy",
      points: 5,
      status: "accepted",
      description: "Given an array of integers, return indices of the two numbers such that they add up to a specific target.",
      solvedCount: 85,
      totalSubmissions: 120,
      tags: ["array", "hash-table"]
    },
    {
      id: "2", 
      title: "Binary Search Implementation",
      difficulty: "medium",
      points: 10,
      status: "pending",
      description: "Implement binary search algorithm on a sorted array.",
      solvedCount: 45,
      totalSubmissions: 78,
      tags: ["binary-search", "algorithms"]
    },
    {
      id: "3",
      title: "Merge K Sorted Lists",
      difficulty: "hard",
      points: 25,
      status: "not-started",
      description: "Merge k sorted linked lists and return it as one sorted list.",
      solvedCount: 12,
      totalSubmissions: 45,
      tags: ["linked-list", "divide-and-conquer"]
    },
    {
      id: "4",
      title: "Valid Parentheses",
      difficulty: "easy", 
      points: 5,
      status: "rejected",
      description: "Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
      solvedCount: 92,
      totalSubmissions: 110,
      tags: ["stack", "string"]
    },
    {
      id: "5",
      title: "Longest Palindromic Substring",
      difficulty: "medium",
      points: 15,
      status: "not-started", 
      description: "Given a string s, return the longest palindromic substring in s.",
      solvedCount: 34,
      totalSubmissions: 67,
      tags: ["string", "dynamic-programming"]
    }
  ];

  const filteredProblems = problems.filter(problem => {
    const matchesSearch = problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         problem.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDifficulty = filterDifficulty === "all" || problem.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const stats = {
    total: problems.length,
    solved: problems.filter(p => p.status === "accepted").length,
    pending: problems.filter(p => p.status === "pending").length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Problems</h1>
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
              {["all", "easy", "medium", "hard"].map((difficulty) => (
                <Button
                  key={difficulty}
                  variant={filterDifficulty === difficulty ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterDifficulty(difficulty as any)}
                  className="capitalize"
                >
                  <Filter className="h-3 w-3 mr-1" />
                  {difficulty}
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
                      {problem.title}
                    </h3>
                    <DifficultyBadge difficulty={problem.difficulty} points={problem.points} />
                    <StatusBadge status={problem.status} />
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {problem.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Solved: {problem.solvedCount}/{problem.totalSubmissions} 
                      ({Math.round((problem.solvedCount / problem.totalSubmissions) * 100)}%)
                    </span>
                    <div className="flex gap-1">
                      {problem.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="shrink-0 group-hover:bg-primary/10 group-hover:text-primary"
                >
                  <Link to={`/problems/${problem.id}`}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
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