# CodeStorm Platform - Role and Permission Management

## Overview

The CodeStorm platform implements a hierarchical role-based access control (RBAC) system that provides fine-grained control over user permissions and system access.

## Permission System Architecture

### Permission Hierarchy

The system uses a hierarchical permission structure where parent permissions automatically grant access to child permissions:

```
Dashboard (100)
Problems (200)
├── View Question (210)
├── Add Submission (220)
└── Total Score (230)
Judge Queue (300)
├── View Submission (310)
└── View Queue List (320)
Users (500)
Analytics (600)
Exports (700)
Contest Control (800)
├── Timer Control (810)
├── Phase Control (820)
├── Display Control (830)
├── Emergency Actions (840)
├── Problem Control (850)
└── User Control (860)
Audit Log (900)
Backup (1000)
Attendance (1100)
```

### Permission Codes

| Code | Name | Description | Parent |
|------|------|-------------|---------|
| 100 | Dashboard | Access to dashboard | - |
| 200 | Problems | Access to problems | - |
| 210 | View Question | View question details | 200 |
| 220 | Add Submission | Submit solutions | 200 |
| 230 | Total Score | View total score | 200 |
| 300 | Judge Queue | Access to judge queue | - |
| 310 | View Submission | View submissions for judging | 300 |
| 320 | View Queue List | View judge queue list | 300 |
| 500 | Users | User management | - |
| 600 | Analytics | Access to analytics | - |
| 700 | Exports | Data export capabilities | - |
| 800 | Contest Control | Contest management | - |
| 810 | Timer Control | Contest timer control | 800 |
| 820 | Phase Control | Contest phase control | 800 |
| 830 | Display Control | Contest display control | 800 |
| 840 | Emergency Actions | Emergency contest actions | 800 |
| 850 | Problem Control | Contest problem management | 800 |
| 860 | User Control | Contest user management | 800 |
| 900 | Audit Log | Access to audit logs | - |
| 1000 | Backup | System backup management | - |
| 1100 | Attendance | Attendance tracking | - |

## Default Roles

### Admin Role
**Full system access with all administrative capabilities**

Permissions:
- Dashboard (100)
- Users (500)
- Analytics (600)
- Exports (700)
- Contest Control (800) + all sub-permissions
- Audit Log (900)
- Backup (1000)
- Attendance (1100)

Capabilities:
- Create and manage users
- Assign roles and permissions
- Create and control contests
- Access all analytics and reports
- Perform system backups
- View audit logs
- Emergency system controls

### Judge Role
**Contest judging and submission review**

Permissions:
- Judge Queue (300)
- View Submission (310)
- View Queue List (320)

Capabilities:
- Access judge queue
- Review and score submissions
- Provide feedback on solutions
- View submission details

### Participant Role
**Contest participation and problem solving**

Permissions:
- Problems (200)
- View Question (210)
- Add Submission (220)
- Total Score (230)

Capabilities:
- View contest problems
- Submit solutions
- View own submissions
- Track personal score

## Role Management Operations

### Creating Custom Roles

#### Via API
```bash
curl -X POST http://localhost:3001/api/admin/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "name": "senior_judge",
    "description": "Senior judge with additional permissions",
    "permissions": [300, 310, 320, 600]
  }'
```

#### Via Database
```sql
-- Create role
INSERT INTO Role (id, name, description) 
VALUES (lower(hex(randomblob(16))), 'senior_judge', 'Senior judge with analytics access');

-- Assign permissions
INSERT INTO RolePermission (id, roleId, permissionId, inherited) 
VALUES 
  (lower(hex(randomblob(16))), '<role-id>', '<permission-id>', false);
```

### Modifying Roles

#### Add Permission to Role
```bash
curl -X POST http://localhost:3001/api/admin/roles/<role-id>/permissions \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"permissionId": "<permission-id>"}'
```

#### Remove Permission from Role
```bash
curl -X DELETE http://localhost:3001/api/admin/roles/<role-id>/permissions/<permission-id> \
  -H "Authorization: Bearer <admin-token>"
```

### User Role Assignment

#### Assign Role to User
```bash
curl -X PATCH http://localhost:3001/api/admin/users/<user-id>/role \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"roleId": "<role-id>"}'
```

#### Bulk Role Assignment
```bash
curl -X POST http://localhost:3001/api/admin/users/bulk-role-assignment \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "userIds": ["<user-id-1>", "<user-id-2>"],
    "roleId": "<role-id>"
  }'
```

## Permission Checking

### Frontend Permission Checking

```typescript
// Using RoleGuard component
<RoleGuard requiredPermissions={[200, 210]}>
  <ProblemList />
</RoleGuard>

// Using permission hook
const { hasPermission } = usePermissions();
if (hasPermission(500)) {
  // Show user management interface
}
```

### Backend Permission Checking

```typescript
// Middleware-based checking
app.get('/api/admin/users', 
  authenticateToken,
  authorizePermissions([500]),
  getUsersController
);

// Service-level checking
const hasPermission = await permissionService.checkPermission(userId, 500);
if (!hasPermission) {
  throw new Error('Insufficient permissions');
}
```

## Common Role Scenarios

### Contest Administrator
**Manages contests but not system users**

Permissions:
- Dashboard (100)
- Contest Control (800) + all sub-permissions
- Analytics (600)
- Attendance (1100)

### Problem Manager
**Manages problems and submissions**

Permissions:
- Problems (200) + all sub-permissions
- Contest Control (850) - Problem Control only
- Analytics (600)

### Senior Judge
**Judge with analytics access**

Permissions:
- Judge Queue (300) + all sub-permissions
- Analytics (600)

### Contest Participant with Monitoring
**Participant who can view analytics**

Permissions:
- Problems (200) + all sub-permissions
- Analytics (600) - read-only

## Permission Inheritance

### How Inheritance Works

1. **Direct Permissions**: Explicitly assigned to a role
2. **Inherited Permissions**: Automatically granted through parent permissions
3. **Effective Permissions**: Combination of direct and inherited permissions

### Example: Contest Control Permission

When a role is granted "Contest Control (800)", it automatically receives:
- Timer Control (810)
- Phase Control (820)
- Display Control (830)
- Emergency Actions (840)
- Problem Control (850)
- User Control (860)

### Checking Inheritance

```sql
-- View all effective permissions for a role
WITH RECURSIVE permission_tree AS (
  -- Direct permissions
  SELECT p.id, p.code, p.name, p.parentPermissionId, 0 as level
  FROM Permission p
  JOIN RolePermission rp ON p.id = rp.permissionId
  WHERE rp.roleId = '<role-id>'
  
  UNION ALL
  
  -- Inherited permissions
  SELECT p.id, p.code, p.name, p.parentPermissionId, pt.level + 1
  FROM Permission p
  JOIN permission_tree pt ON p.parentPermissionId = pt.id
)
SELECT DISTINCT code, name, level
FROM permission_tree
ORDER BY code;
```

## Security Considerations

### Principle of Least Privilege
- Grant minimum permissions necessary for role function
- Regularly review and audit role permissions
- Remove unused permissions promptly

### Permission Escalation Prevention
- Hierarchical permissions prevent unauthorized escalation
- Admin permissions required to modify roles
- Audit logging tracks all permission changes

### Role Separation
- Separate roles for different functions
- Avoid combining conflicting permissions
- Use specific roles rather than broad permissions

## Troubleshooting

### Common Issues

#### User Cannot Access Feature
1. Check user's role assignment
2. Verify role has required permissions
3. Check permission hierarchy
4. Review frontend permission guards

```bash
# Check user permissions
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <user-token>"
```

#### Permission Not Working
1. Verify permission code is correct
2. Check parent-child relationships
3. Ensure role-permission mapping exists
4. Clear any cached permissions

```sql
-- Check role-permission mapping
SELECT r.name as role, p.name as permission, p.code
FROM Role r
JOIN RolePermission rp ON r.id = rp.roleId
JOIN Permission p ON rp.permissionId = p.id
WHERE r.name = '<role-name>';
```

#### Inheritance Not Working
1. Verify parent-child permission relationships
2. Check permission hierarchy setup
3. Ensure inheritance flag is set correctly

```sql
-- Check permission hierarchy
SELECT p1.name as parent, p2.name as child
FROM Permission p1
JOIN Permission p2 ON p1.id = p2.parentPermissionId;
```

## Best Practices

### Role Design
1. **Functional Roles**: Design roles around job functions
2. **Granular Permissions**: Use specific permissions rather than broad access
3. **Regular Review**: Periodically review and update role definitions
4. **Documentation**: Document role purposes and permission rationale

### Permission Management
1. **Hierarchical Structure**: Use parent-child relationships effectively
2. **Consistent Naming**: Use clear, consistent permission names
3. **Code Organization**: Group related permissions with similar code ranges
4. **Audit Trail**: Maintain logs of all permission changes

### User Assignment
1. **Default Roles**: Assign appropriate default roles to new users
2. **Temporary Access**: Use time-limited role assignments when needed
3. **Regular Cleanup**: Remove inactive users and unused roles
4. **Bulk Operations**: Use bulk assignment for efficiency

## Migration and Updates

### Adding New Permissions
1. Add permission to database with appropriate parent
2. Update role definitions to include new permission
3. Update frontend components to use new permission
4. Test permission checking thoroughly

### Modifying Existing Permissions
1. Plan changes carefully to avoid breaking access
2. Update all dependent roles and components
3. Communicate changes to administrators
4. Provide migration path for existing data

### Role Restructuring
1. Create new roles with desired permissions
2. Migrate users to new roles gradually
3. Deprecate old roles after migration
4. Clean up unused permissions and roles

---

This role management system provides flexible, secure access control while maintaining simplicity for administrators. Regular review and maintenance ensure the system remains effective and secure.