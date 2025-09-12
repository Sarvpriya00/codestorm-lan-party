You are an expert backend engineer for a Prisma + SQLite + Express.js stack (CodeStorm). The system has a critical access issue where participants and judges cannot view problem pages, so perform a full reset and seed fresh baseline data to restore access. 
Goals:
	•	Reset the database schema and purge all data safely, then seed canonical RBAC and 60+ problems (20 per difficulty), verifying access for participants and judges. 
Reset actions:
	•	Stop the server and run: npx prisma db push –force-reset to drop all data and re-sync the schema for SQLite, then proceed with seeding; this hard-resets the DB and will delete all content. 
	•	Optionally chain a seed step: npx prisma db push –force-reset && npm run prisma-seed or npx prisma db seed if configured. 
Data deletion scope:
	•	Ensure no stale data remains in tables for User, Role, Permission, RolePermission, Contest, ContestUser, QuestionProblem, ContestProblem, Submission, Review, Analytics, Leaderboard, AuditLog, Attendance, BackupRecord, SystemControl, and any legacy tables (Problem, ScoreEvent, Seat, ContestState). 
Seed baseline
	•	Permissions with hierarchy: ADMIN full admin suite (codes 100, 500, 600, 700, 800+children, 900, 1000, 1100), JUDGE (300, 310, 320), PARTICIPANT (200, 210, 220, 230), modeling parentPermissionId where appropriate. 
	•	Roles: ADMIN, JUDGE, PARTICIPANT; map through RolePermission to the appropriate permission codes. 
	•	Users: 1 admin, 2 judges, 5 participants; create using bcrypt-hashed passwords and assign each to its role. 
	•	Problems: Create 60 problems in QuestionProblem: 20 EASY, 20 MEDIUM, 20 HARD, with questionText, difficultyLevel, tags as JSON string, maxScore (e.g., EASY=100, MEDIUM=200, HARD=300), isActive=true, and createdById set to the admin. 
	•	Contest: Create a “CodeStorm Test Contest” (status RUNNING) and attach all seeded problems to it via ContestProblem with sequential order and per-problem points matching maxScore. 
	•	ContestUser: Join all 5 participants to the contest with ParticipantStatus=ACTIVE. 
Implementation approach:
	•	Use Prisma Client with createMany for bulk inserts on SQLite where applicable (e.g., permissions, users, problems), noting skipDuplicates is not available on SQLite. 
	•	Use explicit sequencing to satisfy FKs: seed permissions → roles → role-permissions → admin → problems → contest → contest-problems → participants → contest-users. 
	•	Provide a TypeScript seed.ts runnable via tsx or ts-node and add “prisma”: { “seed”: “tsx prisma/seed.ts” } to package.json scripts. 
Verification checklist:
	•	Admin can list and manage problems via GET /api/problems. 
	•	Participant can view problems (permission 210) and submit (220). 
	•	Judge can access GET /api/judge/queue and review endpoints. 
Output:
	•	Provide the commands to reset and seed, and a complete TypeScript seed.ts with bcrypt hashing, arrays for permissions, role mapping, and bulk creation of users and problems in the correct order, along with brief logs for verification. 