Update the project as follows, ensuring all necessary improvements and dynamic behaviors for a multi-user, role-based web app:

skip folder node_modules

### 1. Year Update  
- Change all instances of **2024** to **2025** in the frontend folder and its content .

### 2. Dynamic Routing via Backend  
- Convert **BrowserRouter**-based route definitions in the frontend so routes are dynamically fetched from the backend server, rather than being statically listed in the codebase .
- Do NOT use static `PERMISSIONS.X` for routing; instead, fetch the `Participants.Permission` arrays or similar permission groups from the backend, based on the authenticated user .

### 3. Permission Logic and Source  
- The `permission.tsx` file in the frontend should only contain basic, minimum permissions needed for bootstrapping.
- All **extended, role-specific permission sets** should reside in the backend, with the frontend requesting them as needed after login.
- When a user logs in, the frontend should fetch the user's role and associated permissions from the backend/database and dynamically render the appropriate views/components .

### 4. Role-Based Views  
- User roles (Participant, Judge, Admin) must be determined by querying the backend (with the username or session token), which checks the database for the role.
- Frontend should render only those views, navigation items, and buttons allowed by the user's permission group as provided by the backend .
- Examples:
  - **Participants:** Should see only participant-related views (problems, submissions, scores).
  - **Judges:** Should see judge-specific tools (queue, view submissions).
  - **Admins:** Should see all admin controls and analytics.

### 5. Database Sync & Backend API  
- Any static data or hard-coded configuration (e.g., permissions, navigation items, dashboard info, contest states) in the frontend should be turned into **dynamic, backend-sourced data** via API endpoints.
- Backend should fetch all such data from the database whenever possible, then send it to the frontend.
- Example API endpoints:  
  - `/api/user/permissions`  
  - `/api/navigation`  
  - `/api/contest/status`

### 6. Refactoring Static Components  
- Identify all frontend components, UI elements, and utility files that use hard-coded values or static lists (permissions, navigation, user roles, contest info, analytics) and refactor them so that data is **always fetched from the backend server** .

### 7. Additional Improvements  
- Ensure:
  - All navigation items and page/component permissions are controlled centrally by backend logic.
  - Any placeholder UI or dummy data is replaced with backend-fetched, real-time information wherever feasible.
  - Proper error handling is in place for permission fetch failures, fallback to minimal safe UI .
  - Backend exposes an API to fetch all relevant dynamic values for different user roles.

***

## Example Dynamic Workflow

1. **Login:**  
   - User authenticates, frontend fetches role and permissions from backend.
2. **Routing & Navigation:**  
   - Frontend renders routes and navigation items according to permission data received.
3. **Data Fetching:**  
   - All static contest data/cloud info shown in the frontend is fetched via backend API calls.

***

## Checklist

- [ ] Update year references to **2025** in frontend.
- [ ] Make frontend routes dynamic—fetched from backend.
- [ ] Permissions: minimal in frontend, full sets from backend.
- [ ] Refactor all static/hard-coded components to use backend API data.
- [ ] Ensure proper role-based view logic based on database user role.
- [ ] Backend fetches all config/data from DB and sends to frontend via APIs.
- [ ] Remove placeholder/dummy data, use dynamic backend-fetched info.

***

**Apply these improvements throughout both frontend and backend for robust, scalable multi-user permission control and dynamic configuration.**
