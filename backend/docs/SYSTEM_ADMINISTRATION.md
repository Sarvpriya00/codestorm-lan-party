# CodeStorm Platform - System Administration Guide

## Overview

This guide provides comprehensive instructions for administering the CodeStorm competitive programming platform, including user management, role assignment, system configuration, and troubleshooting.

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [User Management](#user-management)
3. [Role and Permission Management](#role-and-permission-management)
4. [Contest Administration](#contest-administration)
5. [Database Management](#database-management)
6. [System Monitoring](#system-monitoring)
7. [Backup and Recovery](#backup-and-recovery)
8. [Troubleshooting](#troubleshooting)
9. [Security Best Practices](#security-best-practices)

## Initial Setup

### 1. Environment Configuration

Copy the example environment file and configure it for your environment:

```bash
cp .env.example .env
```

Key configuration variables:

- `DATABASE_URL`: Database connection string
- `JWT_SECRET`: Secret key for JWT tokens (change in production!)
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 3001)
- `CORS_ORIGIN`: Frontend URL for CORS

### 2. Database Setup

Run the deployment script to set up the database:

```bash
./scripts/deploy.sh
```

Or manually:

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Run data migrations
npm run migrate:all

# Seed initial data (development only)
npm run seed
```

### 3. Health Check

Verify system health:

```bash
./scripts/health-check.sh
```

## User Management

### Creating Users

Users can be created through the API or directly in the database:

#### Via API (Admin required)
```bash
curl -X POST http://localhost:3001/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "username": "newuser",
    "displayName": "New User",
    "password": "securepassword",
    "roleId": "<role-id>"
  }'
```

#### Via Database (Emergency)
```sql
-- Connect to database
sqlite3 prisma/dev.db

-- Create user with participant role
INSERT INTO User (id, username, displayName, password, roleId) 
VALUES (
  lower(hex(randomblob(16))),
  'emergency_admin',
  'Emergency Admin',
  '$2b$12$hashed_password_here',
  (SELECT id FROM Role WHERE name = 'admin')
);
```

### User Status Management

- **Active**: User can log in and participate
- **Suspended**: User cannot log in
- **Banned**: User is permanently blocked

Update user status via API:
```bash
curl -X PATCH http://localhost:3001/api/admin/users/<user-id>/status \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"status": "active"}'
```

## Role and Permission Management

### Default Roles

The system comes with three default roles:

1. **Admin** (Full system access)
   - Dashboard (100)
   - Users (500)
   - Analytics (600)
   - Exports (700)
   - Contest Control (800)
   - Audit Log (900)
   - Backup (1000)
   - Attendance (1100)

2. **Judge** (Submission review)
   - Judge Queue (300)
   - View Submission (310)
   - View Queue List (320)

3. **Participant** (Contest participation)
   - Problems (200)
   - View Question (210)
   - Add Submission (220)
   - Total Score (230)

### Permission Hierarchy

Permissions follow a hierarchical structure:
- Parent permissions automatically grant child permissions
- Example: Contest Control (800) grants all sub-permissions (810, 820, etc.)

### Managing Roles

#### Create Custom Role
```bash
curl -X POST http://localhost:3001/api/admin/roles \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "name": "custom_role",
    "description": "Custom role description",
    "permissions": [200, 210, 220]
  }'
```

#### Assign Role to User
```bash
curl -X PATCH http://localhost:3001/api/admin/users/<user-id>/role \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"roleId": "<role-id>"}'
```

### Emergency Admin Access

If you're locked out of the admin account:

1. Connect to the database directly:
```bash
sqlite3 prisma/dev.db
```

2. Create emergency admin:
```sql
-- Get admin role ID
SELECT id FROM Role WHERE name = 'admin';

-- Create emergency admin user
INSERT INTO User (id, username, displayName, password, roleId) 
VALUES (
  lower(hex(randomblob(16))),
  'emergency_admin',
  'Emergency Admin',
  '$2b$12$LQv3c1yqBwlFnYtM8uL.AuOiQ505smyWFOaOKdOpsL6cM4Aasj/4.',  -- password: 'emergency123'
  '<admin-role-id>'
);
```

## Contest Administration

### Contest Lifecycle

1. **Planning Phase**
   - Create contest
   - Add problems
   - Set participants
   - Configure settings

2. **Running Phase**
   - Monitor submissions
   - Handle issues
   - Manage judges

3. **Results Phase**
   - Finalize scores
   - Generate reports
   - Archive contest

### Contest Management Commands

```bash
# Check contest status
npm run migrate:status

# Create contest backup
curl -X POST http://localhost:3001/api/admin/backup \
  -H "Authorization: Bearer <admin-token>"

# Emergency contest stop
curl -X POST http://localhost:3001/api/admin/emergency/stop \
  -H "Authorization: Bearer <admin-token>"
```

### Problem Management

- Problems are stored as QuestionProblem entities
- Each problem has difficulty, tags, and scoring
- Problems can be assigned to multiple contests

### Submission Monitoring

Monitor submission queue:
```bash
# View pending submissions
curl http://localhost:3001/api/judge/queue \
  -H "Authorization: Bearer <judge-token>"

# Check system metrics
curl http://localhost:3001/api/admin/analytics/system \
  -H "Authorization: Bearer <admin-token>"
```

## Database Management

### Migration Commands

```bash
# Check migration status
npm run migrate:status

# Run specific migration
npm run migrate:problems    # Legacy problems
npm run migrate:users      # User role system
npm run migrate:scores     # Score events
npm run migrate:contests   # Contest states

# Run all migrations
npm run migrate:all
```

### Database Backup

```bash
# Manual backup
cp prisma/dev.db backups/manual-$(date +%Y%m%d-%H%M%S).db

# Automated backup (via API)
curl -X POST http://localhost:3001/api/admin/backup \
  -H "Authorization: Bearer <admin-token>"
```

### Database Maintenance

```bash
# Vacuum database (SQLite)
sqlite3 prisma/dev.db "VACUUM;"

# Check database integrity
sqlite3 prisma/dev.db "PRAGMA integrity_check;"

# Analyze database statistics
sqlite3 prisma/dev.db "ANALYZE;"
```

## System Monitoring

### Health Checks

```bash
# Full system health check
./scripts/health-check.sh

# Quick status check
curl http://localhost:3001/api/health
```

### Log Monitoring

```bash
# View application logs
tail -f logs/application.log

# View deployment logs
tail -f logs/deployment.log

# View migration logs
tail -f logs/migration.log
```

### Performance Monitoring

Key metrics to monitor:
- Response times
- Database query performance
- Memory usage
- Disk space
- Active connections

### Alerts and Notifications

Set up monitoring for:
- High error rates
- Database connection failures
- Disk space warnings
- Memory usage spikes

## Backup and Recovery

### Backup Strategy

1. **Automated Daily Backups**
   - Configured via `AUTO_BACKUP_ENABLED=true`
   - Runs at 2 AM daily by default
   - Retention: 30 days

2. **Pre-deployment Backups**
   - Automatic before migrations
   - Stored in `backups/deployment/`

3. **Manual Backups**
   - On-demand via API
   - Before major changes

### Recovery Procedures

#### Full System Recovery
```bash
# Stop the application
pkill -f "node.*index.js"

# Restore database
cp backups/backup-YYYYMMDD-HHMMSS.db prisma/dev.db

# Restart application
npm start
```

#### Partial Data Recovery
```bash
# Connect to backup database
sqlite3 backups/backup-YYYYMMDD-HHMMSS.db

# Export specific data
.output recovery_data.sql
.dump User

# Import to current database
sqlite3 prisma/dev.db < recovery_data.sql
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```bash
# Check database file permissions
ls -la prisma/dev.db

# Verify database integrity
sqlite3 prisma/dev.db "PRAGMA integrity_check;"

# Regenerate Prisma client
npx prisma generate
```

#### 2. Authentication Issues
```bash
# Check JWT secret configuration
grep JWT_SECRET .env

# Verify user exists and role is assigned
sqlite3 prisma/dev.db "SELECT u.username, r.name FROM User u JOIN Role r ON u.roleId = r.id;"
```

#### 3. Permission Errors
```bash
# Check user permissions
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <token>"

# Verify role-permission mappings
sqlite3 prisma/dev.db "SELECT r.name, p.name FROM Role r JOIN RolePermission rp ON r.id = rp.roleId JOIN Permission p ON rp.permissionId = p.id;"
```

#### 4. Migration Failures
```bash
# Check migration status
npx prisma migrate status

# Reset database (CAUTION: Data loss)
npx prisma migrate reset

# Manual migration rollback
sqlite3 prisma/dev.db "DELETE FROM _prisma_migrations WHERE migration_name = 'failed_migration';"
```

### Debug Mode

Enable debug logging:
```bash
export DEBUG=codestorm:*
npm start
```

### Performance Issues

```bash
# Check database query performance
sqlite3 prisma/dev.db "EXPLAIN QUERY PLAN SELECT * FROM User;"

# Monitor system resources
top -p $(pgrep -f "node.*index.js")

# Check for memory leaks
node --inspect dist/index.js
```

## Security Best Practices

### 1. Environment Security
- Change default JWT secret in production
- Use strong passwords for admin accounts
- Enable HTTPS in production
- Configure proper CORS origins

### 2. Database Security
- Regular backups
- Encrypt sensitive data
- Use prepared statements (Prisma handles this)
- Monitor for SQL injection attempts

### 3. Access Control
- Implement principle of least privilege
- Regular permission audits
- Monitor failed login attempts
- Use strong password policies

### 4. System Security
- Keep dependencies updated
- Regular security scans
- Monitor system logs
- Implement rate limiting

### 5. Audit Logging
- All admin actions are logged
- Regular audit log reviews
- Secure log storage
- Log retention policies

## Emergency Procedures

### System Lockdown
```bash
# Emergency stop all services
curl -X POST http://localhost:3001/api/admin/emergency/lockdown \
  -H "Authorization: Bearer <admin-token>"
```

### Contest Emergency Stop
```bash
# Stop active contest
curl -X POST http://localhost:3001/api/admin/emergency/stop-contest \
  -H "Authorization: Bearer <admin-token>"
```

### Data Corruption Recovery
1. Stop the application
2. Restore from latest backup
3. Run integrity checks
4. Restart application
5. Verify system functionality

## Support and Maintenance

### Regular Maintenance Tasks

**Daily:**
- Check system health
- Review error logs
- Monitor disk space

**Weekly:**
- Review audit logs
- Check backup integrity
- Update dependencies

**Monthly:**
- Performance review
- Security audit
- Database optimization

### Getting Help

1. Check logs first: `./scripts/health-check.sh`
2. Review this documentation
3. Check GitHub issues
4. Contact system administrator

---

For additional support or questions, please refer to the project documentation or contact the development team.