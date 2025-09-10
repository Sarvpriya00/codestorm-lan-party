import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  RefreshCw, 
  AlertCircle,
  Calendar,
  UserCheck,
  UserX,
  Timer
} from "lucide-react";
import { adminApi, contestApi } from "@/lib/api";
import { AttendanceRecord } from "@/types/analytics";

export function AttendanceTracker() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [contests, setContests] = useState<any[]>([]);
  const [selectedContestId, setSelectedContestId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data for demonstration
  const mockAttendance: AttendanceRecord[] = [
    {
      id: "att1",
      contestId: "contest1",
      userId: "user1",
      username: "participant_001",
      displayName: "Alice Johnson",
      checkinTime: new Date('2025-01-15T09:00:00'),
      checkoutTime: new Date('2025-01-15T17:30:00'),
      status: "PRESENT"
    },
    {
      id: "att2",
      contestId: "contest1",
      userId: "user2",
      username: "participant_002",
      displayName: "Bob Smith",
      checkinTime: new Date('2025-01-15T09:15:00'),
      checkoutTime: new Date('2025-01-15T16:45:00'),
      status: "PRESENT"
    },
    {
      id: "att3",
      contestId: "contest1",
      userId: "user3",
      username: "participant_003",
      displayName: "Carol Davis",
      checkinTime: new Date('2025-01-15T09:30:00'),
      checkoutTime: undefined,
      status: "PRESENT"
    },
    {
      id: "att4",
      contestId: "contest1",
      userId: "user4",
      username: "participant_004",
      displayName: "David Wilson",
      checkinTime: new Date('2025-01-15T10:00:00'),
      checkoutTime: new Date('2025-01-15T14:30:00'),
      status: "PRESENT"
    },
    {
      id: "att5",
      contestId: "contest1",
      userId: "user5",
      username: "participant_005",
      displayName: "Eva Brown",
      checkinTime: new Date('2025-01-15T09:00:00'),
      checkoutTime: undefined,
      status: "ABSENT"
    }
  ];

  const mockContests = [
    { id: "contest1", name: "Spring Programming Contest 2025", status: "RUNNING" },
    { id: "contest2", name: "Algorithm Challenge", status: "ENDED" },
    { id: "contest3", name: "Data Structures Marathon", status: "PLANNED" }
  ];

  useEffect(() => {
    // Initialize with mock data
    setAttendanceRecords(mockAttendance);
    setContests(mockContests);
    if (mockContests.length > 0) {
      setSelectedContestId(mockContests[0].id);
    }
  }, []);

  const fetchAttendance = async (contestId: string) => {
    if (!contestId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // In real implementation, call API
      // const data = await adminApi.getAttendance(contestId);
      // setAttendanceRecords(data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedContestId) {
      fetchAttendance(selectedContestId);
    }
  }, [selectedContestId]);

  const handleRefresh = () => {
    if (selectedContestId) {
      fetchAttendance(selectedContestId);
    }
  };

  const handleUpdateAttendance = async (attendanceId: string, status: 'PRESENT' | 'ABSENT') => {
    try {
      // In real implementation, call API
      // await adminApi.updateAttendance({ id: attendanceId, status });
      
      // Mock implementation
      setAttendanceRecords(prev => 
        prev.map(record => 
          record.id === attendanceId 
            ? { ...record, status }
            : record
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update attendance');
    }
  };

  // Filter attendance records
  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesContest = !selectedContestId || record.contestId === selectedContestId;
    
    return matchesSearch && matchesStatus && matchesContest;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'ABSENT':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'default';
      case 'ABSENT':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const calculateDuration = (checkin: Date, checkout?: Date) => {
    const end = checkout || new Date();
    const duration = end.getTime() - checkin.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Calculate statistics
  const totalParticipants = filteredRecords.length;
  const presentCount = filteredRecords.filter(r => r.status === 'PRESENT').length;
  const absentCount = filteredRecords.filter(r => r.status === 'ABSENT').length;
  const attendanceRate = totalParticipants > 0 ? Math.round((presentCount / totalParticipants) * 100) : 0;
  const currentlyActive = filteredRecords.filter(r => r.status === 'PRESENT' && !r.checkoutTime).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Attendance Tracker</h2>
          <Badge variant="secondary" className="text-sm">
            <UserCheck className="h-3 w-3 mr-1" />
            {attendanceRate}% Present
          </Badge>
        </div>
        
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Participants</p>
                <p className="text-3xl font-bold">{totalParticipants}</p>
                <p className="text-xs text-muted-foreground mt-1">registered</p>
              </div>
              <Users className="h-10 w-10 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Present</p>
                <p className="text-3xl font-bold text-green-600">{presentCount}</p>
                <p className="text-xs text-muted-foreground mt-1">{attendanceRate}% attendance</p>
              </div>
              <UserCheck className="h-10 w-10 text-green-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Absent</p>
                <p className="text-3xl font-bold text-red-600">{absentCount}</p>
                <p className="text-xs text-muted-foreground mt-1">not present</p>
              </div>
              <UserX className="h-10 w-10 text-red-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Currently Active</p>
                <p className="text-3xl font-bold">{currentlyActive}</p>
                <p className="text-xs text-muted-foreground mt-1">not checked out</p>
              </div>
              <Timer className="h-10 w-10 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Select value={selectedContestId} onValueChange={setSelectedContestId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select contest" />
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

            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search participants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="PRESENT">Present</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead>Check-out Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.displayName || record.username}</p>
                        <p className="text-sm text-muted-foreground">@{record.username}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(record.status)}
                        <Badge variant={getStatusBadgeVariant(record.status)}>
                          {record.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {record.checkinTime.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {record.checkoutTime 
                        ? record.checkoutTime.toLocaleString()
                        : <Badge variant="outline" className="text-xs">Still active</Badge>
                      }
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {calculateDuration(record.checkinTime, record.checkoutTime)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {record.status === 'ABSENT' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateAttendance(record.id, 'PRESENT')}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Mark Present
                          </Button>
                        )}
                        {record.status === 'PRESENT' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateAttendance(record.id, 'ABSENT')}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Mark Absent
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}