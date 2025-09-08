I need to create a complete, offline-first web application backend for a coding contest called **CodeStorm**. The application must run on a single LAN host and serve clients from a local IP address. The frontend is already built; my focus now is on the backend logic, database, and real-time communication.

**Here's the plan:**

1.  **Project Setup**: Generate a backend application using Node.js and an appropriate framework (e.g., Express.js) that can serve a REST API and a WebSocket server. The application must be self-contained and have no external dependencies, as it will run in an offline LAN environment.
2.  **Database with Prisma**:
    * Use **Prisma** as the ORM to manage a local **SQLite** database.
    * Generate a `schema.prisma` file with the following models, ensuring all relationships are correctly defined:
        * `User`: To store `id`, `username`, `password`, and `role` information.
        * `Role`: An enum (`ADMIN`, `JUDGE`, `PARTICIPANT`) for role-based access control.
        * `Problem`: To hold `id`, `title`, `description`, `difficulty`, `points`, `test_cases` (JSON), and `hidden_judge_notes`.
        * `Submission`: To track every participant's code submission with fields for `id`, `problemId`, `userId`, `language`, `code`, `status`, `attemptCount`, and timestamps.
        * `Verdict`: An enum (`ACCEPTED`, `REJECTED`, `PENDING`) to represent submission status.
        * `ScoreEvent`: For tracking `id`, `submissionId`, `points`, and `acceptedAt` timestamps for accepted submissions.
        * `AuditLog`: To log critical system actions like `LOGIN`, `SUBMIT`, `VERDICT`, and `EDIT_PROBLEM`. It should include `actor`, `entity`, `ip`, `timestamp`, and `details`.
        * `Seat`: A table to map `pc_access_code` and `ip_address` to a user on their first login for security and tracking.
    * **Seed the database** with the following initial data using a Prisma seed script (`seed.ts`):
        * **Dummy Profiles**:
            * **Admin**: `username: admin`, `password: admin123`, `role: ADMIN`.
            * **Judge**: `username: judge`, `password: judge123`, `role: JUDGE`.
            * **Participant**: `username: participant`, `password: participant123`, `role: PARTICIPANT`.
        * **Problems**: Add the 10 "Easy", 8 "For Loop", and 10 "Problem Solving Challenges" from the provided JSON data. For each problem, set the `difficulty` and `points` based on their category: Easy (0.5 pts), Medium/For-Loop (1 pt), and Hard/Problem-Solving (5 pts).
3.  **Authentication & APIs**:
    * Create REST API endpoints for user login, handling authentication, and session management.
    * Implement middleware to protect routes based on the user's role (`ADMIN`, `JUDGE`, `PARTICIPANT`).
    * **Participant APIs**:
        * `GET /api/problems`: Returns a list of all problems with user-specific status badges.
        * `GET /api/problems/:id`: Returns details for a single problem.
        * `POST /api/submissions`: Accepts new code submissions from a participant.
        * `GET /api/mysubmissions`: Retrieves all submissions for the logged-in user.
    * **Judge APIs**:
        * `GET /api/judge/queue`: Fetches a list of pending submissions, ensuring all participant details are anonymized.
        * `POST /api/judge/verdict`: Allows a judge to mark a submission as `ACCEPTED` or `REJECTED`.
    * **Admin APIs**:
        * `GET /api/admin/dashboard`: Provides key performance indicators and a recent activity feed.
        * `POST /api/admin/problems`: Endpoint for creating or updating problem details.
        * `GET /api/admin/users`, `POST /api/admin/users`: Manage user roles and details.
        * `POST /api/admin/contest`: Handles contest control actions like starting/stopping phases.
        * `GET /api/admin/exports`: Endpoint for generating and downloading CSV files of submissions and standings.
        * `GET /api/admin/audit-log`: Fetches a paginated list of audit log entries.
    * **Public APIs**:
        * `GET /api/leaderboard`: Returns real-time leaderboard data sorted by confirmed points, then total time.
4.  **Real-time Features (WebSockets)**:
    * Implement a **WebSocket server** to push real-time updates to connected clients.
    * The server must broadcast the following events:
        * `submission.created`: To update participant status and the judge queue.
        * `verdict.updated`: To update participant status, remove the submission from the judge queue, and trigger a leaderboard recalculation.
        * `contest.timer`: To broadcast the current contest phase and remaining time to all clients.
        * `content.changed`: To notify clients when problems have been updated by an admin.
    * The server should handle multiple concurrent judge actions on different submissions without conflict.
5.  **Business Logic**:
    * **Submission Handling**: On a new submission, mark its status as `PENDING` and log it.
    * **Scoring Logic**: When a judge submits an `ACCEPTED` verdict, create a `ScoreEvent` and trigger an immediate leaderboard recalculation. The total time for a user is the sum of the time differences between the contest start and the `acceptedAt` timestamp of each accepted submission.
    * **Contest Control**: The admin can manually transition the contest state (`Setup` → `Reading` → `Running` → `Locked` → `Results`). The server's timer is the single source of truth for all clients.
    * **Audit Logging**: Implement a middleware or service to automatically log key actions (e.g., login, submission, verdict change) to the `AuditLog` table.

## Frontend Overview

The frontend of CodeStorm is a React application built with Vite, utilizing Shadcn UI components for a modern and responsive design. It provides distinct views and functionalities for different user roles: Admin, Judge, and Participant, as well as public-facing pages.

### Public Pages

*   **Index (Landing) Page**: `src/pages/Index.tsx`
    *   A welcoming page for all users.
    *   Provides general information about the contest.
    *   Links to Login and Leaderboard.
*   **Login Page**: `src/pages/Login.tsx`
    *   Allows users to authenticate with their username and password.
    *   Redirects to the appropriate dashboard based on user role upon successful login.
*   **Leaderboard Page**: `src/pages/Leaderboard.tsx`
    *   Displays real-time contest standings.
    *   Sorted by confirmed points, then total time.
    *   Accessible to all, even without login.
*   **Not Found (404) Page**: `src/pages/NotFound.tsx`
    *   Displayed when a user navigates to an invalid URL.

### Participant Views

Accessible after logging in as a `PARTICIPANT`.

*   **Dashboard**: `src/pages/Dashboard.tsx`
    *   Overview of the participant's progress.
    *   Displays current contest phase and remaining time.
    *   Quick links to problems and submissions.
*   **Problems Page**: `src/pages/Problems.tsx`
    *   Lists all available coding problems.
    *   Each problem entry shows title, difficulty, points, and user-specific status (e.g., solved, attempted, pending).
    *   Clicking a problem navigates to its detailed view.
*   **Problem Detail View**: (Integrated within `src/pages/Problems.tsx` or a sub-component)
    *   Displays the full problem description, input/output formats, and example test cases.
    *   Provides a code editor for writing and submitting solutions.
    *   Shows the participant's previous submissions for this specific problem.
*   **My Submissions Page**: `src/pages/MySubmissions.tsx`
    *   Lists all code submissions made by the logged-in participant.
    *   Includes submission ID, problem title, language, code snippet, status (Pending, Accepted, Rejected), and timestamp.

### Judge Views

Accessible after logging in as a `JUDGE`.

*   **Judge Queue Page**: `src/pages/JudgeQueue.tsx`
    *   Displays a real-time list of pending code submissions awaiting review.
    *   Each entry shows anonymized participant details, problem title, language, and code.
    *   Allows judges to review code, run tests (simulated), and assign a verdict (Accepted/Rejected).

### Admin Views

Accessible after logging in as an `ADMIN`.

*   **Admin Analytics Dashboard**: `src/pages/AdminAnalytics.tsx`
    *   Provides key performance indicators (KPIs) for the contest.
    *   Total users, problems, submissions, accepted submissions.
    *   Recent activity feed (audit logs).
*   **Admin Control Page**: `src/pages/AdminControl.tsx`
    *   Manages contest phases (Setup, Reading, Running, Locked, Results).
    *   Allows creation and updating of problem details (title, description, difficulty, points, test cases, hidden judge notes).
    *   Manages user accounts (create, update roles).
    *   Provides options to export contest data (submissions, standings).
*   **Admin Users Management**: `src/pages/AdminUsers.tsx`
    *   Lists all registered users.
    *   Allows admins to view user details and modify user roles.
*   **Audit Log Viewer**: (Likely integrated into `AdminAnalytics.tsx` or a separate component)
    *   Displays a paginated list of critical system actions (login, submission, verdict, problem edits).
    *   Includes actor, entity, IP address, timestamp, and details of the action.

### Shared Components

*   **Layout**: `src/components/Layout.tsx`
    *   Provides the overall structure and navigation for the application.
    *   Includes `GlobalHeader` and `AppSidebar`.
*   **Global Header**: `src/components/GlobalHeader.tsx`
    *   Displays application title, user information, and logout button.
*   **App Sidebar**: `src/components/AppSidebar.tsx`
    *   Navigation menu, dynamically adjusted based on user role.
*   **UI Components**: `src/components/ui/`
    *   A collection of reusable UI components (buttons, forms, badges, etc.) built with Shadcn UI.
*   **DifficultyBadge**: `src/components/DifficultyBadge.tsx`
    *   Visual indicator for problem difficulty.
*   **StatusBadge**: `src/components/StatusBadge.tsx`
    *   Visual indicator for submission status.