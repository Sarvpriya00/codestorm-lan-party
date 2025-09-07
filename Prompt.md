
## Architecture overview
- Single LAN host runs a Next.js app with a custom Node.js server that also hosts a WebSocket server for real-time updates; all lab PCs access via the host’s IP and port 80/443 or 3000 depending on availability [3][4].  
- Data layer uses Prisma ORM with SQLite (single .sqlite file) for fully offline operation and easy backup/restore; Prisma works well with Next.js and SQLite for local deployments [1][2].  
- UI layer uses shadcn/ui for participant and admin/judge views and a retro-styled leaderboard using NES.css-inspired styling for a game-like look on the big screen [5][6].  

## Offline and portability strategy
- Preinstall Node.js and cache npm dependencies on the host ahead of the event, so the app can run completely offline on LAN; Prisma and shadcn work offline after initial setup and caching of binaries and packages [7][8].  
- Use SQLite for zero external services, with the DB file stored in a known folder and periodic on-disk backups to a USB drive during the contest for resilience without internet [2][7].  

## Networking and hosting
- Bind the Next.js custom server to 0.0.0.0 and expose on the host machine’s LAN IP so every lab PC can access it; test host IP reachability from multiple clients beforehand [3][4].  
- Integrate a WebSocket server in the same Node process to broadcast submission status, leaderboard changes, and judge decisions in real-time to all connected clients [4].  

## Tech stack
- Frontend/Backend: Next.js (App Router) with a custom server.js to attach a WebSocket server (ws), enabling SSR pages for admin/judge and participant flows with real-time events [4].  
- ORM/DB: Prisma with SQLite; generate the Prisma Client locally once while online to cache binaries, then operate offline for subsequent runs [1][7].  
- UI: shadcn/ui components imported and stored in the repo so no registry calls are needed during the event; NES.css-inspired CSS for leaderboard retro style [8][6].  

## Data model
- Core tables: User, Role, Problem, Submission, Verdict, Session, ScoreEvent, LeaderboardSnapshot, plus AuditLog and Seat for IP mapping and per-PC access codes, all stored in SQLite [2][1].  
- Enforce binary grading: Verdict is one of Pending/Accepted/Rejected; ScoreEvent only created on Accepted to ensure confirmed points drive leaderboard, while pending contributes separate temporary “pending points” live [2][4].  

## Roles and permissions
- Roles: participant (submit, view status), judge (view anonymized submissions, mark, revise verdicts), admin (all judge actions + DB/stats view, audit/export, content management), matching the multi-tier requirement [2][1].  
- Judges see anonymized code and metadata (language, timestamp, attempts count), while admin can reveal identity and full stats; identity masked in judge views by default [2][1].  

## Authentication and identity
- Pre-create accounts for enrolled students with username/password printed on paper; implement a simple credential store with password hashing but minimal flows for quick login [2][1].  
- Map each login to seat/IP at first request and record in Seat table; issue per-PC access code optional check at login to bind identity to workstation [2][1].  

## Contest timing and sessions
- Single batch with 15-minute reading window (no auto-start), then a manual “Start Contest” action by admin starts the 60-minute countdown; server enforces lock on submission at T+60 [4][3].  
- Participant UI shows global remaining time and per-question attempt status states (not started/in progress/pending/accepted/rejected) without limiting attempts; only latest submission per problem counts [4][3].  

## Problems and scoring
- Problems: 20–25 entries tagged Easy/Medium/Hard with point values 0.5/1/5, adjustable via admin content editor; strictly binary scoring with no negative marking [2][1].  
- Admin editor supports markdown with LaTeX and code blocks for statements, constraints, and sample I/O, plus hidden judge notes visible only to judges/admins [2][1].  

## Participant flow
- Problem list with filters by difficulty and search; detail view shows statement, constraints, sample I/O, and a paste area with language dropdown and final submit confirm modal [2][5].  
- After submit, status becomes Pending Review; participants may resubmit per problem and only the latest submission is considered when a judge marks it [4][2].  

## Judge flow
- Queue of Pending submissions with anonymized participant ID, problem, language, timestamp, attempts; open detail shows the latest code and attempt history [2][1].  
- One-click Accept/Reject with optional note; changing a verdict updates ScoreEvent and pushes real-time leaderboard recalculation, with audit log entry for each action [4][2].  

## Leaderboard behavior
- Live leaderboard shows points and pending points as separate bars; sorting by confirmed points desc, then least total time defined as sum of acceptance timestamps minus contest start [4].  
- Big-screen mode: full-screen leaderboard with NES.css-inspired retro skin, auto-refresh via WebSocket pushes, and minimal chrome for projection [6][4].  

## Content management
- Admin UI supports creating and editing problems on the fly; bulk JSON import/export to quickly replace questions if leaked by pasting structured content [2][1].  
- Fields: title, body (markdown/LaTeX), difficulty, points, constraints, sample I/O, hidden judge notes; versioning stored for audit and rollback [2][1].  

## Anti-cheating
- PCs are offline; light obfuscation only (disable right-click, basic devtools suppression) without kiosk mode; no sandbox or plagiarism detection per requirements [4][3].  
- IP logging and per-PC access code provide minimal traceability; audit log records all significant actions for post-event review [2][1].  

## Reliability and backups
- Automatic DB snapshots every N minutes to a rotating local folder and mirrored to a removable drive; on crash, restore the latest snapshot and replay AuditLog if needed [2][7].  
- Because SQLite is a single file, copying it while the server is running is generally safe when using WAL mode; test restore rehearsals ahead of time [2].  

## Real-time implementation
- Attach ws WebSocket server to the Next custom HTTP server; on submission create, send “pending” event; on verdict change, send “scoreUpdate” and “leaderboardUpdate” to all clients [4].  
- Client hook establishes WS connection and listens for events to update UI without polling; minimal code can be a custom React hook integrated into participant, judge, and leaderboard pages [4].  

## UI implementation notes
- shadcn/ui components committed into the repo, using local files to avoid CLI registry calls during the event; dark and light themes available with minimal animations [8][5].  
- Leaderboard page uses retro 8-bit styling elements (fonts, borders, progress bars) inspired by NES.css for the public display, while standard shadcn/ui for participant/judge/admin to stay clean and usable [6][5].  

## Build and run workflow
- Prepare once online: install Node, run npm ci, prisma generate, seed admin and demo users/problems, and commit shadcn components to repo so everything is cached locally [7][8].  
- Event day: start the server with node server.js; confirm clients can reach http://HOST_IP:3000 and that WebSocket traffic flows; verify judge and leaderboard real-time behavior [3][4].  

## Development milestones
- M1: Schema and migrations (User, Role, Problem, Submission, Verdict, Seat, Session, ScoreEvent, LeaderboardSnapshot, AuditLog) with Prisma + SQLite working locally [1][2].  
- M2: Auth (username/password) and role middleware; participant dashboard and problem browsing; submission create/read [2][1].  
- M3: Judge queue and verdicting; anonymization; verdict change with cascade updates; audit logging; IP/Seat mapping [2][1].  
- M4: Real-time events (WS) for pending, accepted/rejected, and leaderboard updates; timer and hard lock on T+60 [4].  
- M5: Admin content editor with JSON import/export; CSV export for submissions and final standings; stats view [2][1].  
- M6: Leaderboard big-screen retro UI; pending-points visualization and drama drop when confirmed [6][4].  
- M7: Backup/restore scripts; WAL mode; periodic snapshot to USB; dry-run rehearsal [2][7].  

## Key implementation details
- Custom server script: createServer + next request handler + ws WebSocket server; change package.json scripts to use node server.js for dev and prod [4].  
- LAN access: build with next build then start with node server.js; clients connect via host IP; optionally use port 80 if allowed, else 3000 as fallback [3].  
- shadcn offline: use local component JSON/committed components and ensure npm ci works offline via cache; new CLI supports local file sources for offline installs [8][5].  

## Admin/stats and exports
- Stats: per-problem acceptance rates, time-to-first-accept chart, submissions over time; displayed to admin only with anonymized aggregates [2][1].  
- Exports: CSV for users, submissions, verdicts, and final standings; downloadable immediately after the event for records [2][1].  

## Pre-event checklist
- Run prisma generate and seed scripts while online to cache binaries; verify the app runs with network unplugged on the host [7][2].  
- Confirm LAN reachability, WebSocket connectivity, time lock behavior, and DB backup/restore; run a mock contest with 2–3 machines to test flows end to end [3][4].  

## Optional enhancements
- Lightweight similarity flagging (not blocking) to assist judges without formal plagiarism tools, stored as a heuristic field [2].  
- Toggle to show/hide pending points on leaderboard during the contest for different audience experiences as needed [4].  

