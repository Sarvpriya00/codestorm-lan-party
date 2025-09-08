const API_BASE_URL = 'http://localhost:3001/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient();

// Analytics API functions
export const analyticsApi = {
  getContestAnalytics: (contestId: string) => 
    apiClient.get(`/analytics/contest/${contestId}`),
  
  getContestStatistics: (contestId: string) => 
    apiClient.get(`/analytics/contest/${contestId}/statistics`),
  
  getSystemMetrics: () => 
    apiClient.get('/analytics/system-metrics'),
  
  getAnalyticsDashboard: () => 
    apiClient.get('/analytics/dashboard'),
  
  getProblemAnalytics: (contestId: string, problemId: string) => 
    apiClient.get(`/analytics/contest/${contestId}/problem/${problemId}`),
  
  updateContestAnalytics: (contestId: string) => 
    apiClient.post(`/analytics/contest/${contestId}/update`),
  
  updateAllContestAnalytics: () => 
    apiClient.post('/analytics/update-all')
};

// Export API functions
export const adminApi = {
  exportData: (exportType: string, filters?: any) => 
    apiClient.post('/admin/export', { exportType, filters }),
  
  createBackup: () => 
    apiClient.post('/admin/backup'),
  
  restoreBackup: (backupId: string) => 
    apiClient.post(`/admin/backup/${backupId}/restore`),
  
  getAttendance: (contestId: string) => 
    apiClient.get(`/admin/attendance/${contestId}`),
  
  updateAttendance: (attendanceData: any) => 
    apiClient.put('/admin/attendance', attendanceData)
};

export const contestApi = {
  getContests: (filters?: any) => 
    apiClient.get('/contests' + (filters ? `?${new URLSearchParams(filters)}` : '')),
  
  getContest: (contestId: string) => 
    apiClient.get(`/contests/${contestId}`),
  
  createContest: (contestData: any) => 
    apiClient.post('/contests', contestData),
  
  updateContest: (contestId: string, updates: any) => 
    apiClient.put(`/contests/${contestId}`, updates)
};