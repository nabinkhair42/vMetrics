import { z } from 'zod';

// ============================================================================
// User Types
// ============================================================================

export const UserSchema = z.object({
  id: z.string().uuid(),
  github_id: z.string(),
  username: z.string(),
  email: z.string().email().nullable(),
  name: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;

// ============================================================================
// Activity Types
// ============================================================================

export const ActivityTypeEnum = z.enum([
  'file_open',
  'file_close',
  'file_save',
  'file_edit',
  'focus',
  'blur',
  'idle_start',
  'idle_end',
  'session_start',
  'session_end',
]);

export type ActivityType = z.infer<typeof ActivityTypeEnum>;

export const ActivityEventSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  session_id: z.string().uuid(),
  type: ActivityTypeEnum,
  timestamp: z.string().datetime(),
  file_name: z.string().nullable().optional(),
  file_extension: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  project: z.string().nullable().optional(),
  duration_ms: z.number().int().nonnegative().nullable().optional(),
  lines_changed: z.number().int().nonnegative().nullable().optional(),
  characters_typed: z.number().int().nonnegative().nullable().optional(),
  machine_id: z.string(),
});

export type ActivityEvent = z.infer<typeof ActivityEventSchema>;

// ============================================================================
// Session Types
// ============================================================================

export const SessionSummarySchema = z.object({
  total_minutes: z.number().nonnegative(),
  files_worked: z.array(z.string()),
  languages: z.record(z.string(), z.number()),
  projects: z.record(z.string(), z.number()),
  save_count: z.number().int().nonnegative(),
  edit_count: z.number().int().nonnegative(),
  lines_changed: z.number().int().nonnegative(),
  characters_typed: z.number().int().nonnegative(),
});

export type SessionSummary = z.infer<typeof SessionSummarySchema>;

export const SessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime().nullable(),
  duration_ms: z.number().int().nonnegative(),
  summary: SessionSummarySchema,
  current_file: z.string().nullable(),
  current_project: z.string().nullable(),
  is_active: z.boolean(),
  machine_id: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Session = z.infer<typeof SessionSchema>;

// ============================================================================
// Daily Summary Types
// ============================================================================

export const LanguageStatSchema = z.object({
  name: z.string(),
  minutes: z.number().nonnegative(),
  percentage: z.number().min(0).max(100),
  color: z.string().optional(),
});

export type LanguageStat = z.infer<typeof LanguageStatSchema>;

export const ProjectStatSchema = z.object({
  name: z.string(),
  minutes: z.number().nonnegative(),
  percentage: z.number().min(0).max(100),
});

export type ProjectStat = z.infer<typeof ProjectStatSchema>;

export const DailySummarySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total_minutes: z.number().nonnegative(),
  top_languages: z.array(LanguageStatSchema),
  top_projects: z.array(ProjectStatSchema),
  sessions_count: z.number().int().nonnegative(),
  productivity_score: z.number().min(0).max(100),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type DailySummary = z.infer<typeof DailySummarySchema>;

// ============================================================================
// Goals Types
// ============================================================================

export const GoalTypeEnum = z.enum([
  'daily_minutes',
  'weekly_minutes',
  'streak_days',
  'project_focus',
  'language_learning',
]);

export type GoalType = z.infer<typeof GoalTypeEnum>;

export const GoalSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: GoalTypeEnum,
  target: z.number().positive(),
  current: z.number().nonnegative(),
  is_active: z.boolean(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Goal = z.infer<typeof GoalSchema>;

// ============================================================================
// Achievement Types
// ============================================================================

export const AchievementTypeEnum = z.enum([
  'first_session',
  'first_hour',
  'first_day_100',
  'week_streak_7',
  'week_streak_30',
  'total_hours_100',
  'total_hours_500',
  'total_hours_1000',
  'polyglot_5',
  'polyglot_10',
  'night_owl',
  'early_bird',
  'marathon_session',
  'focus_master',
]);

export type AchievementType = z.infer<typeof AchievementTypeEnum>;

export const AchievementSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: AchievementTypeEnum,
  unlocked_at: z.string().datetime(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type Achievement = z.infer<typeof AchievementSchema>;

// ============================================================================
// API Request/Response Types
// ============================================================================

export const SessionUpdateRequestSchema = z.object({
  session_id: z.string().uuid(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime().optional(),
  duration_ms: z.number().int().nonnegative(),
  summary: SessionSummarySchema,
  is_active: z.boolean(),
  current_file: z.string().nullable().optional(),
  current_project: z.string().nullable().optional(),
  machine_id: z.string(),
});

export type SessionUpdateRequest = z.infer<typeof SessionUpdateRequestSchema>;

export const StatusUpdateRequestSchema = z.object({
  session_id: z.string().uuid(),
  current_file: z.string().nullable().optional(),
  current_project: z.string().nullable().optional(),
});

export type StatusUpdateRequest = z.infer<typeof StatusUpdateRequestSchema>;

export const DashboardResponseSchema = z.object({
  summary: z.object({
    total_minutes: z.number().nonnegative(),
    total_files: z.number().int().nonnegative(),
    total_projects: z.number().int().nonnegative(),
    sessions_count: z.number().int().nonnegative(),
    longest_session_minutes: z.number().nonnegative(),
    average_session_minutes: z.number().nonnegative(),
  }),
  daily_stats: z.array(z.object({
    date: z.string(),
    minutes: z.number().nonnegative(),
    productivity_score: z.number().min(0).max(100),
  })),
  language_stats: z.array(LanguageStatSchema),
  project_stats: z.array(ProjectStatSchema),
  goals: z.array(GoalSchema),
  achievements: z.array(AchievementSchema),
  streak: z.object({
    current: z.number().int().nonnegative(),
    longest: z.number().int().nonnegative(),
  }),
  current_session: SessionSchema.nullable(),
});

export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;

// ============================================================================
// WebSocket Event Types
// ============================================================================

export interface ServerToClientEvents {
  'activity:update': (data: { file: string; project: string; language: string }) => void;
  'session:start': (data: { session_id: string }) => void;
  'session:end': (data: { session_id: string; duration_ms: number }) => void;
  'goal:progress': (data: { goal_id: string; current: number; target: number }) => void;
  'achievement:unlock': (data: Achievement) => void;
  'stats:update': (data: { total_minutes: number; today_minutes: number }) => void;
}

export interface ClientToServerEvents {
  'subscribe:user': (user_id: string) => void;
  'unsubscribe:user': (user_id: string) => void;
}

// ============================================================================
// JWT Types
// ============================================================================

export interface JWTPayload {
  user_id: string;
  github_id: string;
  username: string;
  email?: string;
  iat: number;
  exp: number;
}
