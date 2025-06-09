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
  getSummary: async (range: 'today' | 'week' | 'month' = 'today') => {
    const response = await apiClient.get(`/api/activity/summary?range=${range}`);
    return response.data;
  },
  
  getDailyStats: async (days: number = 7) => {
    const response = await apiClient.get(`/api/activity/daily?days=${days}`);
    return response.data;
  },
  
  getProjects: async (days: number = 30) => {
    const response = await apiClient.get(`/api/activity/projects?days=${days}`);
    return response.data;
  },
  
  getLanguages: async (days: number = 30) => {
    const response = await apiClient.get(`/api/activity/languages?days=${days}`);
    return response.data;
  },
  
  getStats: async () => {
    const response = await apiClient.get('/api/activity/stats');
    return response.data;
  },

  // Enhanced API calls for comprehensive data
  getUserStats: async () => {
    const response = await apiClient.get('/api/activity/stats');
    return response.data;
  },

  getTimeSeries: async (days: number = 7) => {
    const response = await apiClient.get(`/api/activity/timeseries?days=${days}`);
    return response.data;
  },

  getRecentActivity: async (limit: number = 10) => {
    const response = await apiClient.get(`/api/activity/recent?limit=${limit}`);
    return response.data;
  }
};

export default apiClient;
