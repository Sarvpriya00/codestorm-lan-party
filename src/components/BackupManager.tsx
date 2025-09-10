import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Shield,
  HardDrive,
  Plus
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { BackupRecord } from "@/types/analytics";

export function BackupManager() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState<string | null>(null);

  // Mock data for demonstration
  const mockBackups: BackupRecord[] = [
    {
      id: "backup1",
      createdAt: new Date('2025-01-15T02:00:00'),
      createdById: "admin1",
      createdByName: "System Admin",
      filePath: "/backups/backup_2025-01-15_02-00-00.sql",
      status: "SUCCESS",
      fileSize: 15728640 // 15MB
    },
    {
      id: "backup2",
      createdAt: new Date('2025-01-14T02:00:00'),
      createdById: "admin1",
      createdByName: "System Admin",
      filePath: "/backups/backup_2025-01-14_02-00-00.sql",
      status: "SUCCESS",
      fileSize: 14680064 // 14MB
    },
    {
      id: "backup3",
      createdAt: new Date('2025-01-13T02:00:00'),
      createdById: "admin2",
      createdByName: "John Doe",
      filePath: "/backups/backup_2025-01-13_02-00-00.sql",
      status: "SUCCESS",
      fileSize: 13631488 // 13MB
    },
    {
      id: "backup4",
      createdAt: new Date('2025-01-12T02:00:00'),
      createdById: "admin1",
      createdByName: "System Admin",
      filePath: "/backups/backup_2025-01-12_02-00-00.sql",
      status: "FAILED",
      fileSize: undefined
    }
  ];

  useEffect(() => {
    // Initialize with mock data
    setBackups(mockBackups);
  }, []);

  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true);
      setError(null);

      // In real implementation, call API
      // const result = await adminApi.createBackup();
      
      // Mock implementation
      const newBackup: BackupRecord = {
        id: `backup${Date.now()}`,
        createdAt: new Date(),
        createdById: "current_user",
        createdByName: "Current User",
        filePath: `/backups/backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`,
        status: "SUCCESS",
        fileSize: Math.floor(Math.random() * 20000000) + 10000000 // Random size between 10-30MB
      };

      // Simulate processing time
      setTimeout(() => {
        setBackups(prev => [newBackup, ...prev]);
        setCreatingBackup(false);
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create backup');
      setCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    try {
      setRestoringBackup(backupId);
      setError(null);

      // In real implementation, call API
      // await adminApi.restoreBackup(backupId);
      
      // Mock implementation - simulate restore process
      setTimeout(() => {
        setRestoringBackup(null);
        // Show success message or redirect
      }, 5000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore backup');
      setRestoringBackup(null);
    }
  };

  const handleDownloadBackup = (backup: BackupRecord) => {
    // In real implementation, this would trigger the download
    console.log('Downloading backup:', backup.filePath);
    // window.open(`/api/backups/${backup.id}/download`, '_blank');
  };

  const handleDeleteBackup = (backupId: string) => {
    // In real implementation, call API to delete
    setBackups(prev => prev.filter(b => b.id !== backupId));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'default';
      case 'FAILED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const successfulBackups = backups.filter(b => b.status === 'SUCCESS');
  const totalBackupSize = successfulBackups.reduce((sum, b) => sum + (b.fileSize || 0), 0);
  const latestBackup = successfulBackups[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Backup Manager</h2>
          <Badge variant="secondary" className="text-sm">
            <Shield className="h-3 w-3 mr-1" />
            System Backup
          </Badge>
        </div>
        
        <Button 
          onClick={handleCreateBackup}
          disabled={creatingBackup}
        >
          {creatingBackup ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Backup
            </>
          )}
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

      {/* Backup Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Backups</p>
                <p className="text-3xl font-bold">{backups.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {successfulBackups.length} successful
                </p>
              </div>
              <Database className="h-10 w-10 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Storage Used</p>
                <p className="text-3xl font-bold">{formatFileSize(totalBackupSize)}</p>
                <p className="text-xs text-muted-foreground mt-1">total backup size</p>
              </div>
              <HardDrive className="h-10 w-10 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Latest Backup</p>
                <p className="text-lg font-bold">
                  {latestBackup 
                    ? latestBackup.createdAt.toLocaleDateString()
                    : 'None'
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {latestBackup 
                    ? `${formatFileSize(latestBackup.fileSize)}`
                    : 'No backups available'
                  }
                </p>
              </div>
              <Clock className="h-10 w-10 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>File Size</TableHead>
                  <TableHead>File Path</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell className="text-sm">
                      <div>
                        <p className="font-medium">
                          {backup.createdAt.toLocaleDateString()}
                        </p>
                        <p className="text-muted-foreground">
                          {backup.createdAt.toLocaleTimeString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(backup.status)}
                        <Badge variant={getStatusBadgeVariant(backup.status)}>
                          {backup.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {backup.createdByName}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatFileSize(backup.fileSize)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {backup.filePath}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {backup.status === 'SUCCESS' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadBackup(backup)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={restoringBackup === backup.id}
                                >
                                  {restoringBackup === backup.id ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Upload className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Restore Backup</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to restore this backup? This will replace all current data with the backup data from {backup.createdAt.toLocaleString()}. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRestoreBackup(backup.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Restore Backup
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Backup</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this backup? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteBackup(backup.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Backup Schedule Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Backup Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium">Automatic Daily Backup</p>
                <p className="text-sm text-muted-foreground">
                  Scheduled to run every day at 2:00 AM
                </p>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>• Backups are automatically created daily at 2:00 AM</p>
              <p>• Backups older than 30 days are automatically deleted</p>
              <p>• Manual backups can be created at any time</p>
              <p>• All backups include complete database and file system data</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}