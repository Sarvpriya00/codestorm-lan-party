/*
  Warnings:

  - You are about to drop the column `pc_access_code` on the `Seat` table. All the data in the column will be lost.
  - You are about to drop the column `pcCode` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Seat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ip_address" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Seat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Seat" ("id", "ip_address", "userId") SELECT "id", "ip_address", "userId" FROM "Seat";
DROP TABLE "Seat";
ALTER TABLE "new_Seat" RENAME TO "Seat";
CREATE UNIQUE INDEX "Seat_userId_key" ON "Seat"("userId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "password" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "lastActive" DATETIME,
    "scored" REAL NOT NULL DEFAULT 0,
    "problemsSolvedCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_User" ("displayName", "id", "ipAddress", "lastActive", "password", "problemsSolvedCount", "roleId", "scored", "username") SELECT "displayName", "id", "ipAddress", "lastActive", "password", "problemsSolvedCount", "roleId", "scored", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
