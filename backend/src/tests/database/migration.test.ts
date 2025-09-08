import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

describe('Database Migration and Schema Validation Tests', () => {
  beforeAll(async () => {
    // Ensure we're working with a clean test database
    process.env.DATABASE_URL = 'file:./test-migration.db';
  });

  afterAll(async () => {
    await prisma.$disconnect();
    
    // Clean up test database file
    const dbPath = './test-migration.db';
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });

  describe('Schema Validation', () => {
    it('should have all required tables', async () => {
      // Run migrations to create schema
      execSync('npx prisma migrate deploy', { 
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: 'file:./test-migration.db' }
      });

      // Check that all expected tables exist
      const tables = await prisma.$queryRaw`
        SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'
      ` as Array<{ name: string }>;

      const expectedTables = [
        'User',
        'Role',
        'Permission',
        'RolePermission',
        'Contest',
        'ContestUser',
        'QuestionProblem',
        'ContestProblem',
        'Submission',
        'Review',
        'Analytics',
        'Leaderboard',
        'AuditLog',
        'BackupRecord',
        'Attendance',
        'SystemControl',
        // Legacy tables
        'Problem',
        'ScoreEvent',
        'Seat',
        'ContestState'
      ];

      const tableNames = tables.map(t => t.name);
      
      expectedTables.forEach(expectedTable => {
        expect(tableNames).toContain(expectedTable);
      });
    });

    it('should have correct foreign key relationships', async () => {
      // Test User -> Role relationship
      const userForeignKeys = await prisma.$queryRaw`
        PRAGMA foreign_key_list(User)
      ` as Array<any>;

      const roleFK = userForeignKeys.find(fk => fk.table === 'Role');
      expect(roleFK).toBeDefined();
      expect(roleFK.from).toBe('roleId');
      expect(roleFK.to).toBe('id');

      // Test RolePermission relationships
      const rolePermissionFKs = await prisma.$queryRaw`
        PRAGMA foreign_key_list(RolePermission)
      ` as Array<any>;

      expect(rolePermissionFKs).toHaveLength(2);
      expect(rolePermissionFKs.some(fk => fk.table === 'Role')).toBe(true);
      expect(rolePermissionFKs.some(fk => fk.table === 'Permission')).toBe(true);

      // Test Submission relationships
      const submissionFKs = await prisma.$queryRaw`
        PRAGMA foreign_key_list(Submission)
      ` as Array<any>;

      expect(submissionFKs.length).toBeGreaterThanOrEqual(3);
      expect(submissionFKs.some(fk => fk.table === 'QuestionProblem')).toBe(true);
      expect(submissionFKs.some(fk => fk.table === 'Contest')).toBe(true);
      expect(submissionFKs.some(fk => fk.table === 'User')).toBe(true);
    });

    it('should have correct unique constraints', async () => {
      // Test User.username unique constraint
      const userIndexes = await prisma.$queryRaw`
        PRAGMA index_list(User)
      ` as Array<any>;

      const usernameIndex = userIndexes.find(idx => idx.name.includes('username'));
      expect(usernameIndex).toBeDefined();
      expect(usernameIndex.unique).toBe(1);

      // Test Permission.code unique constraint
      const permissionIndexes = await prisma.$queryRaw`
        PRAGMA index_list(Permission)
      ` as Array<any>;

      const codeIndex = permissionIndexes.find(idx => idx.name.includes('code'));
      expect(codeIndex).toBeDefined();
      expect(codeIndex.unique).toBe(1);

      // Test RolePermission composite unique constraint
      const rolePermissionIndexes = await prisma.$queryRaw`
        PRAGMA index_list(RolePermission)
      ` as Array<any>;

      const compositeIndex = rolePermissionIndexes.find(idx => 
        idx.name.includes('roleId') && idx.name.includes('permissionId')
      );
      expect(compositeIndex).toBeDefined();
      expect(compositeIndex.unique).toBe(1);
    });

    it('should have correct column types and constraints', async () => {
      // Test User table structure
      const userColumns = await prisma.$queryRaw`
        PRAGMA table_info(User)
      ` as Array<any>;

      const usernameColumn = userColumns.find(col => col.name === 'username');
      expect(usernameColumn).toBeDefined();
      expect(usernameColumn.notnull).toBe(1);

      const scoredColumn = userColumns.find(col => col.name === 'scored');
      expect(scoredColumn).toBeDefined();
      expect(scoredColumn.dflt_value).toBe('0');

      // Test Contest table structure
      const contestColumns = await prisma.$queryRaw`
        PRAGMA table_info(Contest)
      ` as Array<any>;

      const statusColumn = contestColumns.find(col => col.name === 'status');
      expect(statusColumn).toBeDefined();
      expect(statusColumn.dflt_value).toBe("'PLANNED'");

      // Test Permission table structure
      const permissionColumns = await prisma.$queryRaw`
        PRAGMA table_info(Permission)
      ` as Array<any>;

      const codeColumn = permissionColumns.find(col => col.name === 'code');
      expect(codeColumn).toBeDefined();
      expect(codeColumn.notnull).toBe(1);
    });
  });

  describe('Data Migration Validation', () => {
    it('should handle legacy data migration', async () => {
      // Create some legacy data
      await prisma.problem.create({
        data: {
          title: 'Legacy Problem',
          description: 'A legacy problem',
          difficulty: 'EASY',
          points: 100,
          test_cases: { input: 'test', output: 'test' }
        }
      });

      // Run migration script (this would be your actual migration)
      // For testing, we'll simulate the migration
      const legacyProblems = await prisma.problem.findMany();
      
      for (const legacyProblem of legacyProblems) {
        await prisma.questionProblem.create({
          data: {
            questionText: `${legacyProblem.title}\n\n${legacyProblem.description}`,
            difficultyLevel: legacyProblem.difficulty as any,
            maxScore: legacyProblem.points,
            isActive: true
          }
        });
      }

      const migratedProblems = await prisma.questionProblem.findMany();
      expect(migratedProblems).toHaveLength(legacyProblems.length);
      expect(migratedProblems[0].questionText).toContain('Legacy Problem');
    });

    it('should preserve data integrity during migration', async () => {
      // Create test data that should be preserved
      const role = await prisma.role.create({
        data: { name: 'TEST_ROLE', description: 'Test role' }
      });

      const user = await prisma.user.create({
        data: {
          username: 'testuser',
          password: 'hashedpassword',
          roleId: role.id,
          scored: 150.5,
          problemsSolvedCount: 3
        }
      });

      // Verify data integrity
      const retrievedUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { role: true }
      });

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser!.username).toBe('testuser');
      expect(retrievedUser!.scored).toBe(150.5);
      expect(retrievedUser!.problemsSolvedCount).toBe(3);
      expect(retrievedUser!.role.name).toBe('TEST_ROLE');
    });

    it('should handle permission hierarchy migration', async () => {
      // Create parent permission
      const parentPermission = await prisma.permission.create({
        data: {
          code: 100,
          name: 'Dashboard',
          description: 'Access dashboard'
        }
      });

      // Create child permission
      const childPermission = await prisma.permission.create({
        data: {
          code: 110,
          name: 'View Analytics',
          description: 'View dashboard analytics',
          parentPermissionId: parentPermission.id
        }
      });

      // Verify hierarchy
      const retrievedChild = await prisma.permission.findUnique({
        where: { id: childPermission.id },
        include: { parentPermission: true }
      });

      expect(retrievedChild).toBeDefined();
      expect(retrievedChild!.parentPermissionId).toBe(parentPermission.id);
      expect(retrievedChild!.parentPermission!.name).toBe('Dashboard');
    });
  });

  describe('Performance and Indexing', () => {
    it('should have proper indexes for query performance', async () => {
      // Check for indexes on frequently queried columns
      const allIndexes = await prisma.$queryRaw`
        SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL
      ` as Array<any>;

      // Should have index on User.username
      const userUsernameIndex = allIndexes.find(idx => 
        idx.tbl_name === 'User' && idx.sql.includes('username')
      );
      expect(userUsernameIndex).toBeDefined();

      // Should have index on Permission.code
      const permissionCodeIndex = allIndexes.find(idx => 
        idx.tbl_name === 'Permission' && idx.sql.includes('code')
      );
      expect(permissionCodeIndex).toBeDefined();

      // Should have index on Submission.status for judge queue queries
      const submissionStatusIndex = allIndexes.find(idx => 
        idx.tbl_name === 'Submission' && idx.sql.includes('status')
      );
      expect(submissionStatusIndex).toBeDefined();
    });

    it('should handle large dataset queries efficiently', async () => {
      // Create test data
      const role = await prisma.role.create({
        data: { name: 'PERF_TEST', description: 'Performance test role' }
      });

      const contest = await prisma.contest.create({
        data: { name: 'Performance Test Contest', status: 'RUNNING' }
      });

      const problem = await prisma.questionProblem.create({
        data: {
          questionText: 'Performance test problem',
          difficultyLevel: 'EASY',
          maxScore: 100
        }
      });

      // Create multiple users and submissions
      const users = [];
      for (let i = 0; i < 100; i++) {
        const user = await prisma.user.create({
          data: {
            username: `perfuser${i}`,
            password: 'hashedpassword',
            roleId: role.id
          }
        });
        users.push(user);
      }

      // Create submissions
      for (const user of users.slice(0, 50)) {
        await prisma.submission.create({
          data: {
            problemId: problem.id,
            contestId: contest.id,
            submittedById: user.id,
            codeText: 'console.log("test");',
            status: 'PENDING'
          }
        });
      }

      // Test query performance
      const startTime = Date.now();
      const pendingSubmissions = await prisma.submission.findMany({
        where: {
          status: 'PENDING',
          contestId: contest.id
        },
        include: {
          submittedBy: true,
          problem: true
        },
        take: 20
      });
      const queryTime = Date.now() - startTime;

      expect(pendingSubmissions).toHaveLength(20);
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Data Validation and Constraints', () => {
    it('should enforce required fields', async () => {
      // Test User without username
      await expect(prisma.user.create({
        data: {
          password: 'hashedpassword',
          roleId: 'invalid-role-id'
        } as any
      })).rejects.toThrow();

      // Test Permission without code
      await expect(prisma.permission.create({
        data: {
          name: 'Test Permission',
          description: 'Test description'
        } as any
      })).rejects.toThrow();
    });

    it('should enforce foreign key constraints', async () => {
      // Test User with invalid roleId
      await expect(prisma.user.create({
        data: {
          username: 'testuser',
          password: 'hashedpassword',
          roleId: 'non-existent-role-id'
        }
      })).rejects.toThrow();

      // Test Submission with invalid contestId
      await expect(prisma.submission.create({
        data: {
          problemId: 'non-existent-problem-id',
          contestId: 'non-existent-contest-id',
          submittedById: 'non-existent-user-id',
          codeText: 'test code'
        }
      })).rejects.toThrow();
    });

    it('should enforce unique constraints', async () => {
      const role = await prisma.role.create({
        data: { name: 'UNIQUE_TEST', description: 'Test role' }
      });

      // Create first user
      await prisma.user.create({
        data: {
          username: 'uniqueuser',
          password: 'hashedpassword',
          roleId: role.id
        }
      });

      // Try to create second user with same username
      await expect(prisma.user.create({
        data: {
          username: 'uniqueuser',
          password: 'hashedpassword',
          roleId: role.id
        }
      })).rejects.toThrow();
    });

    it('should handle enum constraints', async () => {
      const role = await prisma.role.create({
        data: { name: 'ENUM_TEST', description: 'Test role' }
      });

      // Test invalid difficulty level
      await expect(prisma.questionProblem.create({
        data: {
          questionText: 'Test problem',
          difficultyLevel: 'INVALID_DIFFICULTY' as any,
          maxScore: 100
        }
      })).rejects.toThrow();

      // Test invalid contest status
      await expect(prisma.contest.create({
        data: {
          name: 'Test Contest',
          status: 'INVALID_STATUS' as any
        }
      })).rejects.toThrow();
    });
  });

  describe('Backup and Recovery', () => {
    it('should support database backup operations', async () => {
      // Create test data
      const role = await prisma.role.create({
        data: { name: 'BACKUP_TEST', description: 'Backup test role' }
      });

      const user = await prisma.user.create({
        data: {
          username: 'backupuser',
          password: 'hashedpassword',
          roleId: role.id
        }
      });

      // Record backup operation
      const backupRecord = await prisma.backupRecord.create({
        data: {
          createdById: user.id,
          filePath: '/backups/test-backup.sql',
          status: 'SUCCESS'
        }
      });

      expect(backupRecord).toBeDefined();
      expect(backupRecord.status).toBe('SUCCESS');
      expect(backupRecord.filePath).toBe('/backups/test-backup.sql');
    });

    it('should maintain referential integrity during bulk operations', async () => {
      // Create related data
      const role = await prisma.role.create({
        data: { name: 'BULK_TEST', description: 'Bulk test role' }
      });

      const contest = await prisma.contest.create({
        data: { name: 'Bulk Test Contest', status: 'PLANNED' }
      });

      const users = await prisma.user.createMany({
        data: Array.from({ length: 10 }, (_, i) => ({
          username: `bulkuser${i}`,
          password: 'hashedpassword',
          roleId: role.id
        }))
      });

      expect(users.count).toBe(10);

      // Verify all users were created with correct role
      const createdUsers = await prisma.user.findMany({
        where: { roleId: role.id }
      });

      expect(createdUsers).toHaveLength(10);
      createdUsers.forEach(user => {
        expect(user.roleId).toBe(role.id);
      });
    });
  });