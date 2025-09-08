import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Download, 
  FileText, 
  Database, 
  Users, 
  Trophy, 
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus
} from "lucide-react";
import { adminApi, contestApi } from "@/lib/api";
import { ExportRequest, ExportResult } from "@/types/analytics";

export function ExportManager() {
  const [exports, setExports] = useState<ExportResult[]>([]);
  const [contests, setContests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Export form state
  const [exportType, setExportType] = useState<string>("submissions");
  const [selectedContestId, setSelectedContestId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [format, setFormat] = useState<string>("json");

  // Mock data for demonstration
  const mockExports: ExportResult[] = [
    {
      id: "export1",
      exportType: "submissions",
      filePath: "/exports/submissions_2024-01-15.json",
      fileName: "submissions_2024-01-15.json",
      status: "COMPLETED",
      createdAt: new Date('2024-01-15T10:30:00'),
      completedAt: new Date('2024-01-15T10:32:00'),
      fileSize: 2048576,
      downloadUrl: "/api/exports/export1/download"
    },
    {
      id: "export2",
      exportType: "users",
      filePath: "/exports/users_2024-01-14.csv",
      fileName: "users_2024-01-14.csv",
      status: "COMPLETED",
      createdAt: new Date('2024-01-14T15:20:00'),
      completedAt: new Date('2024-01-14T15:21:00'),
      fileSize: 512000,
      downloadUrl: "/api/exports/export2/download"
    },
    {
      id: "export3",
      exportType: "analytics",
      filePath: "/exports/analytics_2024-01-13.xlsx",
      fileName: "analytics_2024-01-13.xlsx",
      status: "PENDING",
      createdAt: new Date('2024-01-13T09:15:00'),
      fileSize: undefined
    },
    {
      id: "export4",
      exportType: "full",
      filePath: "/exports/full_backup_2024-01-12.json",
      fileName: "full_backup_2024-01-12.json",
      status: "FAILED",
      createdAt: new Date('2024-01-12T08:00:00'),
      fileSize: undefined
    }
  ];

  const mockContests = [
    { id: "contest1", name: "Spring Programming Contest 2024", status: "RUNNING" },
    { id: "contest2", name: "Algorithm Challenge", status: "ENDED" },
    { id: "contest3", name: "Data Structures Marathon", status: "PLANNED" }
  ];

  useEffect(() => {
    // Initialize with mock data
    setExports(mockExports);
    setContests(mockContests);
  }, []);

  const handleCreateExport = async () => {
    try {
      setLoading(true);
      setError(null);

      const exportRequest: ExportRequest = {
        exportType: exportType as any,
        contestId: selectedContestId || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        format: format as any
      };

      // In real implementation, call API
      // const result = await adminApi.exportData(exportRequest.exportType, exportRequest);
      
      // Mock implementation
      const newExport: ExportResult = {
        id: `export${Date.now()}`,
        exportType: exportRequest.exportType,
        filePath: `/exports/${exportRequest.exportType}_${new Date().toISOString().split('T')[0]}.${exportRequest.format}`,
        fileName: `${exportRequest.exportType}_${new Date().toISOString().split('T')[0]}.${exportRequest.format}`,
        status: "PENDING",
        createdAt: new Date(),
        fileSize: undefined
      };

      setExports(prev => [newExport, ...prev]);
      setIsCreateDialogOpen(false);
      
      // Reset form
      setExportType("submissions");
      setSelectedContestId("");
      setStartDate("");
      setEndDate("");
      setFormat("json");

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create export');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (exportResult: ExportResult) => {
    if (exportResult.downloadUrl) {
      // In real implementation, this would trigger the download
      console.log('Downloading:', exportResult.fileName);
      // window.open(exportResult.downloadUrl, '_blank');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'FAILED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getExportTypeIcon = (type: string) => {
    switch (type) {
      case 'submissions':
        return <FileText className="h-4 w-4" />;
      case 'users':
        return <Users className="h-4 w-4" />;
      case 'contests':
        return <Trophy className="h-4 w-4" />;
      case 'analytics':
        return <Database className="h-4 w-4" />;
      case 'full':
        return <Database className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Export Manager</h2>
          <Badge variant="secondary" className="text-sm">
            <Download className="h-3 w-3 mr-1" />
            Data Export
          </Badge>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Export
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Data Export</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exportType">Export Type</Label>
                <Select value={exportType} onValueChange={setExportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select export type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submissions">Submissions</SelectItem>
                    <SelectItem value="users">Users</SelectItem>
                    <SelectItem value="contests">Contests</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="full">Full Backup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {exportType !== 'full' && (
                <div className="space-y-2">
                  <Label htmlFor="contest">Contest (Optional)</Label>
                  <Select value={selectedContestId} onValueChange={setSelectedContestId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All contests" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All contests</SelectItem>
                      {contests.map((contest) => (
                        <SelectItem key={contest.id} value={contest.id}>
                          {contest.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateExport}
                  disabled={loading}
                >
                  {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Create Export
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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

      {/* Export History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exports.map((exportResult) => (
                  <TableRow key={exportResult.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getExportTypeIcon(exportResult.exportType)}
                        <span className="capitalize">{exportResult.exportType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {exportResult.fileName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(exportResult.status)}
                        <Badge variant={getStatusBadgeVariant(exportResult.status)}>
                          {exportResult.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {exportResult.createdAt.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatFileSize(exportResult.fileSize)}
                    </TableCell>
                    <TableCell className="text-right">
                      {exportResult.status === 'COMPLETED' && exportResult.downloadUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(exportResult)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                      {exportResult.status === 'PENDING' && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Processing
                        </Badge>
                      )}
                      {exportResult.status === 'FAILED' && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      )}
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