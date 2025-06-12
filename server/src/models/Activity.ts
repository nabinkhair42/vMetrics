import mongoose, { Document, Schema, Types } from 'mongoose';

// Smart session-based activity tracking
export interface IActivitySession extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  sessionId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in milliseconds
  
  // Aggregated summary data
  summary: {
    totalMinutes: number;
    filesWorked: string[];
    languages: Map<string, number>; // language -> minutes
    projects: Map<string, number>;   // project -> minutes
    saveCount: number;
    editCount: number;
    linesChanged: number;
    charactersTyped: number;
  };
  
  // Current status for real-time
  currentFile?: string;
  currentProject?: string;
  isActive: boolean;
  lastActivity: Date;
  
  // Workspace context
  workspacePath?: string;
  workspaceName?: string;
  machineId: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// Keep original for backward compatibility
export interface IActivity extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  sessionId: string;
  type: 'file_open' | 'file_close' | 'file_save' | 'file_edit' | 'text_change' | 'focus' | 'blur' | 'idle_start' | 'idle_end' | 'session_start' | 'session_end' | 'workspace_change';
  timestamp: Date;
  
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
  
  // Additional metadata
  metadata?: {
    editor?: string;
    theme?: string;
    gitBranch?: string;
    [key: string]: any;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema<IActivity>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['file_open', 'file_close', 'file_save', 'file_edit', 'text_change', 'focus', 'blur', 'idle_start', 'idle_end', 'session_start', 'session_end', 'workspace_change'],
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  
  // File information
  file: {
    type: String,
    index: true
  },
  fileName: String,
  fileExtension: {
    type: String,
    index: true
  },
  language: {
    type: String,
    index: true
  },
  relativePath: String,
  
  // Project/Workspace information
  project: {
    type: String,
    index: true
  },
  workspaceName: {
    type: String,
    index: true
  },
  workspacePath: String,
  rootFolder: String,
  
  // Activity details
  duration: Number,
  linesChanged: Number,
  charactersTyped: Number,
  isActive: Boolean,
  
  // System information
  machineId: {
    type: String,
    required: true,
    index: true
  },
  
  // Additional metadata
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'activities'
});

// Compound indexes for efficient queries
activitySchema.index({ userId: 1, timestamp: -1 });
activitySchema.index({ userId: 1, type: 1, timestamp: -1 });
activitySchema.index({ userId: 1, language: 1, timestamp: -1 });
activitySchema.index({ userId: 1, project: 1, timestamp: -1 });
activitySchema.index({ userId: 1, sessionId: 1 });
activitySchema.index({ timestamp: -1 }); // For recent activities
activitySchema.index({ userId: 1, timestamp: -1, isActive: 1 }); // For live tracking

// Smart session schema
const activitySessionSchema = new Schema<IActivitySession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  summary: {
    totalMinutes: { type: Number, default: 0 },
    filesWorked: [String],
    languages: {
      type: Map,
      of: Number,
      default: new Map()
    },
    projects: {
      type: Map,
      of: Number,
      default: new Map()
    },
    saveCount: { type: Number, default: 0 },
    editCount: { type: Number, default: 0 },
    linesChanged: { type: Number, default: 0 },
    charactersTyped: { type: Number, default: 0 }
  },
  currentFile: String,
  currentProject: String,
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  workspacePath: String,
  workspaceName: String,
  machineId: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true,
  collection: 'activity_sessions'
});

// Optimized indexes for sessions
activitySessionSchema.index({ userId: 1, startTime: -1 });
activitySessionSchema.index({ userId: 1, isActive: 1, lastActivity: -1 });
activitySessionSchema.index({ userId: 1, 'summary.totalMinutes': -1 });

export const Activity = mongoose.model<IActivity>('Activity', activitySchema);
export const ActivitySession = mongoose.model<IActivitySession>('ActivitySession', activitySessionSchema);

// Daily summary for aggregated insights
export interface IDailySummary extends Document {
  userId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  topLanguages: Array<{ name: string; minutes: number; percentage: number }>;
  topProjects: Array<{ name: string; minutes: number; percentage: number }>;
  sessionsCount: number;
  productivityScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const dailySummarySchema = new Schema<IDailySummary>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String,
    required: true,
    index: true
  },
  totalMinutes: { type: Number, default: 0 },
  topLanguages: [{
    name: String,
    minutes: Number,
    percentage: Number
  }],
  topProjects: [{
    name: String,
    minutes: Number,
    percentage: Number
  }],
  sessionsCount: { type: Number, default: 0 },
  productivityScore: { type: Number, default: 0 }
}, {
  timestamps: true,
  collection: 'daily_summaries'
});

dailySummarySchema.index({ userId: 1, date: -1 }, { unique: true });

export const DailySummary = mongoose.model<IDailySummary>('DailySummary', dailySummarySchema);
