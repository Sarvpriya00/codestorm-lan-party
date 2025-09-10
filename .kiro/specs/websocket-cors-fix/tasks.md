# Implementation Plan

- [x] 1. Update backend CORS configuration
  - Modify CORS settings in backend/src/index.ts to include port 8080
  - Add environment variable support for CORS origins
  - Test CORS configuration with frontend requests
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 2. Fix backend environment configuration
  - Update backend/.env to use consistent port 3001
  - Ensure PORT environment variable is properly used
  - Verify WebSocket server uses same port as HTTP server
  - _Requirements: 2.1, 2.2_

- [x] 3. Update frontend API configuration
  - Modify src/lib/api.ts to use correct backend port (3001)
  - Add environment variable for API base URL
  - Implement proper error handling for CORS failures
  - _Requirements: 2.2, 2.3, 3.1_

- [x] 4. Fix WebSocket connection configuration
  - Update src/lib/websocket.ts to use correct backend port (3001)
  - Add environment variable support for WebSocket host
  - Improve connection error handling and retry logic
  - _Requirements: 1.1, 2.3, 4.1_

- [x] 5. Fix authentication context error handling
  - Modify src/contexts/AuthContext.tsx to handle WebSocket response properly
  - Fix undefined headers error in authentication flow
  - Improve fallback logic between WebSocket and HTTP authentication
  - _Requirements: 1.2, 1.3, 4.1, 4.2, 4.3_

- [x] 6. Add environment variables to frontend
  - Create or update .env file with correct backend configuration
  - Add VITE_API_BASE_URL and VITE_BACKEND_HOST variables
  - Ensure environment variables are used consistently
  - _Requirements: 2.2, 2.3_

- [ ] 7. Test complete authentication flow
  - Verify WebSocket connection establishes without errors
  - Test login functionality with admin/admin123 credentials
  - Confirm no CORS errors appear in browser console
  - Validate authentication persistence across page refreshes
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 4.3_