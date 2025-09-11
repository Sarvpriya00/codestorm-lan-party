# Design Document

## Overview

The post-login navigation system needs to be enhanced to properly handle user redirection after authentication and ensure consistent routing behavior throughout the application. The current system has issues where users encounter "page moved" and "page not found" errors after successful login, indicating problems with the routing logic and default route handling.

## Architecture

The navigation system consists of several key components:

1. **App.tsx** - Main application router with basic route structure
2. **DynamicRouter.tsx** - Handles dynamic route generation based on user permissions
3. **AuthContext.tsx** - Manages authentication state and user permissions
4. **Layout.tsx** - Provides permission-based access control for routes
5. **Login.tsx** - Handles authentication and post-login redirection

## Root Cause Analysis

Based on the current implementation, the issues stem from:

1. **Missing Default Route Handling**: The root path "/" is defined in the backend routes but may not be properly handled when no specific route is accessed
2. **Authentication State Race Conditions**: The DynamicRouter waits for authentication but may not handle the transition properly
3. **Incomplete Route Resolution**: The system fetches dynamic routes from the backend but doesn't have fallback logic for route resolution failures
4. **Missing Post-Login Redirection Logic**: The Login component redirects to "/" but doesn't consider user roles or available routes

## Components and Interfaces

### Enhanced Route Management

```typescript
interface RouteConfig {
  path: string;
  component: string;
  title: string;
  icon: string;
  requiredPermissions: number[];
  isDefault?: boolean; // New field to mark default routes for roles
}

interface NavigationState {
  availableRoutes: RouteConfig[];
  defaultRoute: string;
  isLoading: boolean;
  error?: string;
}
```

### Post-Login Navigation Service

```typescript
interface PostLoginNavigationService {
  determineDefaultRoute(userPermissions: number[], availableRoutes: RouteConfig[]): string;
  handleLoginRedirect(user: User, permissions: number[]): void;
  validateRouteAccess(path: string, permissions: number[]): boolean;
}
```

## Data Models

### Enhanced Route Configuration

The backend route configuration will be extended to include default route priorities:

```typescript
const allRoutes = [
  { 
    path: '/', 
    component: 'Dashboard', 
    title: 'Dashboard', 
    icon: 'Home', 
    requiredPermissions: [100],
    isDefault: true,
    priority: 1 // Higher priority for default selection
  },
  // ... other routes with appropriate priorities
];
```

### Navigation Context

```typescript
interface NavigationContextType {
  currentRoute: string;
  availableRoutes: RouteConfig[];
  defaultRoute: string;
  navigateToDefault: () => void;
  isValidRoute: (path: string) => boolean;
}
```

## Error Handling

### Route Resolution Errors

1. **Backend API Failures**: If the dynamic routes API fails, fall back to a minimal set of routes based on authentication status
2. **Permission Mismatches**: Redirect users to their highest-priority accessible route when they attempt to access unauthorized pages
3. **Invalid Routes**: Enhanced 404 handling with suggestions for valid routes based on user permissions

### Authentication State Errors

1. **Token Expiration**: Graceful handling of expired tokens with automatic redirect to login
2. **Permission Changes**: Handle real-time permission updates that might affect route access
3. **Network Connectivity**: Offline-first approach for route resolution when backend is unavailable

## Testing Strategy

### Unit Tests

1. **Route Resolution Logic**: Test the algorithm that determines default routes based on permissions
2. **Permission Validation**: Test route access validation for different user roles
3. **Navigation State Management**: Test the navigation context state transitions

### Integration Tests

1. **Login Flow**: End-to-end test of login → route determination → page rendering
2. **Role-Based Navigation**: Test navigation behavior for different user roles (admin, judge, participant)
3. **Error Scenarios**: Test behavior when backend APIs fail or return invalid data

### User Acceptance Tests

1. **Post-Login Experience**: Verify users land on appropriate pages after login
2. **Navigation Consistency**: Verify all navigation links work correctly
3. **Permission Enforcement**: Verify users cannot access unauthorized pages

## Implementation Approach

### Phase 1: Route Resolution Enhancement

1. Enhance the DynamicRouter to include default route logic
2. Add route priority and default route selection algorithm
3. Implement fallback routing for API failures

### Phase 2: Post-Login Navigation

1. Create a navigation service to handle post-login redirection
2. Enhance the Login component to use role-based redirection
3. Add proper error handling for authentication failures

### Phase 3: Error Handling and Fallbacks

1. Improve the NotFound component with user-specific suggestions
2. Add network error handling and offline route resolution
3. Implement graceful degradation for permission changes

### Phase 4: Testing and Validation

1. Add comprehensive test coverage for all navigation scenarios
2. Implement monitoring for navigation errors
3. Add user feedback mechanisms for navigation issues

## Security Considerations

1. **Route Validation**: All route access must be validated both client-side and server-side
2. **Permission Caching**: User permissions should be cached securely and refreshed appropriately
3. **Audit Logging**: Navigation attempts to unauthorized routes should be logged for security monitoring

## Performance Considerations

1. **Route Caching**: Cache user routes and permissions to reduce API calls
2. **Lazy Loading**: Continue using lazy loading for route components to optimize bundle size
3. **Preloading**: Preload likely next routes based on user role and current location