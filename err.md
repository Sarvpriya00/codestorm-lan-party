okay i have fixed the login now
i have to go to the the link localhost:8080/login
but when entered the correct login 
it spins and loads a error 404 page 

# Project Routing Logic

This document outlines the routing mechanism implemented in the project.

## Overview

The routing is built upon `react-router-dom` and features a dynamic, permission-based system. The core idea is to fetch user-specific routes from the backend and render them on the client. This ensures that users can only access pages they are authorized to see.

## Key Components

- **`src/App.tsx`**: The main entry point for the application's UI. It sets up the basic routing structure.
- **`src/components/DynamicRouter.tsx`**: The heart of the dynamic routing. It fetches and renders routes based on user permissions.
- **`src/components/Layout.tsx`**: A component that wraps each page, handling authentication, authorization, and the overall page structure (sidebar, header).
- **`src/pages/`**: This directory contains all the individual page components.

## Routing Flow

1.  **Initial Load**: When the application loads, `App.tsx` is rendered. It sets up a `BrowserRouter` from `react-router-dom`.

2.  **Root Routes**: `App.tsx` defines two main route paths:
    -   `/login`: This route renders the `Login` component directly.
    -   `/*`: All other paths are handled by the `DynamicRouter` component.

3.  **Dynamic Routing (`DynamicRouter.tsx`)**:
    -   **Authentication Check**: The `DynamicRouter` first checks if the user is authenticated using the `useAuth` hook.
    -   **API Call**: If the user is authenticated, it sends a GET request to the `/dynamic/user/routes-and-permissions` API endpoint.
    -   **Route Fetching**: The API returns a list of route objects that the user is permitted to access. Each object contains:
        -   `path`: The URL path (e.g., `/dashboard`).
        -   `component`: The name of the React component to render (e.g., `Dashboard`).
        -   `requiredPermissions`: An array of permission IDs required to access the route.
    -   **Route Rendering**: The `DynamicRouter` dynamically creates `<Route>` components for each fetched route.
    -   **Lazy Loading**: Page components are lazy-loaded using `React.lazy()` to improve initial load times. The `pageComponents` object maps component names (strings) to their corresponding lazy-loaded components.

4.  **Layout and Authorization (`Layout.tsx`)**:
    -   **Wrapper**: Each dynamically generated route is wrapped with the `Layout` component.
    -   **Authentication Enforcement**: The `Layout` component checks if the user is authenticated. If not, it redirects them to the `/login` page.
    -   **Permission Enforcement**: It checks if the user has the `requiredPermissions` (passed as a prop). If the user lacks the necessary permissions, it displays an "Access Denied" page.
    -   **UI Structure**: For authorized users, the `Layout` component renders the standard application UI, including the sidebar, header, and the main page content.

5.  **Not Found**: If a user tries to access a path that does not match any of the dynamically generated routes, a catch-all `*` route in `DynamicRouter.tsx` renders the `NotFound` page.

## Summary of Pages and their Purpose

- **`src/pages/AdminAnalytics.tsx`**: Displays analytics data for administrators.
- **`src/pages/AdminControl.tsx`**: Provides system control functionalities for administrators.
- **`src/pages/AdminUsers.tsx`**: User management interface for administrators.
- **`src/pages/Dashboard.tsx`**: The main dashboard for authenticated users.
- **`src/pages/Index.tsx`**: The landing page of the application.
- **`src/pages/JudgeQueue.tsx`**: Shows the queue of submissions to be judged.
- **`src/pages/Leaderboard.tsx`**: Displays the contest leaderboard.
- **`src/pages/Login.tsx`**: The login page for users to authenticate.
- **`src/pages/MySubmissions.tsx`**: Shows the current user's submissions.
- **`src/pages/NotFound.tsx`**: The page displayed for any routes that are not found.
- **`src/pages/Problems.tsx`**: Lists the contest problems.

# Backend and Database Context

This section provides an overview of the backend architecture and database schema.

## Backend

The backend is a Node.js application built with the Express framework. It handles the application's business logic, API endpoints, and database interactions.

### Key Technologies:

- **Node.js**: The JavaScript runtime environment.
- **Express**: A minimal and flexible Node.js web application framework.
- **Prisma**: A modern database toolkit that includes an ORM for database access.
- **jsonwebtoken (JWT)**: Used for creating and verifying authentication tokens.
- **bcryptjs**: For hashing user passwords.
- **ws**: A WebSocket library for real-time communication.
- **cors**: Middleware to enable Cross-Origin Resource Sharing.
- **dotenv**: For managing environment variables.

### Server Setup (`backend/src/index.ts`):

- **Middleware**: The server uses `cors` for cross-origin requests, `express.json` for parsing JSON bodies, and a custom `auditLogMiddleware` for logging user actions.
- **API Routes**: The API is modularized into several routers, each handling a specific domain:
    - `/api/auth`: Authentication and user session management.
    - `/api`: Core functionalities like problems, submissions, and contests.
    - `/api/judge`: Endpoints for the judging system.
    - `/api/admin`: Administrative functionalities.
    - `/api/analytics`: Data analytics and reporting.
    - `/api/leaderboard`: Leaderboard data.
    - `/api/attendance`: Participant attendance tracking.
    - `/api/user`: User-related operations.
    - `/api/dynamic`: Provides the dynamic, permission-based routes to the frontend.
- **WebSocket Integration**: A WebSocket server is initialized to enable real-time features.
- **Background Jobs**: The application runs a background job for analytics processing.

## Database

The application uses a SQLite database, managed by Prisma. The database schema is defined in `backend/prisma/schema.prisma`.

### Key Database Models:

- **User Management**:
    - `User`: Stores user information, including credentials and profile data.
    - `Role`: Defines user roles (e.g., admin, participant).
    - `Permission`: Defines granular permissions for actions within the system.
    - `RolePermission`: Maps permissions to roles, forming the basis of the RBAC system.

- **Contest Management**:
    - `Contest`: Represents a programming contest, with details like name, start time, and end time.
    - `ContestUser`: A join table that links users to contests.
    - `ContestProblem`: A join table that links problems to contests.

- **Judging System**:
    - `QuestionProblem`: Stores the details of each programming problem.
    - `Submission`: Contains the code submitted by users for a specific problem.
    - `Review`: Stores the results of a submission review, including the score and feedback.

- **Analytics and Tracking**:
    - `Analytics`: Stores aggregated analytics data for contests.
    - `Leaderboard`: Contains the leaderboard rankings for each contest.
    - `AuditLog`: Logs important actions performed by users for auditing purposes.
    - `Attendance`: Tracks when participants check in and out of contests.

- **System and Legacy**:
    - `BackupRecord`: Keeps a record of database backups.
    - `SystemControl`: For managing system-wide settings.
    - `Problem`, `ScoreEvent`: Legacy models for backward compatibility.
    - `Seat`: Associates a user with an IP address.
    - `ContestState`: Manages the current phase of a contest (e.g., Running, Ended).
