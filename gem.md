
    at Login (http://localhost:8080/src/pages/Login.tsx:34:37)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=02342d8c:4088:5)
    at Routes (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=02342d8c:4558:5)
    at Provider (http://localhost:8080/node_modules/.vite/deps/chunk-PLT6GTVM.js?v=02342d8c:38:15)
    at TooltipProvider (http://localhost:8080/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=02342d8c:62:5)
    at NavigationProvider (http://localhost:8080/src/contexts/NavigationContext.tsx:37:38)
    at Router (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=02342d8c:4501:15)
    at BrowserRouter (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=02342d8c:5247:5)
    at AuthProvider (http://localhost:8080/src/contexts/AuthContext.tsx:35:32)
    at QueryClientProvider (http://localhost:8080/node_modules/.vite/deps/@tanstack_react-query.js?v=02342d8c:2934:3)
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary.tsx:291:5)
    at App
    

Unchecked runtime.lastError: The message port closed before a response was received.
36Unchecked runtime.lastError: Could not establish connection. Receiving end does not exist.
hook.js:608 ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. Error Component Stack
    at BrowserRouter (react-router-dom.js?v=02342d8c:5247:5)
    at AuthProvider (AuthContext.tsx:58:61)
    at QueryClientProvider (@tanstack_react-query.js?v=02342d8c:2934:3)
    at ErrorBoundary (ErrorBoundary.tsx:16:8)
    at App (<anonymous>)
overrideMethod @ hook.js:608
warnOnce @ react-router-dom.js?v=02342d8c:4393
logDeprecation @ react-router-dom.js?v=02342d8c:4396
logV6DeprecationWarnings @ react-router-dom.js?v=02342d8c:4399
(anonymous) @ react-router-dom.js?v=02342d8c:5271
commitHookEffectListMount @ chunk-R6S4VRB5.js?v=02342d8c:16915
commitPassiveMountOnFiber @ chunk-R6S4VRB5.js?v=02342d8c:18156
commitPassiveMountEffects_complete @ chunk-R6S4VRB5.js?v=02342d8c:18129
commitPassiveMountEffects_begin @ chunk-R6S4VRB5.js?v=02342d8c:18119
commitPassiveMountEffects @ chunk-R6S4VRB5.js?v=02342d8c:18109
flushPassiveEffectsImpl @ chunk-R6S4VRB5.js?v=02342d8c:19490
flushPassiveEffects @ chunk-R6S4VRB5.js?v=02342d8c:19447
performSyncWorkOnRoot @ chunk-R6S4VRB5.js?v=02342d8c:18868
flushSyncCallbacks @ chunk-R6S4VRB5.js?v=02342d8c:9119
commitRootImpl @ chunk-R6S4VRB5.js?v=02342d8c:19432
commitRoot @ chunk-R6S4VRB5.js?v=02342d8c:19277
finishConcurrentRender @ chunk-R6S4VRB5.js?v=02342d8c:18805
performConcurrentWorkOnRoot @ chunk-R6S4VRB5.js?v=02342d8c:18718
workLoop @ chunk-R6S4VRB5.js?v=02342d8c:197
flushWork @ chunk-R6S4VRB5.js?v=02342d8c:176
performWorkUntilDeadline @ chunk-R6S4VRB5.js?v=02342d8c:384
hook.js:608 ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. Error Component Stack
    at BrowserRouter (react-router-dom.js?v=02342d8c:5247:5)
    at AuthProvider (AuthContext.tsx:58:61)
    at QueryClientProvider (@tanstack_react-query.js?v=02342d8c:2934:3)
    at ErrorBoundary (ErrorBoundary.tsx:16:8)
    at App (<anonymous>)
overrideMethod @ hook.js:608
warnOnce @ react-router-dom.js?v=02342d8c:4393
logDeprecation @ react-router-dom.js?v=02342d8c:4396
logV6DeprecationWarnings @ react-router-dom.js?v=02342d8c:4402
(anonymous) @ react-router-dom.js?v=02342d8c:5271
commitHookEffectListMount @ chunk-R6S4VRB5.js?v=02342d8c:16915
commitPassiveMountOnFiber @ chunk-R6S4VRB5.js?v=02342d8c:18156
commitPassiveMountEffects_complete @ chunk-R6S4VRB5.js?v=02342d8c:18129
commitPassiveMountEffects_begin @ chunk-R6S4VRB5.js?v=02342d8c:18119
commitPassiveMountEffects @ chunk-R6S4VRB5.js?v=02342d8c:18109
flushPassiveEffectsImpl @ chunk-R6S4VRB5.js?v=02342d8c:19490
flushPassiveEffects @ chunk-R6S4VRB5.js?v=02342d8c:19447
performSyncWorkOnRoot @ chunk-R6S4VRB5.js?v=02342d8c:18868
flushSyncCallbacks @ chunk-R6S4VRB5.js?v=02342d8c:9119
commitRootImpl @ chunk-R6S4VRB5.js?v=02342d8c:19432
commitRoot @ chunk-R6S4VRB5.js?v=02342d8c:19277
finishConcurrentRender @ chunk-R6S4VRB5.js?v=02342d8c:18805
performConcurrentWorkOnRoot @ chunk-R6S4VRB5.js?v=02342d8c:18718
workLoop @ chunk-R6S4VRB5.js?v=02342d8c:197
flushWork @ chunk-R6S4VRB5.js?v=02342d8c:176
performWorkUntilDeadline @ chunk-R6S4VRB5.js?v=02342d8c:384
NotFound.tsx:11 404 Error: User attempted to access non-existent route: /problems Error Component Stack
    at NotFound (NotFound.tsx:8:20)
    at RenderedRoute (react-router-dom.js?v=02342d8c:4088:5)
    at Routes (react-router-dom.js?v=02342d8c:4558:5)
    at Suspense (<anonymous>)
    at DynamicRouter (DynamicRouter.tsx:33:31)
    at RenderedRoute (react-router-dom.js?v=02342d8c:4088:5)
    at Routes (react-router-dom.js?v=02342d8c:4558:5)
    at Provider (chunk-PLT6GTVM.js?v=02342d8c:38:15)
    at TooltipProvider (@radix-ui_react-tooltip.js?v=02342d8c:62:5)
    at NavigationProvider (NavigationContext.tsx:31:73)
    at Router (react-router-dom.js?v=02342d8c:4501:15)
    at BrowserRouter (react-router-dom.js?v=02342d8c:5247:5)
    at AuthProvider (AuthContext.tsx:58:61)
    at QueryClientProvider (@tanstack_react-query.js?v=02342d8c:2934:3)
    at ErrorBoundary (ErrorBoundary.tsx:16:8)
    at App (<anonymous>)
overrideMethod @ hook.js:608
(anonymous) @ NotFound.tsx:11
commitHookEffectListMount @ chunk-R6S4VRB5.js?v=02342d8c:16915
commitPassiveMountOnFiber @ chunk-R6S4VRB5.js?v=02342d8c:18156
commitPassiveMountEffects_complete @ chunk-R6S4VRB5.js?v=02342d8c:18129
commitPassiveMountEffects_begin @ chunk-R6S4VRB5.js?v=02342d8c:18119
commitPassiveMountEffects @ chunk-R6S4VRB5.js?v=02342d8c:18109
flushPassiveEffectsImpl @ chunk-R6S4VRB5.js?v=02342d8c:19490
flushPassiveEffects @ chunk-R6S4VRB5.js?v=02342d8c:19447
(anonymous) @ chunk-R6S4VRB5.js?v=02342d8c:19328
workLoop @ chunk-R6S4VRB5.js?v=02342d8c:197
flushWork @ chunk-R6S4VRB5.js?v=02342d8c:176
performWorkUntilDeadline @ chunk-R6S4VRB5.js?v=02342d8c:384
websocket.ts:37 Connecting to WebSocket: ws://localhost:3001
websocket.ts:51 WebSocket connected to: ws://localhost:3001
websocket.ts:97 Received WebSocket message: Object
websocket.ts:97 Received WebSocket message: Object
websocket.ts:102 WebSocket authenticated
NotFound.tsx:11 404 Error: User attempted to access non-existent route: / Error Component Stack
    at NotFound (NotFound.tsx:8:20)
    at RenderedRoute (react-router-dom.js?v=02342d8c:4088:5)
    at Routes (react-router-dom.js?v=02342d8c:4558:5)
    at Suspense (<anonymous>)
    at DynamicRouter (DynamicRouter.tsx:33:31)
    at RenderedRoute (react-router-dom.js?v=02342d8c:4088:5)
    at Routes (react-router-dom.js?v=02342d8c:4558:5)
    at Provider (chunk-PLT6GTVM.js?v=02342d8c:38:15)
    at TooltipProvider (@radix-ui_react-tooltip.js?v=02342d8c:62:5)
    at NavigationProvider (NavigationContext.tsx:31:73)
    at Router (react-router-dom.js?v=02342d8c:4501:15)
    at BrowserRouter (react-router-dom.js?v=02342d8c:5247:5)
    at AuthProvider (AuthContext.tsx:58:61)
    at QueryClientProvider (@tanstack_react-query.js?v=02342d8c:2934:3)
    at ErrorBoundary (ErrorBoundary.tsx:16:8)
    at App (<anonymous>)
overrideMethod @ hook.js:608
(anonymous) @ NotFound.tsx:11
commitHookEffectListMount @ chunk-R6S4VRB5.js?v=02342d8c:16915
commitPassiveMountOnFiber @ chunk-R6S4VRB5.js?v=02342d8c:18156
commitPassiveMountEffects_complete @ chunk-R6S4VRB5.js?v=02342d8c:18129
commitPassiveMountEffects_begin @ chunk-R6S4VRB5.js?v=02342d8c:18119
commitPassiveMountEffects @ chunk-R6S4VRB5.js?v=02342d8c:18109
flushPassiveEffectsImpl @ chunk-R6S4VRB5.js?v=02342d8c:19490
flushPassiveEffects @ chunk-R6S4VRB5.js?v=02342d8c:19447
(anonymous) @ chunk-R6S4VRB5.js?v=02342d8c:19328
workLoop @ chunk-R6S4VRB5.js?v=02342d8c:197
flushWork @ chunk-R6S4VRB5.js?v=02342d8c:176
performWorkUntilDeadline @ chunk-R6S4VRB5.js?v=02342d8c:384
:3001/api/problems:1  Failed to load resource: the server responded with a status of 500 (Internal Server Error)
Problems.tsx:71 Failed to fetch problems: Error: Internal server error
    at ApiClient.handleResponse (api.ts:22:13)
    at async fetchProblems (Problems.tsx:68:26)
overrideMethod @ hook.js:608
fetchProblems @ Problems.tsx:71
websocket.ts:37 Connecting to WebSocket: ws://localhost:3001
websocket.ts:51 WebSocket connected to: ws://localhost:3001
websocket.ts:97 Received WebSocket message: Object
websocket.ts:97 Received WebSocket message: Object
websocket.ts:102 WebSocket authenticated
:3001/api/submissions/user/55f389f1-c161-4c38-b8a5-ab98b5040d24:1  Failed to load resource: the server responded with a status of 404 (Not Found)
hook.js:608 Error fetching submissions: Error: Network error
    at ApiClient.handleResponse (api.ts:22:13)
    at async fetchSubmissions (MySubmissions.tsx:185:26)
overrideMethod @ hook.js:608
websocket.ts:74 WebSocket disconnected. Code: 1005 Reason: 
websocket.ts:121 Attempting to reconnect (1/5) in 1000ms...
:3001/api/problems:1  Failed to load resource: the server responded with a status of 500 (Internal Server Error)
hook.js:608 Failed to fetch problems: Error: Internal server error
    at ApiClient.handleResponse (api.ts:22:13)
    at async fetchProblems (Problems.tsx:68:26)
overrideMethod @ hook.js:608
websocket.ts:37 Connecting to WebSocket: ws://localhost:3001
websocket.ts:51 WebSocket connected to: ws://localhost:3001
websocket.ts:126 WebSocket reconnected successfully
websocket.ts:97 Received WebSocket message: Object
websocket.ts:37 Connecting to WebSocket: ws://localhost:3001
websocket.ts:74 WebSocket disconnected. Code: 1005 Reason: 
websocket.ts:121 Attempting to reconnect (1/5) in 1000ms...
websocket.ts:51 WebSocket connected to: ws://localhost:3001
websocket.ts:97 Received WebSocket message: Object
websocket.ts:37 Connecting to WebSocket: ws://localhost:3001
websocket.ts:51 WebSocket connected to: ws://localhost:3001
websocket.ts:126 WebSocket reconnected successfully
websocket.ts:97 Received WebSocket message: Object
utils.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
extensionState.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
heuristicsRedefinitions.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
utils.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
extensionState.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
heuristicsRedefinitions.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
heuristicsRedefinitions.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
extensionState.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
utils.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
utils.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
extensionState.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
heuristicsRedefinitions.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
extensionState.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
utils.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
heuristicsRedefinitions.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
utils.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
heuristicsRedefinitions.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
extensionState.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
websocket.ts:97 Received WebSocket message: Object
AuthContext.tsx:132 WebSocket login response: Object
AuthContext.tsx:143 Destructured token, user, and permissions: Object
2chunk-R6S4VRB5.js?v=02342d8c:11595 Uncaught Error: Rendered fewer hooks than expected. This may be caused by an accidental early return statement.
    at renderWithHooks (chunk-R6S4VRB5.js?v=02342d8c:11595:19)
    at updateFunctionComponent (chunk-R6S4VRB5.js?v=02342d8c:14582:28)
    at beginWork (chunk-R6S4VRB5.js?v=02342d8c:15924:22)
    at HTMLUnknownElement.callCallback2 (chunk-R6S4VRB5.js?v=02342d8c:3674:22)
    at Object.invokeGuardedCallbackDev (chunk-R6S4VRB5.js?v=02342d8c:3699:24)
    at invokeGuardedCallback (chunk-R6S4VRB5.js?v=02342d8c:3733:39)
    at beginWork$1 (chunk-R6S4VRB5.js?v=02342d8c:19765:15)
    at performUnitOfWork (chunk-R6S4VRB5.js?v=02342d8c:19198:20)
    at workLoopSync (chunk-R6S4VRB5.js?v=02342d8c:19137:13)
    at renderRootSync (chunk-R6S4VRB5.js?v=02342d8c:19116:15)
hook.js:608 The above error occurred in the <Login> component:

    at Login (http://localhost:8080/src/pages/Login.tsx:34:37)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=02342d8c:4088:5)
    at Routes (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=02342d8c:4558:5)
    at Provider (http://localhost:8080/node_modules/.vite/deps/chunk-PLT6GTVM.js?v=02342d8c:38:15)
    at TooltipProvider (http://localhost:8080/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=02342d8c:62:5)
    at NavigationProvider (http://localhost:8080/src/contexts/NavigationContext.tsx:37:38)
    at Router (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=02342d8c:4501:15)
    at BrowserRouter (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=02342d8c:5247:5)
    at AuthProvider (http://localhost:8080/src/contexts/AuthContext.tsx:35:32)
    at QueryClientProvider (http://localhost:8080/node_modules/.vite/deps/@tanstack_react-query.js?v=02342d8c:2934:3)
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary.tsx:291:5)
    at App

React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.
overrideMethod @ hook.js:608
hook.js:608 Uncaught error: Error: Rendered fewer hooks than expected. This may be caused by an accidental early return statement.
    at renderWithHooks (chunk-R6S4VRB5.js?v=02342d8c:11595:19)
    at updateFunctionComponent (chunk-R6S4VRB5.js?v=02342d8c:14582:28)
    at beginWork (chunk-R6S4VRB5.js?v=02342d8c:15924:22)
    at beginWork$1 (chunk-R6S4VRB5.js?v=02342d8c:19753:22)
    at performUnitOfWork (chunk-R6S4VRB5.js?v=02342d8c:19198:20)
    at workLoopSync (chunk-R6S4VRB5.js?v=02342d8c:19137:13)
    at renderRootSync (chunk-R6S4VRB5.js?v=02342d8c:19116:15)
    at recoverFromConcurrentError (chunk-R6S4VRB5.js?v=02342d8c:18736:28)
    at performConcurrentWorkOnRoot (chunk-R6S4VRB5.js?v=02342d8c:18684:30)
    at workLoop (chunk-R6S4VRB5.js?v=02342d8c:197:42) Object Error Component Stack
    at ErrorBoundary (ErrorBoundary.tsx:16:8)
    at App (<anonymous>)
overrideMethod @ hook.js:608
websocket.ts:97 Received WebSocket message: Object
websocket.ts:102 WebSocket authenticated


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
"