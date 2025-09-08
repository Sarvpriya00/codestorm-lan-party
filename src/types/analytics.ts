export interface ContestAnalytics {
  contestId: string;
  totalSubmissions: number;
  correctSubmissions: number;
  activeParticipants: number;
  lastUpdated: Date;
}

export interface SystemMetrics {
  totalUsers: number;
  totalProblems: number;
  totalSubmissions: number;
  totalContests: number;
  activeContests: number;
  totalReviews: number;
  averageScore: number;
}

export interface ContestStatistics {
  contestId: string;
  contestName: string;
  totalParticipants: number;
  activeParticipants: number;
  totalSubmissions: number;
  correctSubmissions: number;
  averageScore: number;
  problemsCount: number;
  startTime?: Date;
  endTime?: Date;
  status: string;
}

export interface ProblemAnalytics {
  problemId: string;
  contestId: string;
  totalSubmissions: number;
  correctSubmissions: number;
  averageScore: number;
  uniqueParticipants: number;
  successRate: number;
}

export interface ParticipantMetrics {
  userId: string;
  username: string;
  displayName?: string;
  totalSubmissions: number;
  correctSubmissions: number;
  totalScore: number;
  problemsSolved: number;
  averageScore: number;
  rank?: number;
  lastSubmissionTime?: Date;
  contestsParticipated: number;
}

export interface AnalyticsDashboard {
  systemMetrics: SystemMetrics;
  activeContests: ContestAnalytics[];
  lastUpdated: Date;
}

export interface AttendanceRecord {
  id: string;
  contestId: string;
  userId: string;
  username: string;
  displayName?: string;
  checkinTime: Date;
  checkoutTime?: Date;
  status: 'PRESENT' | 'ABSENT';
}

export interface BackupRecord {
  id: string;
  createdAt: Date;
  createdById: string;
  createdByName: string;
  filePath: string;
  status: 'SUCCESS' | 'FAILED';
  fileSize?: number;
}

export interface ExportRequest {
  exportType: 'submissions' | 'users' | 'contests' | 'analytics' | 'full';
  contestId?: string;
  startDate?: Date;
  endDate?: Date;
  format?: 'json' | 'csv' | 'xlsx';
}

export interface ExportResult {
  id: string;
  exportType: string;
  filePath: string;
  fileName: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  completedAt?: Date;
  fileSize?: number;
  downloadUrl?: string;
}