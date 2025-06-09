import mongoose, { Document, Schema, Types } from 'mongoose';

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

export const Activity = mongoose.model<IActivity>('Activity', activitySchema);
