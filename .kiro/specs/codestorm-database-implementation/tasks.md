# Implementation Plan

- [x] 1. Database Schema Migration and Core Models
  - Extend the existing Prisma schema to include all required models from the comprehensive database design
  - Create migration scripts to transform existing data to new schema structure
  - Implement seed data for roles, permissions, and initial system configuration
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 7.1, 7.2_

- [x] 2. Permission System Implementation
- [x] 2.1 Create Permission and Role Management Services
  - Implement PermissionService for hierarchical permission checking and inheritance
  - Create RoleService for role-permission mapping and validation
  - Write unit tests for permission inheritance and role assignment logic
  - _Requirements: 1.4, 1.5, 1.6, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 2.2 Implement Enhanced Authentication Middleware
  - Extend existing auth middleware to support hierarchical permission checking
  - Create permission-based route protection with granular access control
  - Implement IP address tracking and validation for security
  - _Requirements: 1.1, 1.2, 1.3, 6.1, 6.4_

- [x] 3. Contest Management System
- [x] 3.1 Implement Contest CRUD Operations
  - Create ContestController with full lifecycle management (create, update, phase control)
  - Implement ContestService for business logic and state management
  - Write API endpoints for contest creation, modification, and status updates
  - _Requirements: 2.1, 2.2, 2.5, 6.2_

- [x] 3.2 Implement Contest-Problem Association System
  - Create ContestProblemService for managing problem assignments to contests
  - Implement API endpoints for adding/removing problems from contests with ordering and points
  - Write validation logic for contest-problem relationships and constraints
  - _Requirements: 2.2, 2.3_

- [x] 3.3 Implement Contest Participation Management
  - Create ContestUserService for managing participant enrollment and status
  - Implement API endpoints for joining contests and managing participant status
  - Write business logic for participant eligibility and status tracking
  - _Requirements: 2.4, 2.5_

- [x] 4. Enhanced Problem and Submission System
- [x] 4.1 Migrate Legacy Problem System to New Schema
  - Create migration script to convert legacy Problem model data to QuestionProblem format
  - Update existing ProblemController to use new QuestionProblem model with contest integration
  - Implement problem filtering and organization by contest and difficulty
  - Create API endpoints for problem metadata management (tags, difficulty, scoring)
  - _Requirements: 2.2, 2.3, 3.1, 3.2_

- [x] 4.2 Implement Enhanced Submission Tracking System
  - Migrate legacy submission system to use new schema with contest-specific submissions
  - Create SubmissionService with status tracking and judge assignment logic
  - Update existing submission endpoints to support new Review model and scoring system
  - Implement API endpoints for submission history and filtering by contest/user
  - _Requirements: 3.2, 3.3, 4.1, 4.2_

- [x] 5. Judge Review and Scoring System
- [x] 5.1 Enhance Judge Queue Management
  - Update existing JudgeController to use new submission schema and Review model
  - Create JudgeQueueService for managing submission assignments to judges
  - Implement queue algorithms to prevent conflicts and ensure fair distribution
  - Write API endpoints for judge queue access and submission claiming
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 5.2 Implement Review and Scoring System
  - Create ReviewService for managing submission evaluations and scoring
  - Update existing verdict posting to create Review records with detailed feedback
  - Implement API endpoints for submitting reviews with scores and feedback
  - Write business logic for updating user scores and problem-solved counts using new schema
  - _Requirements: 4.3, 4.4, 4.5_

- [x] 6. Analytics and Leaderboard System
- [x] 6.1 Implement Real-time Analytics Engine
  - Create AnalyticsService for calculating contest statistics and metrics using new schema
  - Update existing analytics to use Analytics model instead of derived calculations
  - Implement background jobs for updating analytics data from submissions and reviews
  - Write API endpoints for retrieving contest analytics and system metrics
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 6.2 Implement Dynamic Leaderboard System
  - Create LeaderboardService for calculating and maintaining contest rankings using new Leaderboard model
  - Update existing leaderboard controller to use new schema instead of ScoreEvent aggregation
  - Implement real-time leaderboard updates triggered by submission reviews
  - Write API endpoints for leaderboard retrieval with pagination and filtering
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 7. System Administration and Control
- [x] 7.1 Enhance Contest Control System
  - Update existing contest state management to use new Contest and SystemControl models
  - Create SystemControlService for managing contest phases and emergency actions
  - Migrate existing ContestState functionality to new schema
  - Write business logic for contest state transitions and validation
  - _Requirements: 6.2, 6.5_

- [x] 7.2 Implement Enhanced Audit Logging System
  - Update existing AuditLog model usage to include permission tracking
  - Create AuditService for comprehensive action logging with permission tracking
  - Implement middleware for automatic audit log creation on all sensitive operations
  - Enhance existing audit log endpoints with filtering and permission-based access
  - _Requirements: 6.1, 6.4_

- [x] 7.3 Implement Backup and Data Management
  - Create BackupService for system backup creation and restoration using BackupRecord model
  - Enhance existing data export functionality to use new schema
  - Write file management utilities for backup storage and retrieval
  - _Requirements: 6.4_

- [x] 7.4 Implement Attendance Tracking System
  - Create AttendanceService for monitoring participant activity and presence
  - Implement API endpoints for attendance management and reporting using Attendance model
  - Write business logic for automatic attendance tracking based on user activity
  - _Requirements: 6.3_

- [x] 8. Frontend Role-Based Component System
- [x] 8.1 Implement Role-Based Navigation and Layout
  - Create RoleGuard higher-order component for permission-based rendering
  - Update existing Layout component to use new role-permission system instead of legacy roles
  - Implement permission checking utilities for frontend component visibility
  - Update authentication context to work with new User-Role-Permission schema
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 8.2 Enhance Admin Management Components
  - Update existing AdminUsers component to work with new role-permission system
  - Update existing AdminControl component to use new contest management schema
  - Create ContestManagement component for contest creation and control
  - Build SystemControl component for contest phases, timers, and emergency actions
  - _Requirements: 8.1, 9.3, 9.4, 9.6, 9.8_

- [x] 8.3 Enhance Judge Interface Components
  - Update existing JudgeQueue component to work with new submission schema
  - Create SubmissionReview component for detailed submission evaluation with new Review model
  - Build ReviewForm component for scoring and feedback submission
  - _Requirements: 8.2, 9.2_

- [x] 8.4 Enhance Participant Interface Components
  - Update existing Problems component to work with QuestionProblem model and contest filtering
  - Update existing MySubmissions component to use new submission schema with detailed status tracking
  - Implement ContestDashboard component for participant contest overview
  - _Requirements: 8.3, 9.1_

- [x] 9. Analytics and Reporting Frontend
- [x] 9.1 Enhance Analytics Dashboard Components
  - Update existing AdminAnalytics component to use new Analytics model
  - Create ContestAnalytics component for real-time contest statistics
  - Implement ParticipantMetrics component for individual performance tracking
  - Build SystemMetrics component for overall platform health monitoring
  - _Requirements: 8.1, 9.3_

- [x] 9.2 Create Data Export and Management Components
  - Enhance existing export functionality to work with new schema
  - Implement ExportManager component for data export functionality
  - Create BackupManager component for system backup and restore operations
  - Build AttendanceTracker component for participant attendance monitoring
  - _Requirements: 8.1, 9.7, 9.8_

- [x] 10. Real-time Updates and WebSocket Integration
- [x] 10.1 Enhance WebSocket Event System
  - Update existing WebSocket service to support role-based event broadcasting with new permission system
  - Create event handlers for submission status updates, leaderboard changes, and contest phase transitions using new schema
  - Update client-side WebSocket integration for real-time UI updates with new data models
  - _Requirements: 9.9_

- [x] 10.2 Integrate Real-time Updates in Components
  - Update existing Leaderboard component WebSocket listeners to use new Leaderboard model
  - Implement real-time submission status updates in MySubmissions component with new submission schema
  - Create live contest timer and phase display using new Contest and SystemControl models
  - _Requirements: 9.9_

- [x] 11. Testing and Validation
- [x] 11.1 Enhance Backend API Tests
  - Update existing unit tests to work with new service classes and business logic
  - Expand existing integration tests for API endpoints with permission validation
  - Write tests for new permission system and role-based access control
  - Implement database migration and schema validation tests
  - _Requirements: All backend requirements_

- [x] 11.2 Enhance Frontend Component Tests
  - Update existing React component tests to work with new role-permission system
  - Write unit tests for new components with role-based rendering
  - Create integration tests for API communication and data flow with new schema
  - Implement E2E tests for complete user workflows (admin, judge, participant)
  - _Requirements: All frontend requirements_

- [x] 12. Data Migration and System Integration
- [x] 12.1 Create Legacy Data Migration Scripts
  - Write migration scripts to transform existing legacy Problem model data to QuestionProblem format
  - Create migration for existing ScoreEvent data to new Review and Leaderboard models
  - Implement migration for existing ContestState to new Contest and SystemControl models
  - Update existing users to use new role-permission system
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 12.2 Implement System Configuration and Deployment
  - Update environment configuration for new database schema and permissions
  - Create deployment scripts for schema migrations and system updates
  - Write documentation for system administration and role management
  - Test complete system integration with all new features
  - _Requirements: All system requirements_