// ============================================================================
// Activity Types
// ============================================================================

export type ActivityType =
  | 'file_open'
  | 'file_close'
  | 'file_save'
  | 'file_edit'
  | 'focus'
  | 'blur'
  | 'idle_start'
  | 'idle_end'
  | 'session_start'
  | 'session_end';

export interface ActivityEvent {
  type: ActivityType;
  timestamp: number; // Unix timestamp
  file?: string;
  fileName?: string;
  fileExtension?: string;
  language?: string;
  project?: string;
  durationMs?: number;
  linesChanged?: number;
  charactersTyped?: number;
}

// ============================================================================
// Session Types
// ============================================================================

export interface SessionSummary {
  totalMinutes: number;
  filesWorked: Set<string>;
  languages: Map<string, number>; // language -> minutes
  projects: Map<string, number>; // project -> minutes
  saveCount: number;
  editCount: number;
  linesChanged: number;
  charactersTyped: number;
}

export interface LocalSession {
  sessionId: string;
  startTime: number;
  activities: ActivityEvent[];
  summary: SessionSummary;
}

export interface SerializedSession {
  session_id: string;
  start_time: string;
  end_time?: string;
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
  is_active: boolean;
  current_file?: string | null;
  current_project?: string | null;
  machine_id: string;
}

// ============================================================================
// File Info Types
// ============================================================================

export interface FileInfo {
  file: string;
  fileName: string;
  fileExtension: string;
  language: string;
  relativePath?: string;
  project: string;
  workspaceName?: string;
  workspacePath?: string;
}

// ============================================================================
// Config Types
// ============================================================================

export interface TrackerConfig {
  serverUrl: string;
  idleTimeoutMinutes: number;
  syncIntervalSeconds: number;
  maxBatchSize: number;
  offlineStoragePath?: string;
}

export const DEFAULT_CONFIG: TrackerConfig = {
  serverUrl: 'http://localhost:3001',
  idleTimeoutMinutes: 5,
  syncIntervalSeconds: 90,
  maxBatchSize: 30,
};

// ============================================================================
// Auth Types
// ============================================================================

export interface UserSession {
  token: string;
  userId: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  expiresAt: number;
}

// ============================================================================
// IDE Adapter Interface
// ============================================================================

export interface IDEAdapter {
  // Identity
  getName(): string;

  // Event listeners
  onFileOpen(callback: (file: FileInfo) => void): void;
  onFileClose(callback: (file: FileInfo) => void): void;
  onFileSave(callback: (file: FileInfo) => void): void;
  onFileEdit(callback: (file: FileInfo, linesChanged: number, charsTyped: number) => void): void;
  onWindowFocus(callback: () => void): void;
  onWindowBlur(callback: () => void): void;

  // File info helpers
  getActiveFileInfo(): FileInfo | null;
  getWorkspaceInfo(): { name: string; path: string } | null;

  // Storage
  getSecret(key: string): Promise<string | undefined>;
  setSecret(key: string, value: string): Promise<void>;
  deleteSecret(key: string): Promise<void>;
  getGlobalState<T>(key: string): T | undefined;
  setGlobalState<T>(key: string, value: T): Promise<void>;

  // UI
  showStatusBarItem(text: string, tooltip?: string): void;
  hideStatusBarItem(): void;
  showNotification(message: string, type: 'info' | 'warning' | 'error'): void;

  // Auth
  authenticateWithGitHub(): Promise<string>;

  // Dispose
  dispose(): void;
}
