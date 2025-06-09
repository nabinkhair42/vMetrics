export interface ActivityEvent {
  type: 'file_open' | 'file_close' | 'file_save' | 'file_edit' | 'focus' | 'blur' | 'idle_start' | 'idle_end' | 'session_start' | 'session_end';
  timestamp: number;
  file?: string;
  language?: string;
  project?: string;
  machineId: string;
  duration?: number; // in milliseconds
}

export interface UserSession {
  userId: string;
  token: string;
  email?: string;
  username?: string;
}

export interface Config {
  serverUrl: string;
  idleTimeoutMinutes: number;
}
