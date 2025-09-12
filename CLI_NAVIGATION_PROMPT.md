# CodeStorm Role-Based Navigation System CLI Prompt

## System Overview

You are implementing a role-based navigation system for CodeStorm, a competitive programming platform. The system should dynamically show/hide pages based on user roles and handle post-login navigation intelligently.

## Core Requirements

### Role Definitions
- **Admin (Permission 500+)**: Full system access
- **Judge (Permission 300)**: Access to judge queue and submissions
- **Participant (Permission 200)**: Access to problems and submissions
- **Viewer (Permission 100)**: Basic access to leaderboard and dashboard

### Navigation Rules
1. **Leaderboard**: Visible to ALL authenticated users (permission 100+)
2. **Dashboard**: Default fallback for all users (permission 100+)
3. **Problems**: Available to participants and above (permission 200+)
4. **My Submissions**: Available to participants and above (permission 220+)
5. **Judge Queue**: Available to judges and above (permission 300+)
6. **Admin Pages**: Available to admins only (permission 500+)

### Post-Login Redirection Logic
```
IF user has permission 800 THEN redirect to /admin/control
ELSE IF user has permission 500 THEN redirect to /admin/users  
ELSE IF user has permission 300 THEN redirect to /judge
ELSE IF user has permission 200 THEN redirect to /problems
ELSE redirect to / (dashboard)
```

## Implementation Architecture

### 1. Navigation Service (`src/lib/navigationService.ts`)
```typescript
export class NavigationService {
  static determineDefaultRoute(userPermissions: number[], availableRoutes: RouteConfig[]): string
  static validateRouteAccess(path: string, userPermissions: number[], availableRoutes: RouteConfig[]): boolean
  static getUserRoleType(permissions: number[]): 'admin' | 'judge' | 'participant' | 'viewer'
  static getAccessibleRoutes(userPermissions: number[], allRoutes: RouteConfig[]): RouteConfig[]
}
```

### 2. Navigation Context (`src/contexts/NavigationContext.tsx`)
- Manages navigation state across the application
- Handles automatic redirection after login
- Provides route validation methods
- Integrates with AuthContext for permission checking

### 3. Backend Route Configuration (`backend/src/routes/dynamic.ts`)
```javascript
const allRoutes = [
  { path: '/', component: 'Dashboard', title: 'Dashboard', icon: 'Home', requiredPermissions: [100], isDefault: true, priority: 5 },
  { path: '/problems', component: 'Problems', title: 'Problems', icon: 'FileText', requiredPermissions: [200], isDefault: true, priority: 4 },
  { path: '/leaderboard', component: 'Leaderboard', title: 'Leaderboard', icon: 'Trophy', requiredPermissions: [100], priority: 3 },
  { path: '/judge', component: 'JudgeQueue', title: 'Judge Queue', icon: 'Gavel', requiredPermissions: [300], isDefault: true, priority: 2 },
  { path: '/submissions', component: 'MySubmissions', title: 'My Submissions', icon: 'Send', requiredPermissions: [220], priority: 6 },
  { path: '/admin/users', component: 'AdminUsers', title: 'Users', icon: 'Users', requiredPermissions: [500], isDefault: true, priority: 1 },
  { path: '/admin/analytics', component: 'AdminAnalytics', title: 'Analytics', icon: 'BarChart3', requiredPermissions: [600], priority: 7 },
  { path: '/admin/control', component: 'AdminControl', title: 'Contest Control', icon: 'Settings', requiredPermissions: [800], isDefault: true, priority: 1 }
];
```

### 4. Dynamic Router Enhancement (`src/components/DynamicRouter.tsx`)
- Fetches user-specific routes from backend
- Renders routes with proper Layout wrappers
- Handles loading states and fallbacks
- Integrates with NavigationContext

## Error Handling & Fallbacks

### Route Resolution Failures
1. **API Failure**: Fall back to minimal routes based on authentication status
2. **Invalid Route Access**: Redirect to user's default route
3. **No Accessible Routes**: Redirect to login

### Navigation Edge Cases
1. **Root Path Access**: Automatically redirect to user's default route
2. **Unauthorized Access**: Show access denied with suggested routes
3. **Token Expiration**: Clear state and redirect to login
4. **Network Issues**: Use cached routes when possible

## CLI Implementation Commands

### Setup Commands
```bash
# Create navigation service
touch src/lib/navigationService.ts

# Create navigation context
touch src/contexts/NavigationContext.tsx

# Update existing files
# - src/App.tsx (wrap with NavigationProvider)
# - src/pages/Login.tsx (remove manual navigation)
# - src/components/DynamicRouter.tsx (integrate with NavigationContext)
# - backend/src/routes/dynamic.ts (add route priorities)
```

### Testing Commands
```bash
# Test different user roles
curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'
curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"username":"judge1","password":"judge123"}'
curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"username":"participant1","password":"part123"}'

# Test route access
curl -H "Authorization: Bearer TOKEN" http://localhost:8080/api/dynamic/user/routes-and-permissions
```

### Debug Commands
```bash
# Check navigation state
console.log('Available routes:', availableRoutes);
console.log('Default route:', defaultRoute);
console.log('User permissions:', permissions);
console.log('User role type:', getUserRoleType());

# Test route validation
console.log('Can access /admin/users:', isValidRoute('/admin/users'));
console.log('Can access /judge:', isValidRoute('/judge'));
console.log('Can access /problems:', isValidRoute('/problems'));
```

## Validation Checklist

### ✅ Authentication Flow
- [ ] Login redirects to appropriate default route based on role
- [ ] No 404 errors after successful login
- [ ] Root path (/) redirects properly
- [ ] Invalid route access shows appropriate error

### ✅ Role-Based Access
- [ ] Admin can access all admin pages
- [ ] Judge can access judge queue
- [ ] Participant can access problems and submissions
- [ ] All users can access leaderboard
- [ ] Unauthorized users see access denied with suggestions

### ✅ Navigation UX
- [ ] Sidebar shows only accessible routes
- [ ] Active route is properly highlighted
- [ ] Navigation state persists on refresh
- [ ] Browser back/forward works correctly

### ✅ Error Handling
- [ ] API failures don't break navigation
- [ ] Network issues handled gracefully
- [ ] Loading states shown appropriately
- [ ] Error messages are user-friendly

## Performance Considerations
- Route caching to reduce API calls
- Lazy loading of page components
- Preloading of likely next routes
- Efficient permission checking

## Security Notes
- All route access validated server-side
- Client-side checks are UX only
- Permission changes trigger route refresh
- Audit logging for unauthorized access attempts