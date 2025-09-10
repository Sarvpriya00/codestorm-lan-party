import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Calendar, Clock, Users, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";



type ContestStatus = "PLANNED" | "RUNNING" | "ENDED" | "ARCHIVED";

interface Contest {
  id: string;
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  status: ContestStatus;
  participants: number;
  problems: number;
}

export function ContestManagement() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { hasPermission } = useAuth();

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const response = await apiClient.get("/contests");
        setContests(response as any);
      } catch (error) {
        console.error("Failed to fetch contests:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContests();
  }, []);

  const getStatusColor = (status: ContestStatus) => {
    switch (status) {
      case "PLANNED": return "secondary";
      case "RUNNING": return "default";
      case "ENDED": return "destructive";
      case "ARCHIVED": return "outline";
      default: return "secondary";
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString();
  };

  const handleCreateContest = () => {
    // In real app, this would call API to create contest
    console.log('Create contest');
    setIsCreateDialogOpen(false);
  };

  const handleEditContest = (contest: Contest) => {
    setSelectedContest(contest);
    setIsEditDialogOpen(true);
  };

  const handleUpdateContest = () => {
    // In real app, this would call API to update contest
    console.log('Update contest:', selectedContest);
    setIsEditDialogOpen(false);
  };

  const handleDeleteContest = (contestId: string) => {
    // In real app, this would call API to delete contest
    setContests(contests.filter(c => c.id !== contestId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contest Management</h2>
          <p className="text-muted-foreground">
            Create and manage programming contests
          </p>
        </div>
        
        {hasPermission(800) && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Contest
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Contest</DialogTitle>
                <DialogDescription>
                  Set up a new programming contest with problems and participants.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Contest Name</Label>
                  <Input id="name" placeholder="CodeStorm 2025" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Contest description..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input id="startTime" type="datetime-local" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input id="endTime" type="datetime-local" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateContest}>Create Contest</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Contest Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Contests</p>
                <p className="text-2xl font-bold">{contests.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Running</p>
                <p className="text-2xl font-bold">
                  {contests.filter(c => c.status === 'RUNNING').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-accepted opacity-60" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Participants</p>
                <p className="text-2xl font-bold">
                  {contests.reduce((sum, c) => sum + c.participants, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Problems</p>
                <p className="text-2xl font-bold">
                  {contests.reduce((sum, c) => sum + c.problems, 0)}
                </p>
              </div>
              <FileText className="h-8 w-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contests Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Contests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Problems</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contests.map((contest) => (
                <TableRow key={contest.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{contest.name}</p>
                      <p className="text-sm text-muted-foreground">{contest.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(contest.status)}>
                      {contest.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDateTime(contest.startTime)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDateTime(contest.endTime)}
                  </TableCell>
                  <TableCell>{contest.participants}</TableCell>
                  <TableCell>{contest.problems}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {hasPermission(800) && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditContest(contest)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteContest(contest.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Contest Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Contest</DialogTitle>
            <DialogDescription>
              Update contest information and settings.
            </DialogDescription>
          </DialogHeader>
          {selectedContest && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Contest Name</Label>
                <Input 
                  id="edit-name" 
                  defaultValue={selectedContest.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea 
                  id="edit-description" 
                  defaultValue={selectedContest.description}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select defaultValue={selectedContest.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNED">Planned</SelectItem>
                    <SelectItem value="RUNNING">Running</SelectItem>
                    <SelectItem value="ENDED">Ended</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-startTime">Start Time</Label>
                  <Input 
                    id="edit-startTime" 
                    type="datetime-local"
                    defaultValue={selectedContest.startTime.toISOString().slice(0, 16)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endTime">End Time</Label>
                  <Input 
                    id="edit-endTime" 
                    type="datetime-local"
                    defaultValue={selectedContest.endTime.toISOString().slice(0, 16)}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateContest}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}