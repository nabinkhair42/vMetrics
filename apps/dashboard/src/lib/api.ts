const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async verifyToken(token: string): Promise<{
    valid: boolean;
    user: {
      id: string;
      username: string;
      email: string | null;
      name: string | null;
      avatar_url: string | null;
    };
  }> {
    return this.fetch('/auth/verify', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  getGitHubAuthUrl(): string {
    return `${this.baseUrl}/auth/github`;
  }

  // Dashboard
  async getDashboardData(timeRange: 'today' | 'week' | 'month'): Promise<DashboardData> {
    return this.fetch(`/api/activity/dashboard/${timeRange}`);
  }

  // Goals
  async getGoals(): Promise<{ goals: Goal[] }> {
    return this.fetch('/api/activity/goals');
  }

  async createGoal(type: string, target: number): Promise<{ goal: Goal }> {
    return this.fetch('/api/activity/goals', {
      method: 'POST',
      body: JSON.stringify({ type, target }),
    });
  }

  // Sessions
  async getRecentSessions(limit = 10): Promise<{ sessions: Session[] }> {
    return this.fetch(`/api/activity/sessions/recent?limit=${limit}`);
  }
}

export const api = new ApiClient(API_URL);

// Types
export interface User {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
}

export interface DashboardData {
  summary: {
    total_minutes: number;
    total_files: number;
    total_projects: number;
    sessions_count: number;
    longest_session_minutes: number;
    average_session_minutes: number;
  };
  daily_stats: Array<{
    date: string;
    minutes: number;
    productivity_score: number;
  }>;
  language_stats: Array<{
    name: string;
    minutes: number;
    percentage: number;
    color?: string;
  }>;
  project_stats: Array<{
    name: string;
    minutes: number;
    percentage: number;
  }>;
  goals: Goal[];
  achievements: Achievement[];
  streak: {
    current: number;
    longest: number;
  };
  current_session: Session | null;
}

export interface Goal {
  id: string;
  user_id: string;
  type: 'daily_minutes' | 'weekly_minutes' | 'streak_days' | 'project_focus' | 'language_learning';
  target: number;
  current: number;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  type: string;
  unlocked_at: string;
  metadata?: Record<string, unknown>;
}

export interface Session {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration_ms: number;
  summary: {
    total_minutes: number;
    files_worked: string[];
    languages: Record<string, number>;
    projects: Record<string, number>;
    save_count: number;
    edit_count: number;
    lines_changed: number;
    characters_typed: number;
  };
  current_file: string | null;
  current_project: string | null;
  is_active: boolean;
  machine_id: string;
  created_at: string;
  updated_at: string;
}
