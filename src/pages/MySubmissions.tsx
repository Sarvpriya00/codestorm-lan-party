import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, Status } from "@/components/StatusBadge";
import { Search, FileText, Code, Clock } from "lucide-react";
import { useState } from "react";

// Mock submission data
const mockSubmissions: Array<{
  id: string;
  problemTitle: string;
  language: string;
  status: Status;
  timestamp: string;
  attemptNumber: number;
  points: number;
}> = [
  {
    id: "sub_001",
    problemTitle: "Two Sum",
    language: "Python",
    status: "accepted",
    timestamp: "2024-01-15 14:32:15",
    attemptNumber: 2,
    points: 0.5
  },
  {
    id: "sub_002", 
    problemTitle: "Binary Search",
    language: "C++",
    status: "pending",
    timestamp: "2024-01-15 14:30:45",
    attemptNumber: 1,
    points: 0
  },
  {
    id: "sub_003",
    problemTitle: "Dynamic Programming Basic",
    language: "Java",
    status: "rejected",
    timestamp: "2024-01-15 14:28:20",
    attemptNumber: 3,
    points: 0
  },
  {
    id: "sub_004",
    problemTitle: "Graph Traversal",
    language: "Python",
    status: "accepted",
    timestamp: "2024-01-15 14:25:10",
    attemptNumber: 1,
    points: 1.0
  }
];

export function MySubmissions() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSubmissions = mockSubmissions.filter(submission =>
    submission.problemTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.language.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPoints = mockSubmissions
    .filter(s => s.status === 'accepted')
    .reduce((sum, s) => sum + s.points, 0);
  
  const totalSubmissions = mockSubmissions.length;
  const acceptedCount = mockSubmissions.filter(s => s.status === 'accepted').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            My Submissions
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your progress and submission history
          </p>
        </div>
        
        <div className="flex gap-4">
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
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search problems or languages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
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
                <TableHead>Language</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempt</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">
                    {submission.problemTitle}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4 text-muted-foreground" />
                      {submission.language}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={submission.status} />
                  </TableCell>
                  <TableCell>#{submission.attemptNumber}</TableCell>
                  <TableCell>
                    <span className={submission.status === 'accepted' ? 'text-accepted font-medium' : 'text-muted-foreground'}>
                      {submission.points || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {new Date(submission.timestamp).toLocaleTimeString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
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
              <p className="text-sm">Start solving problems to see your submissions here!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}