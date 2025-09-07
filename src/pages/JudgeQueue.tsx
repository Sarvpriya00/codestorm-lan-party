import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Code, FileText, Search } from "lucide-react";
import { useState } from "react";

// Mock data for submissions
const mockSubmissions = [
  {
    id: "sub_001",
    problemTitle: "Two Sum",
    language: "Python",
    timestamp: "2024-01-15 14:32:15",
    attemptNumber: 1,
    timeAgo: "2 minutes ago"
  },
  {
    id: "sub_002", 
    problemTitle: "Binary Search",
    language: "C++",
    timestamp: "2024-01-15 14:30:45",
    attemptNumber: 3,
    timeAgo: "4 minutes ago"
  },
  {
    id: "sub_003",
    problemTitle: "Dynamic Programming Basic",
    language: "Java",
    timestamp: "2024-01-15 14:28:20",
    attemptNumber: 1,
    timeAgo: "6 minutes ago"
  },
  {
    id: "sub_004",
    problemTitle: "Graph Traversal",
    language: "Python",
    timestamp: "2024-01-15 14:25:10",
    attemptNumber: 2,
    timeAgo: "9 minutes ago"
  }
];

export function JudgeQueue() {
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");

  const filteredSubmissions = mockSubmissions.filter(submission => {
    const matchesSearch = submission.problemTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = languageFilter === "all" || submission.language === languageFilter;
    return matchesSearch && matchesLanguage;
  });

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
        
        <Select value={languageFilter} onValueChange={setLanguageFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            <SelectItem value="Python">Python</SelectItem>
            <SelectItem value="C++">C++</SelectItem>
            <SelectItem value="Java">Java</SelectItem>
            <SelectItem value="JavaScript">JavaScript</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submissions Queue */}
      <div className="grid gap-4">
        {filteredSubmissions.map((submission) => (
          <Card key={submission.id} className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-warning">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {submission.problemTitle}
                </CardTitle>
                <Badge variant="outline" className="font-mono">
                  #{submission.id}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Code className="h-4 w-4" />
                    <span>{submission.language}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{submission.timeAgo}</span>
                  </div>
                  
                  <span>Attempt #{submission.attemptNumber}</span>
                </div>
                
                <Button variant="judge" size="sm">
                  Review Submission
                </Button>
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
              <p className="text-lg font-medium">No pending submissions</p>
              <p className="text-sm">All submissions have been reviewed!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}