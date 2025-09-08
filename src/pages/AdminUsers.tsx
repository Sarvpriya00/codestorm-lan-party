import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, Download, Upload, Search, UserPlus, Settings, Edit, Trash2, Shield } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import { PERMISSIONS } from "@/constants/permissions";

// Mock user data - in real app this would come from API
const mockUsers = [
  {
    id: "user_001",
    username: "participant_001",
    displayName: "John Doe",
    role: { id: "role_1", name: "participant", description: "Contest Participant" },
    pcCode: "PC-A1",
    ipAddress: "192.168.1.101",
    lastActive: new Date(Date.now() - 2 * 60 * 1000),
    scored: 150,
    problemsSolvedCount: 2,
    submissions: 5,
    accepted: 2
  },
  {
    id: "user_002", 
    username: "participant_002",
    displayName: "Jane Smith",
    role: { id: "role_1", name: "participant", description: "Contest Participant" },
    pcCode: "PC-A2",
    ipAddress: "192.168.1.102", 
    lastActive: new Date(Date.now() - 5 * 60 * 1000),
    scored: 75,
    problemsSolvedCount: 1,
    submissions: 3,
    accepted: 1
  },
  {
    id: "user_003",
    username: "judge_001",
    displayName: "Judge Wilson",
    role: { id: "role_2", name: "judge", description: "Contest Judge" },
    pcCode: "PC-J1",
    ipAddress: "192.168.1.110",
    lastActive: new Date(Date.now() - 1 * 60 * 1000),
    scored: 0,
    problemsSolvedCount: 0,
    submissions: 0,
    accepted: 0
  },
  {
    id: "user_004",
    username: "admin_001",
    displayName: "Administrator",
    role: { id: "role_3", name: "admin", description: "System Administrator" },
    pcCode: "PC-ADMIN",
    ipAddress: "192.168.1.100",
    lastActive: new Date(),
    scored: 0,
    problemsSolvedCount: 0,
    submissions: 0,
    accepted: 0
  }
];

const availableRoles = [
  { id: "role_1", name: "participant", description: "Contest Participant" },
  { id: "role_2", name: "judge", description: "Contest Judge" },
  { id: "role_3", name: "admin", description: "System Administrator" }
];

export function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const { hasPermission } = useAuth();

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         user.pcCode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role.name === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName) {
      case "admin": return "default";
      case "judge": return "secondary"; 
      case "participant": return "outline";
      default: return "outline";
    }
  };

  const formatLastActive = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Active now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const handleEditUser = (user: typeof mockUsers[0]) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    // In real app, this would call API to delete user
    console.log('Delete user:', userId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage participants, judges, and administrators
          </p>
        </div>
        
        <div className="flex gap-2">
          <RoleGuard requiredPermissions={[PERMISSIONS.EXPORTS]} showFallback={false}>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </RoleGuard>
          <RoleGuard requiredPermissions={[PERMISSIONS.USER_CONTROL]} showFallback={false}>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account for the contest platform.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      Username
                    </Label>
                    <Input id="username" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="displayName" className="text-right">
                      Display Name
                    </Label>
                    <Input id="displayName" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                      Role
                    </Label>
                    <Select>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map(role => (
                          <SelectItem key={role.id} value={role.name}>
                            {role.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="pcCode" className="text-right">
                      PC Code
                    </Label>
                    <Input id="pcCode" className="col-span-3" placeholder="PC-A1" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create User</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </RoleGuard>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{mockUsers.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Participants</p>
                <p className="text-2xl font-bold">{mockUsers.filter(u => u.role.name === 'participant').length}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                <span className="text-sm font-bold">P</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Judges</p>
                <p className="text-2xl font-bold">{mockUsers.filter(u => u.role.name === 'judge').length}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-sm font-bold">J</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{mockUsers.filter(u => u.role.name === 'admin').length}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">A</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users or PC codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="participant">Participants</SelectItem>
            <SelectItem value="judge">Judges</SelectItem>
            <SelectItem value="admin">Administrators</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Directory ({filteredUsers.length} users)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>PC Code</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Accepted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{user.username}</p>
                      {user.displayName && (
                        <p className="text-sm text-muted-foreground">{user.displayName}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role.name)}>
                      {user.role.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{user.pcCode || 'N/A'}</TableCell>
                  <TableCell className="font-mono text-sm">{user.ipAddress || 'N/A'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatLastActive(user.lastActive)}
                  </TableCell>
                  <TableCell>{user.submissions}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p>{user.accepted}</p>
                      <p className="text-xs text-muted-foreground">Score: {user.scored}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <RoleGuard requiredPermissions={[PERMISSIONS.USER_CONTROL]} showFallback={false}>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </RoleGuard>
                      <Button variant="ghost" size="sm">
                        <Shield className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role assignments.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-username" className="text-right">
                  Username
                </Label>
                <Input 
                  id="edit-username" 
                  defaultValue={selectedUser.username}
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-displayName" className="text-right">
                  Display Name
                </Label>
                <Input 
                  id="edit-displayName" 
                  defaultValue={selectedUser.displayName || ''}
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">
                  Role
                </Label>
                <Select defaultValue={selectedUser.role.name}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(role => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-pcCode" className="text-right">
                  PC Code
                </Label>
                <Input 
                  id="edit-pcCode" 
                  defaultValue={selectedUser.pcCode || ''}
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Current Score
                </Label>
                <div className="col-span-3 text-sm text-muted-foreground">
                  {selectedUser.scored} points ({selectedUser.problemsSolvedCount} problems solved)
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}