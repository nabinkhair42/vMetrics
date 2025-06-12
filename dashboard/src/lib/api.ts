import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  loginWithGithub: () => {
    window.location.href = `${API_BASE_URL}/auth/github`;
  },
  
  logout: async () => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('auth_token');
  },
  
  verifyToken: async (token: string) => {
    const response = await apiClient.get('/auth/verify', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};

// Activity API
export const activityAPI = {
  // Session-based API (using consolidated /api/activity endpoints)
  getDashboardData: async (timeRange: string = 'today') => {
    const response = await apiClient.get(`/api/activity/dashboard/${timeRange}`);
    return response.data;
  },

  getTeamStatus: async () => {
    const response = await apiClient.get('/api/activity/status/team');
    return response.data;
  },

  getRecentSessions: async (limit: number = 10) => {
    const response = await apiClient.get(`/api/activity/sessions/recent?limit=${limit}`);
    return response.data;
  },

  sendStatusUpdate: async (status: { currentFile?: string; currentProject?: string; sessionId: string }) => {
    const response = await apiClient.post('/api/activity/status', status);
    return response.data;
  },

  endSession: async (sessionId: string) => {
    const response = await apiClient.post('/api/activity/session/end', { sessionId });
    return response.data;
  },

  // Legacy wrapper functions for backward compatibility (redirect to new endpoints)
  getSummary: async (range: 'today' | 'week' | 'month' = 'today') => {
    const response = await apiClient.get(`/api/activity/dashboard/${range}`);
    return response.data;
  },
  
  getDailyStats: async (days: number = 7) => {
    const timeRange = days <= 1 ? 'today' : days <= 7 ? 'week' : 'month';
    const response = await apiClient.get(`/api/activity/dashboard/${timeRange}`);
    return response.data;
  },
  
  getProjects: async (days: number = 30) => {
    const timeRange = days <= 7 ? 'week' : 'month';
    const response = await apiClient.get(`/api/activity/dashboard/${timeRange}`);
    return response.data?.projects || [];
  },
  
  getLanguages: async (days: number = 30) => {
    const timeRange = days <= 7 ? 'week' : 'month';
    const response = await apiClient.get(`/api/activity/dashboard/${timeRange}`);
    return response.data?.languages || [];
  },
  
  getStats: async () => {
    const response = await apiClient.get('/api/activity/dashboard/today');
    return response.data;
  },

  getUserStats: async () => {
    const response = await apiClient.get('/api/activity/dashboard/today');
    return response.data;
  },

  getTimeSeries: async (days: number = 7) => {
    const timeRange = days <= 1 ? 'today' : days <= 7 ? 'week' : 'month';
    const response = await apiClient.get(`/api/activity/dashboard/${timeRange}`);
    return response.data?.dailyTrend || [];
  },

  getRecentActivity: async (limit: number = 10) => {
    const response = await apiClient.get(`/api/activity/sessions/recent?limit=${limit}`);
    return response.data;
  }
};

export default apiClient;
