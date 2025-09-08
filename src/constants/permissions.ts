// Permission codes based on the database schema design
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD: 100,

  // Problems
  PROBLEMS: 200,
  VIEW_QUESTION: 210,
  ADD_SUBMISSION: 220,
  TOTAL_SCORE: 230,

  // Judge Queue
  JUDGE_QUEUE: 300,
  VIEW_SUBMISSION: 310,
  VIEW_QUEUE_LIST: 320,

  // Admin - Users
  USERS: 500,

  // Admin - Analytics
  ANALYTICS: 600,

  // Admin - Exports
  EXPORTS: 700,

  // Admin - Contest Control
  CONTEST_CONTROL: 800,
  TIMER_CONTROL: 810,
  PHASE_CONTROL: 820,
  DISPLAY_CONTROL: 830,
  EMERGENCY_ACTIONS: 840,
  PROBLEM_CONTROL: 850,
  USER_CONTROL: 860,

  // Admin - Audit Log
  AUDIT_LOG: 900,

  // Admin - Backup
  BACKUP: 1000,

  // Admin - Attendance
  ATTENDANCE: 1100,
} as const;

// Role-based permission groups for easier management
export const ROLE_PERMISSIONS = {
  PARTICIPANT: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.PROBLEMS,
    PERMISSIONS.VIEW_QUESTION,
    PERMISSIONS.ADD_SUBMISSION,
    PERMISSIONS.TOTAL_SCORE,
  ],
  
  JUDGE: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.JUDGE_QUEUE,
    PERMISSIONS.VIEW_SUBMISSION,
    PERMISSIONS.VIEW_QUEUE_LIST,
  ],
  
  ADMIN: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.PROBLEMS,
    PERMISSIONS.VIEW_QUESTION,
    PERMISSIONS.ADD_SUBMISSION,
    PERMISSIONS.TOTAL_SCORE,
    PERMISSIONS.JUDGE_QUEUE,
    PERMISSIONS.VIEW_SUBMISSION,
    PERMISSIONS.VIEW_QUEUE_LIST,
    PERMISSIONS.USERS,
    PERMISSIONS.ANALYTICS,
    PERMISSIONS.EXPORTS,
    PERMISSIONS.CONTEST_CONTROL,
    PERMISSIONS.TIMER_CONTROL,
    PERMISSIONS.PHASE_CONTROL,
    PERMISSIONS.DISPLAY_CONTROL,
    PERMISSIONS.EMERGENCY_ACTIONS,
    PERMISSIONS.PROBLEM_CONTROL,
    PERMISSIONS.USER_CONTROL,
    PERMISSIONS.AUDIT_LOG,
    PERMISSIONS.BACKUP,
    PERMISSIONS.ATTENDANCE,
  ],
} as const;

// Navigation items with their required permissions
export const NAVIGATION_ITEMS = {
  DASHBOARD: {
    title: 'Dashboard',
    url: '/',
    permissions: [PERMISSIONS.DASHBOARD],
    icon: 'Home',
  },
  PROBLEMS: {
    title: 'Problems',
    url: '/problems',
    permissions: [PERMISSIONS.PROBLEMS],
    icon: 'FileText',
  },
  MY_SUBMISSIONS: {
    title: 'My Submissions',
    url: '/submissions',
    permissions: [PERMISSIONS.ADD_SUBMISSION],
    icon: 'Send',
  },
  LEADERBOARD: {
    title: 'Leaderboard',
    url: '/leaderboard',
    permissions: [PERMISSIONS.DASHBOARD], // Basic access for all roles
    icon: 'Trophy',
  },
  JUDGE_QUEUE: {
    title: 'Judge Queue',
    url: '/judge',
    permissions: [PERMISSIONS.JUDGE_QUEUE],
    icon: 'Gavel',
  },
  ADMIN_USERS: {
    title: 'Users',
    url: '/admin/users',
    permissions: [PERMISSIONS.USERS],
    icon: 'Users',
  },
  ADMIN_ANALYTICS: {
    title: 'Analytics',
    url: '/admin/analytics',
    permissions: [PERMISSIONS.ANALYTICS],
    icon: 'BarChart3',
  },
  ADMIN_EXPORTS: {
    title: 'Exports',
    url: '/admin/exports',
    permissions: [PERMISSIONS.EXPORTS],
    icon: 'FileX',
  },
  ADMIN_CONTROL: {
    title: 'Contest Control',
    url: '/admin/control',
    permissions: [PERMISSIONS.CONTEST_CONTROL],
    icon: 'Settings',
  },
  ADMIN_AUDIT: {
    title: 'Audit Log',
    url: '/admin/audit',
    permissions: [PERMISSIONS.AUDIT_LOG],
    icon: 'Shield',
  },
  ADMIN_BACKUP: {
    title: 'Backup',
    url: '/admin/backup',
    permissions: [PERMISSIONS.BACKUP],
    icon: 'Database',
  },
  ADMIN_ATTENDANCE: {
    title: 'Attendance',
    url: '/admin/attendance',
    permissions: [PERMISSIONS.ATTENDANCE],
    icon: 'Activity',
  },
} as const;