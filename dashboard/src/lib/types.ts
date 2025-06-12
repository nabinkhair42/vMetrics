// Dashboard types that match the enhanced server-side data model

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
    [key: string]: string | number | boolean | null | undefined;
  };
}

export interface UserStats {
  todayMinutes: number;
  totalCodingTime: number;
  currentFile?: string;
  currentProject?: string;
  activeProjects: string[];
  languageStats: LanguageUsage[];
  totalSessions: number;
  averageSessionTime: number;
  mostUsedLanguage?: string;
  mostActiveProject?: string;
  dailyStats: DailyStats[];
  weeklyStats: WeeklyStats;
  isCurrentlyActive: boolean;
  lastActivityTime?: number;
}

export interface LanguageUsage {
  language: string;
  timeSpent: number; // in minutes
  filesWorked: number;
  percentage: number;
  linesChanged?: number;
}

export interface DailyStats {
  date: string;
  codingTime: number; // in minutes
  filesWorked: string[];
  languages: string[];
  projects: string[];
  sessions: number;
}

export interface WeeklyStats {
  totalTime: number;
  averageDaily: number;
  mostProductiveDay: string;
  languageBreakdown: LanguageUsage[];
  projectBreakdown: ProjectUsage[];
}

export interface ProjectUsage {
  project: string;
  timeSpent: number;
  filesWorked: number;
  percentage: number;
  lastWorked?: number;
}

export interface LiveActivity {
  userId: string;
  isActive: boolean;
  currentFile?: string;
  currentProject?: string;
  currentLanguage?: string;
  sessionStartTime: number;
  lastActivity: number;
}

// Dashboard-specific interfaces
export interface DashboardSummary {
  todayMinutes: number;
  todayFiles: number;
  todayProjects: number;
  activeProject?: string;
  longestSession: number;
  trends?: {
    time: number;
    files: number;
    projects: number;
  };
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface LanguageChartData {
  name: string;
  minutes: number;
  percentage: number;
  color: string;
}

export interface ProjectChartData {
  name: string;
  timeSpent: number;
  percentage: number;
  color: string;
}
