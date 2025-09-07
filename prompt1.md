i want to build this project for a hackathon 
## Purpose and scope
- Build an offline coding-contest platform for a single batch event called CodeStorm, running on one LAN host PC and accessible from lab PCs via that host’s IP; no internet, no cloud dependencies [1].  
- Audience roles: Participant, Judge, Admin; each role sees dedicated views and actions; judges work concurrently; admin controls contest, content, and exports [1].  

## Core constraints
- Offline-only, one LAN host; all assets local; SQLite database via Prisma; WebSocket-based realtime for statuses, leaderboard, and timers [1][3].  
- Authentication uses pre-printed credentials; per-PC access code and IP logging on first login; security is lightweight, usability-focused [1].  

## Information architecture
- Top-level routes: Login, Home, Problems, Problem Detail, My Submissions, Judge Queue, Judge Review, Leaderboard (Big Screen), Admin Dashboard, Admin Problems, Admin Users, Admin Exports, Contest Control, Audit Log [1].  
- Global header shows role, username (except in judge anonymized views), and remaining contest time for participants; footer shows version/build and LAN host IP hint [1].  

## Roles and permissions
- Participant: view problems, submit code, see statuses, view leaderboard; cannot see names in leaderboard rows (only usernames) [1].  
- Judge: see anonymized pending queue, review latest attempt per problem per user, Accept/Reject, revise verdicts; cannot view participant identity in judge views [1].  
- Admin: all judge capabilities + manage problems/users, start/stop contest, configure points/difficulties, view stats and audit log, export CSVs, backup/restore DB [1].  

## Contest lifecycle
- States: Setup, Reading (15 min), Running (60 min), Locked (no submissions), Results (read-only) [1].  
- Admin manually transitions from Setup → Reading → Running → Locked; website timer is server-authoritative; participant pages reflect time left; no automatic start [1].  

## Scoring logic
- Problem difficulties: Easy 0.5, Medium 1, Hard 5 (editable in admin), binary verdicts only; no negatives; only latest submission per user per problem counts [1].  
- Leaderboard ordering: by confirmed points desc, then least total time (sum of acceptance timestamps offsets from contest start), breaking ties deterministically [2].  

## Realtime behavior
- Use WebSockets to push: submission-created (Pending), verdict-changed (Accepted/Rejected), leaderboard-updated, timer-changed, and content-changed (if problems updated) [1].  
- Leaderboard shows both Confirmed points and Pending points; a visible drop can occur when pending is rejected for dramatic effect [2].  

## Authentication and session rules
- Login with username/password from printed slips; upon first login, capture and store IP and per-PC access code if required; log audit entry; keep session cookie simple [1].  
- Auto-logout at contest end with “time over” warning; allow re-login during the contest without losing client UI state; inactivity logout optional [1].  

## Anti-cheating posture
- PCs offline; UI disables right-click and DevTools prompts but not kiosk mode; plagiarism checks are not included by design; audit log tracks critical actions [1].  

## Participant experience
- Home/Dashboard: shows contest phase, global timer, quick links to Problems, My Submissions, and Leaderboard; shows “reading mode” banner if applicable [1].  
- Problems list: 20–25 problems with difficulty chips (Easy/Medium/Hard), points badges, search/filter; list items show status badges per user: Not started, In progress (draft in client), Pending, Accepted, Rejected [1].  
- Problem detail:
  - Sections: Statement (Markdown + LaTeX), Constraints, Sample Input/Output (code blocks), Difficulty and Points, Hidden judge notes not visible to participant [1].  
  - Submission panel: language selector (OOP choices: C++, Java, Python, Other), large paste area, keyboard shortcuts, paste-detection warning, submit confirmation modal [1].  
  - After submit: status flips to Pending with timestamp; participants may resubmit; only the latest attempt counts when judged; prior attempts retained in history panel [1].  
- My Submissions page: table of attempts with problem, language, attempt count, status, timestamps; clicking an item opens read-only code view and verdict history [1].  
- Leaderboard link: opens read-only live board; identity is usernames only; no department filters since one batch only [2].  

## Judge experience
- Judge queue: anonymized cards sorted by oldest pending; filters by Problem and Language; search by problem title; batch count shown; realtime updates add new cards live [1].  
- Review page/modal for a submission:
  - Header: Problem title, language, attempt number, created-at, last-update [1].  
  - Code viewer: monospaced, copy button; no participant identity; optional notes area for internal comments [1].  
  - Actions: Accept or Reject; confirmation modal; optional note; changing verdict updates score events and recalculates leaderboard immediately [1].  
  - Attempt history sidebar: shows prior attempts on this problem by the same anonymized user with timestamps and verdicts; judges can navigate across attempts [1].  
- Concurrency: multiple judges can work in parallel; last write wins on a submission; UI prevents double marking with optimistic lock and toasts [1].  

## Admin experience
- Contest Control:
  - Set contest times; buttons for “Start Reading”, “Start Contest”, “Lock Submissions”, “Show Results”; timers broadcast via WebSocket to all clients [1].  
  - Toggle to momentarily hide/show pending points on the big screen; emergency “Pause” (soft lock) for unforeseen issues [2].  
- Admin Dashboard:
  - KPIs: total users, problems, submissions; acceptance rate; submissions-per-5-min chart; time-to-first-accept metrics [1].  
  - Recent activity feed from Audit Log (logins, submissions, verdicts, edits) [1].  
- Problems management:
  - Create/Edit problems with fields: title, difficulty, points, Statement (Markdown + LaTeX), Constraints, Sample I/O, Hidden judge notes [1].  
  - Bulk JSON import/export to swap the entire set fast if questions leak; version history with revert; changes broadcast as “content-changed” [1].  
- Users management:
  - Bulk CSV/JSON import for participants; auto-generate passwords; print-friendly roster view; optional per-PC access code assignment [1].  
  - Role assignment (Admin/Judge/Participant); identity masking for judges enforced by role [1].  
- Exports:
  - CSV: submissions (with problem/difficulty/points/status/timestamps), final standings (username, points, time), users list; one-click download [1].  
- Audit log:
  - Paginated list with filters by action type (LOGIN, SUBMIT, VERDICT, EDIT_PROBLEM, EXPORT, CONTROL); includes actor, entity, IP, timestamp, details [1].  
- Backup/Restore:
  - Button to trigger SQLite snapshot to a chosen folder/USB; status showing last backup time; restore flow tested pre-event [3].  

## Leaderboard (big screen)
- Retro 8‑bit theme using local NES.css styling; full-screen mode; auto-fit to projector resolution; dark theme by default; minimal chrome [4][2].  
- Rows display: position, username, confirmed points, pending points in a dual bar, and time metric; updates push-driven without reload; stable row animations [2].  
- Sorting: confirmed points desc, then least total time; pending points shown in parentheses and in the bar visualization; togglable pending visibility [2].  

## Data model and rules
- Entities: User, Role (enum), Problem, Submission, Verdict (enum), Session (contest participation timing), ScoreEvent (created on Accept only), LeaderboardSnapshot (optional), AuditLog, Seat (PC/IP map) [1].  
- Submission rules: last submission per problem per user is the one judged/considered; judges can change verdicts; system recalculates score and leaderboard on each change [1].  
- Time calculation: total time is sum over Accepted submissions of (acceptedAt − contestStart) in milliseconds; stored or calculated on the fly; displayed as mm:ss on UI [2].  

## Realtime events catalogue
- submission.created: {submissionId, problemId, userId, timestamp} → updates participant status, judge queue, leaderboard pending points [1].  
- verdict.updated: {submissionId, verdict, points, acceptedAt} → updates participant status, judge queue removal, confirmed score, leaderboard order [1].  
- contest.timer: {phase, serverNow, startAt, endAt} → updates timers on all pages [1].  
- content.changed: {problemId? or “bulk”} → participants’ problem list refresh [1].  

## Navigation and UX patterns
- Left nav for authenticated areas with icons; keyboard-first forms; confirmation modals on final submit and final verdict; toast notifications for actions [1].  
- Participant split-view option: Statement on left, submission area on right; autosave client-side drafts; clear “latest submission replaces previous” note [1].  
- Judge batch processing: after marking a submission, auto-advance to next pending; sticky filters; anonymous IDs; copy code buttons [1].  

## Content formatting
- Statement supports Markdown with fenced code blocks and LaTeX; client renders offline with pre-bundled libs; sample I/O shown in monospace blocks [3].  
- Difficulty colors: Easy (green), Medium (amber), Hard (red); badges consistent across list, detail, and judge views [1].  

## Offline and deployment details
- One host machine runs the server; bind to 0.0.0.0 and share host IP; clients open http://HOST_IP:3000; WebSockets on same origin; no external calls [1].  
- SQLite file lives alongside app; backups rotate every N minutes to a directory and optional USB; WAL mode recommended; restore procedure documented [3].  

## Safety and resilience
- Guard rails: rate-limit per user per problem to prevent accidental spam (soft); optimistic UI with server confirmation; clear error states if DB locked [1].  
- Admin “soft lock” lets organizers pause submissions without ending contest; hard lock triggers at T+60 or on manual “Lock” [1].  

## Deliverables checklist for generator
- Pages and routes for every view listed; role-based access guards; anonymization in judge surfaces; server-side time authority [1].  
- Prisma schema implementing all entities; migrations; seed script for roles, a few problems, and demo users [3].  
- WebSocket event bus and client hooks; leaderboard push updates; pending and confirmed point visualization [1].  
- Admin content editor with JSON import/export; CSV export endpoints; audit logging middleware on key actions [1].  
- Retro leaderboard theme using local CSS; shadcn UI components locally stored; dark/light toggles; print-friendly login slips [4].  

## Acceptance criteria
- Entire app runs offline on LAN; all features work without internet; pages load under 1s on lab PCs; judge actions reflect in leaderboard within 1s [1].  
- Multiple judges can mark concurrently without conflicts; last write wins with clear toasts; verdict changes recalc leaderboard immediately [1].  
- Backups produced on schedule; CSV exports open correctly in spreadsheet tools; audit log captures all actions with timestamps and IPs [1].  

Use this prompt as the specification for the generator so the scaffold includes routes, data structures, roles, states, and realtime behaviors exactly as defined here; emphasize offline operation, anonymity for judges, pending-points drama, and admin-controlled timers and backups for a smooth on-campus event [1][2].
