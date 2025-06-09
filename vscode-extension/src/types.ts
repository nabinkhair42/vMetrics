export interface ActivityEvent {
  type: 'file_open' | 'file_close' | 'file_save' | 'file_edit' | 'text_change' | 'focus' | 'blur' | 'idle_start' | 'idle_end' | 'session_start' | 'session_end' | 'workspace_change';
  timestamp: number;
  
  // File information
  file?: string;
  fileName?: string;
  fileExtension?: string;
  language?: string;
  relativePath?: string;
  
  // Project/Workspace information
  project?: string;
  workspaceName?: string;
  workspacePath?: string;
  rootFolder?: string;
  
  // Activity details
  duration?: number; // in milliseconds
  linesChanged?: number;
  charactersTyped?: number;
  isActive?: boolean;
  
  // System information
  machineId: string;
  userId: string;
  sessionId: string;
  
  // Additional metadata
  metadata?: {
    editor?: string;
    theme?: string;
    gitBranch?: string;
    [key: string]: any;
  };
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
