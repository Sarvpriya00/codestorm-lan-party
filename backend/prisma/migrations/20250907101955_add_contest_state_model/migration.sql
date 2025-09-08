-- CreateTable
CREATE TABLE "ContestState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phase" TEXT NOT NULL DEFAULT 'Setup',
    "startTime" DATETIME,
    "endTime" DATETIME,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
