# WebSocket and Login Troubleshooting Guide

## Quick Fix Summary

The login functionality has been updated to use WebSocket communication with the backend server. Here are the key changes made:

### 1. Fixed WebSocket Connection Issues
- **Problem**: WebSocket URL was hardcoded to localhost:3000
- **Solution**: Made WebSocket URL configurable via environment variables
- **Files Changed**: `src/lib/websocket.ts`, `.env`

### 2. Enhanced Login Flow
- **Problem**: Login only used WebSocket without fallback
- **Solution**: Added HTTP fallback if WebSocket login fails
- **Files Changed**: `src/contexts/AuthContext.tsx`

### 3. Improved Backend WebSocket Service
- **Problem**: Limited error handling and logging
- **Solution**: Enhanced error handling, logging, and connection management
- **Files Changed**: `backend/src/services/websocketService.ts`

### 4. Database Integration
- **Problem**: Login not properly matching against Prisma database
- **Solution**: Ensured WebSocket login uses Prisma for user authentication
- **Files Changed**: `backend/src/services/websocketService.ts`

## Setup Instructions

### 1. Run the Fix Script
```bash
./fix-login.sh
```

### 2. Start Development Environment
```bash
./start-dev.sh
```

### 3. Test Credentials
- **Participant**: username: `test_user`, password: `test123`
- **Admin**: username: `admin`, password: `admin123`

## Troubleshooting Steps

### Step 1: Check Backend Server
```bash
curl http://localhost:3000/health
```
Should return a JSON response with status "healthy".

### Step 2: Test Database Connection
```bash
cd backend && node test-db.js
```
Should show users and roles in the database.

### Step 3: Diagnose WebSocket Connection
```bash
node diagnose-websocket.js
```
This will test the complete WebSocket flow.

### Step 4: Test WebSocket Manually
```bash
node test-websocket.js
```
Should show successful login via WebSocket.

## Common Issues and Solutions

### Issue: "WebSocket connection failed"
**Cause**: Backend server not running or not accessible
**Solution**: 
1. Ensure backend is running: `cd backend && npm run dev`
2. Check if port 3000 is available: `lsof -i :3000`
3. Verify server is binding to all interfaces (0.0.0.0)

### Issue: "Invalid credentials" during login
**Cause**: Test users not created or password mismatch
**Solution**:
1. Run user creation script: `cd backend && node create-test-user.js`
2. Check database: `cd backend && node test-db.js`
3. Verify password hashing is working correctly

### Issue: "Permission service error"
**Cause**: Permission system not properly initialized
**Solution**:
1. Check if roles exist in database
2. Ensure permission service is properly imported
3. Verify database schema is up to date: `cd backend && npx prisma db push`

### Issue: Frontend can't connect to WebSocket
**Cause**: Environment variables not set or incorrect
**Solution**:
1. Check `.env` file exists with correct values
2. Restart frontend development server
3. Verify WebSocket URL in browser developer tools

## Environment Configuration

### Frontend (.env)
```
VITE_BACKEND_HOST=localhost:3000
VITE_API_BASE_URL=http://localhost:3000/api
```

### Backend (.env)
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="supersecretjwtkey"
PORT=3000
```

## Architecture Overview

```
Frontend (React) ←→ WebSocket ←→ Backend (Express + WebSocket Server)
                                      ↓
                                 Prisma ORM
                                      ↓
                                 SQLite Database
```

### Login Flow
1. Frontend establishes WebSocket connection
2. User enters credentials in login form
3. Frontend sends login message via WebSocket
4. Backend validates credentials against Prisma database
5. Backend returns JWT token and user data via WebSocket
6. Frontend stores token and updates authentication state
7. WebSocket connection remains active for real-time updates

## Testing the Complete Flow

1. **Start servers**: `./start-dev.sh`
2. **Open browser**: Navigate to `http://localhost:5173`
3. **Check WebSocket status**: Should show "Connected" in login page footer
4. **Login**: Use test credentials
5. **Verify**: Should redirect to dashboard with user info

## Files Modified

### Frontend
- `src/lib/websocket.ts` - WebSocket client service
- `src/contexts/AuthContext.tsx` - Authentication context with WebSocket integration
- `src/pages/Login.tsx` - Login page with connection status
- `src/lib/api.ts` - API client configuration
- `.env` - Environment variables

### Backend
- `backend/src/services/websocketService.ts` - WebSocket server implementation
- `backend/src/index.ts` - Server setup and WebSocket initialization
- `backend/package.json` - Added dev script
- `backend/create-test-user.js` - Test user creation
- `backend/test-db.js` - Database connection test

### Scripts
- `fix-login.sh` - Comprehensive fix script
- `start-dev.sh` - Development environment startup
- `test-websocket.js` - WebSocket connection test
- `diagnose-websocket.js` - WebSocket diagnostic tool

## Next Steps

After fixing the login issues, you may want to:

1. **Implement real-time features**: Use the WebSocket connection for live updates
2. **Add contest management**: Create contests and problems
3. **Set up judge interface**: Implement submission review system
4. **Configure leaderboard**: Real-time scoring and rankings
5. **Add security measures**: Rate limiting, IP validation, etc.

## Support

If you encounter issues not covered here:

1. Check the browser developer console for errors
2. Check backend server logs
3. Run the diagnostic script: `node diagnose-websocket.js`
4. Verify database state: `cd backend && node test-db.js`