import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Types for our database schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          github_id: string;
          username: string;
          email: string | null;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          github_id: string;
          username: string;
          email?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          github_id?: string;
          username?: string;
          email?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          start_time: string;
          end_time?: string | null;
          duration_ms?: number;
          summary?: {
            total_minutes: number;
            files_worked: string[];
            languages: Record<string, number>;
            projects: Record<string, number>;
            save_count: number;
            edit_count: number;
            lines_changed: number;
            characters_typed: number;
          };
          current_file?: string | null;
          current_project?: string | null;
          is_active?: boolean;
          machine_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          end_time?: string | null;
          duration_ms?: number;
          summary?: {
            total_minutes: number;
            files_worked: string[];
            languages: Record<string, number>;
            projects: Record<string, number>;
            save_count: number;
            edit_count: number;
            lines_changed: number;
            characters_typed: number;
          };
          current_file?: string | null;
          current_project?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      daily_summaries: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          total_minutes: number;
          top_languages: Array<{ name: string; minutes: number; percentage: number }>;
          top_projects: Array<{ name: string; minutes: number; percentage: number }>;
          sessions_count: number;
          productivity_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          total_minutes?: number;
          top_languages?: Array<{ name: string; minutes: number; percentage: number }>;
          top_projects?: Array<{ name: string; minutes: number; percentage: number }>;
          sessions_count?: number;
          productivity_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          total_minutes?: number;
          top_languages?: Array<{ name: string; minutes: number; percentage: number }>;
          top_projects?: Array<{ name: string; minutes: number; percentage: number }>;
          sessions_count?: number;
          productivity_score?: number;
          updated_at?: string;
        };
      };
      goals: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'daily_minutes' | 'weekly_minutes' | 'streak_days' | 'project_focus' | 'language_learning';
          target: number;
          current?: number;
          is_active?: boolean;
          start_date?: string;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          target?: number;
          current?: number;
          is_active?: boolean;
          end_date?: string | null;
          updated_at?: string;
        };
      };
      achievements: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          unlocked_at: string;
          metadata: Record<string, unknown> | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          unlocked_at?: string;
          metadata?: Record<string, unknown> | null;
        };
        Update: never;
      };
      streaks: {
        Row: {
          id: string;
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_active_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_active_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          current_streak?: number;
          longest_streak?: number;
          last_active_date?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Create Supabase client with service role for server-side operations
export const supabase = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Anon client for public operations
export const supabaseAnon = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
);
