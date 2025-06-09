import mongoose, { Document, Schema } from 'mongoose';

export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'file_open' | 'file_close' | 'file_save' | 'file_edit' | 'focus' | 'blur' | 'idle_start' | 'idle_end' | 'session_start' | 'session_end';
  timestamp: Date;
  file?: string;
  language?: string;
  project?: string;
  machineId: string;
  duration?: number; // in milliseconds
  metadata?: Record<string, any>;
}

const activitySchema = new Schema<IActivity>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['file_open', 'file_close', 'file_save', 'file_edit', 'focus', 'blur', 'idle_start', 'idle_end', 'session_start', 'session_end']
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  file: {
    type: String,
    sparse: true
  },
  language: {
    type: String,
    sparse: true
  },
  project: {
    type: String,
    sparse: true,
    index: true
  },
  machineId: {
    type: String,
    required: true,
    index: true
  },
  duration: {
    type: Number
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
activitySchema.index({ userId: 1, timestamp: -1 });
activitySchema.index({ userId: 1, project: 1, timestamp: -1 });
activitySchema.index({ userId: 1, type: 1, timestamp: -1 });

export const Activity = mongoose.model<IActivity>('Activity', activitySchema);
