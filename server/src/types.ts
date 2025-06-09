export interface ActivityEvent {
  type: 'file_open' | 'file_close' | 'file_save' | 'file_edit' | 'focus' | 'blur' | 'idle_start' | 'idle_end' | 'session_start' | 'session_end';
  timestamp: number;
  file?: string;
  language?: string;
  project?: string;
  machineId: string;
  duration?: number;
}

export interface UserStats {
  todayMinutes: number;
  currentFile?: string;
  activeProjects: string[];
  totalSessions: number;
}

export interface JwtPayload {
  userId: string;
  githubId: string;
  email?: string;
  username?: string;
}
