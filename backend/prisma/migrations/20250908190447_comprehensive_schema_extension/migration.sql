/*
  Warnings:

  - You are about to drop the column `code` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - Added the required column `action` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `codeText` to the `Submission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contestId` to the `Submission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `submittedById` to the `Submission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roleId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentPermissionId" TEXT,
    CONSTRAINT "Permission_parentPermissionId_fkey" FOREIGN KEY ("parentPermissionId") REFERENCES "Permission" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "inherited" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PLANNED'
);

-- CreateTable
CREATE TABLE "ContestUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT "ContestUser_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ContestUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuestionProblem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionText" TEXT NOT NULL,
    "difficultyLevel" TEXT NOT NULL,
    "tags" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "maxScore" REAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "QuestionProblem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContestProblem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contestId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "order" INTEGER,
    "points" REAL NOT NULL,
    CONSTRAINT "ContestProblem_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ContestProblem_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "QuestionProblem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "reviewedById" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "correct" BOOLEAN NOT NULL,
    "scoreAwarded" REAL NOT NULL,
    "remarks" TEXT,
    CONSTRAINT "Review_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Review_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "QuestionProblem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Review_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Review_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contestId" TEXT NOT NULL,
    "totalSubmissions" INTEGER NOT NULL,
    "correctSubmissions" INTEGER NOT NULL,
    "activeParticipants" INTEGER NOT NULL,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Analytics_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Leaderboard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" REAL NOT NULL,
    "problemsSolved" INTEGER NOT NULL,
    "lastSubmissionTime" DATETIME,
    CONSTRAINT "Leaderboard_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Leaderboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BackupRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "BackupRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "checkinTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkoutTime" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    CONSTRAINT "Attendance_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemControl" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contestId" TEXT NOT NULL,
    "controlCode" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "setById" TEXT NOT NULL,
    "setAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SystemControl_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SystemControl_setById_fkey" FOREIGN KEY ("setById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "permissionId" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "details" TEXT,
    "actor" TEXT,
    "entity" TEXT,
    "ip" TEXT,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AuditLog" ("actor", "details", "entity", "id", "ip", "timestamp", "userId", "action", "ipAddress") SELECT "actor", "details", "entity", "id", "ip", "timestamp", "userId", COALESCE("entity", "unknown_action"), "ip" FROM "AuditLog";
DROP TABLE "AuditLog";
ALTER TABLE "new_AuditLog" RENAME TO "AuditLog";
CREATE TABLE "new_Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "problemId" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "score" REAL NOT NULL DEFAULT 0,
    "codeText" TEXT NOT NULL,
    "language" TEXT,
    "attemptCount" INTEGER,
    "legacyCreatedAt" DATETIME,
    "legacyUpdatedAt" DATETIME,
    CONSTRAINT "Submission_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "QuestionProblem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Submission_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Submission_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Submission_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
-- First create a default contest for existing submissions
INSERT INTO "Contest" ("id", "name", "description", "status") VALUES ('default-contest-id', 'Legacy Contest', 'Default contest for existing submissions', 'ARCHIVED');

-- Insert existing submissions with default values
INSERT INTO "new_Submission" ("id", "problemId", "contestId", "submittedById", "codeText", "status", "language", "attemptCount", "legacyCreatedAt", "legacyUpdatedAt") 
SELECT "id", "problemId", 'default-contest-id', "userId", COALESCE("code", ''), "status", "language", "attemptCount", "createdAt", "updatedAt" FROM "Submission";
DROP TABLE "Submission";
ALTER TABLE "new_Submission" RENAME TO "Submission";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "password" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "pcCode" TEXT,
    "ipAddress" TEXT,
    "lastActive" DATETIME,
    "scored" REAL NOT NULL DEFAULT 0,
    "problemsSolvedCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- First create default roles
INSERT INTO "Role" ("id", "name", "description") VALUES 
  ('admin-role-id', 'ADMIN', 'Administrator role with full access'),
  ('judge-role-id', 'JUDGE', 'Judge role for reviewing submissions'),
  ('participant-role-id', 'PARTICIPANT', 'Participant role for solving problems');

-- Insert users with role mapping based on their old role enum
INSERT INTO "new_User" ("id", "username", "password", "roleId", "displayName") 
SELECT "id", "username", "password", 
  CASE 
    WHEN "role" = 'ADMIN' THEN 'admin-role-id'
    WHEN "role" = 'JUDGE' THEN 'judge-role-id'
    WHEN "role" = 'PARTICIPANT' THEN 'participant-role-id'
    ELSE 'participant-role-id'
  END,
  "username"
FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "ContestUser_contestId_userId_key" ON "ContestUser"("contestId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ContestProblem_contestId_problemId_key" ON "ContestProblem"("contestId", "problemId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_submissionId_key" ON "Review"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Leaderboard_contestId_userId_key" ON "Leaderboard"("contestId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_contestId_userId_key" ON "Attendance"("contestId", "userId");
