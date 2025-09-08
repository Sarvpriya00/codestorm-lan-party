/*
  Warnings:

  - You are about to alter the column `details` on the `AuditLog` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `value` on the `SystemControl` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.

*/
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
    "details" JSONB,
    "actor" TEXT,
    "entity" TEXT,
    "ip" TEXT,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AuditLog" ("action", "actor", "details", "entity", "id", "ip", "ipAddress", "permissionId", "timestamp", "userId") SELECT "action", "actor", "details", "entity", "id", "ip", "ipAddress", "permissionId", "timestamp", "userId" FROM "AuditLog";
DROP TABLE "AuditLog";
ALTER TABLE "new_AuditLog" RENAME TO "AuditLog";
CREATE TABLE "new_SystemControl" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contestId" TEXT NOT NULL,
    "controlCode" INTEGER NOT NULL,
    "value" JSONB NOT NULL,
    "setById" TEXT NOT NULL,
    "setAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SystemControl_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SystemControl_setById_fkey" FOREIGN KEY ("setById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SystemControl" ("contestId", "controlCode", "id", "setAt", "setById", "value") SELECT "contestId", "controlCode", "id", "setAt", "setById", "value" FROM "SystemControl";
DROP TABLE "SystemControl";
ALTER TABLE "new_SystemControl" RENAME TO "SystemControl";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
