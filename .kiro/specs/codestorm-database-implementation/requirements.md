# Requirements Document

## Introduction

This feature implements a comprehensive database schema and associated functionality for the CodeStorm competitive programming platform. The system supports multi-role user management (admin, judge, participant), contest administration, problem management, submission handling, judging workflows, and analytics. The platform enables running coding contests with real-time leaderboards, audit logging, and administrative controls.

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want a comprehensive user management system with role-based permissions, so that I can control access to different platform features based on user roles.

#### Acceptance Criteria

1. WHEN a user is created THEN the system SHALL store their uuid, username, display_name, role_id, pc_code, ip_address, password_hashed, and activity tracking fields
2. WHEN a user logs in THEN the system SHALL update their last_active timestamp and verify their role permissions
3. WHEN a user's role is assigned THEN the system SHALL grant them all permissions associated with that role through the RolePermission junction table
4. IF a user has admin role THEN the system SHALL grant permissions for dashboard (100), users (500), analytics (600), exports (700), contest control (800), audit log (900), backup (1000), and attendance (1100)
5. IF a user has judge role THEN the system SHALL grant permissions for judge queue (300) including view submission (310) and view queue list (320)
6. IF a user has participant role THEN the system SHALL grant permissions for problems (200) including view question (210), add submission (220), and total score (230)

### Requirement 2

**User Story:** As a contest administrator, I want to create and manage contests with associated problems, so that I can run competitive programming events with proper problem sets.

#### Acceptance Criteria

1. WHEN a contest is created THEN the system SHALL store cuid, name, description, start_time, end_time, and status (planned/running/ended/archived)
2. WHEN problems are added to a contest THEN the system SHALL create ContestProblem entries linking the contest to QuestionProblem entries with order and points
3. WHEN a QuestionProblem is created THEN the system SHALL store quid, question_text, difficulty_level, tags, created_by, max_score, and is_active status
4. WHEN users join a contest THEN the system SHALL create ContestUser entries with joined_at timestamp and status (active/disqualified/withdrawn)
5. IF a contest status changes THEN the system SHALL update the status field and log the change in AuditLog

### Requirement 3

**User Story:** As a participant, I want to view contest problems and submit solutions, so that I can participate in coding competitions.

#### Acceptance Criteria

1. WHEN a participant views problems THEN the system SHALL display active QuestionProblem entries associated with their contest through ContestProblem
2. WHEN a participant submits a solution THEN the system SHALL create a Submission entry with suid, quid, cuid, submitted_by, timestamp, status (pending), and code_text
3. WHEN a submission is created THEN the system SHALL set initial status to 'pending' and score to 0
4. IF a participant has permission 210 THEN the system SHALL allow viewing question details
5. IF a participant has permission 220 THEN the system SHALL allow creating submissions
6. IF a participant has permission 230 THEN the system SHALL allow viewing their own total score

### Requirement 4

**User Story:** As a judge, I want to review and score participant submissions, so that I can evaluate solutions and provide feedback.

#### Acceptance Criteria

1. WHEN a judge accesses the judge queue THEN the system SHALL display pending submissions that are not currently being reviewed by another judge
2. WHEN a judge starts reviewing a submission THEN the system SHALL update the submission status to 'under_review' and set reviewed_by field
3. WHEN a judge completes a review THEN the system SHALL create a Review entry with ruid, suid, quid, submitted_by, reviewed_by, timestamp, correct status, score_awarded, and remarks
4. WHEN a review is completed THEN the system SHALL update the submission status to 'accepted' or 'rejected' based on the review outcome
5. IF a submission is accepted THEN the system SHALL update the user's scored field and problems_solved_count

### Requirement 5

**User Story:** As an administrator, I want real-time analytics and leaderboards, so that I can monitor contest progress and display rankings to participants.

#### Acceptance Criteria

1. WHEN submissions are processed THEN the system SHALL update Analytics table with total_submissions, correct_submissions, active_participants, and last_updated timestamp
2. WHEN a submission is accepted THEN the system SHALL update the Leaderboard table with user's rank, score, problems_solved, and last_submission_time
3. WHEN leaderboard is requested THEN the system SHALL return rankings ordered by score descending, then by last_submission_time ascending
4. IF multiple users have the same score THEN the system SHALL rank based on earliest last_submission_time
5. WHEN analytics are calculated THEN the system SHALL derive counts from existing submission and review data

### Requirement 6

**User Story:** As an administrator, I want comprehensive audit logging and system controls, so that I can track all system activities and manage contest operations.

#### Acceptance Criteria

1. WHEN any user performs an action THEN the system SHALL create an AuditLog entry with log_id, uuid, action, perm_id, timestamp, and ip_address
2. WHEN system controls are modified THEN the system SHALL create SystemControl entries with scuid, cuid, control_code, value, set_by, and set_at
3. WHEN attendance is tracked THEN the system SHALL maintain Attendance records with checkin_time, checkout_time, and status
4. WHEN backups are created THEN the system SHALL log BackupRecord entries with created_at, created_by, file_path, and status
5. IF emergency actions are needed THEN the system SHALL allow admins with permission 840 to perform emergency shutdown/reset operations

### Requirement 7

**User Story:** As a system administrator, I want hierarchical permission management, so that I can implement fine-grained access control with permission inheritance.

#### Acceptance Criteria

1. WHEN permissions are defined THEN the system SHALL support parent-child relationships through parent_perm_id field
2. WHEN a role is assigned permissions THEN the system SHALL store the mapping in RolePermission with inherited flag
3. WHEN checking user permissions THEN the system SHALL evaluate both direct permissions and inherited permissions from parent permissions
4. IF a permission has a parent THEN the system SHALL automatically grant child permissions when parent permission is granted
5. WHEN permission hierarchy is modified THEN the system SHALL update all affected role assignments accordingly

### Requirement 8

**User Story:** As a user with different roles, I want to see only the views and components that are relevant to my role, so that I have a clean and focused interface.

#### Acceptance Criteria

1. WHEN an admin user logs in THEN the system SHALL display Dashboard (100), Users (500), Analytics (600), Exports (700), Contest Control (800), Audit Log (900), Backup (1000), and Attendance (1100) views
2. WHEN a judge user logs in THEN the system SHALL display Judge Queue (300) with View Submission (310) and View Queue List (320) capabilities
3. WHEN a participant user logs in THEN the system SHALL display Problems (200) with View Question (210), Add Submission (220), and Total Score (230) capabilities
4. WHEN an admin accesses Contest Control THEN the system SHALL show Timer Control (810), Phase Control (820), Display Control (830), Emergency Actions (840), Problem Control (850), and User Control (860) sub-components
5. IF a user lacks permission for a view THEN the system SHALL hide that view from navigation and return access denied if directly accessed

### Requirement 9

**User Story:** As a platform user, I want a complete frontend interface with all necessary components, so that I can interact with all system features through a web interface.

#### Acceptance Criteria

1. WHEN the system is accessed THEN the system SHALL provide a Submissions component for participants to view their submission history and status
2. WHEN judges access the system THEN the system SHALL provide a Submission Review component for evaluating participant solutions with scoring interface
3. WHEN admins manage contests THEN the system SHALL provide Contest Management components for creating, editing, and controlling contest lifecycle
4. WHEN admins manage problems THEN the system SHALL provide Problem Management components for creating, editing, and organizing contest problems
5. WHEN users need authentication THEN the system SHALL provide Login/Registration components with role-based access
6. WHEN admins monitor system THEN the system SHALL provide System Control components for timer, phase, display, and emergency controls
7. WHEN admins track activity THEN the system SHALL provide Attendance Tracking components for monitoring participant activity
8. WHEN admins need data THEN the system SHALL provide Export/Backup components for data management and system backup
9. WHEN real-time updates are needed THEN the system SHALL provide WebSocket integration for live leaderboards, submission status, and contest updates