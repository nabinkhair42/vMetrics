import { supabase } from '../config/supabase.js';
import type { Goal, GoalType, Achievement, AchievementType } from '../types/index.js';

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS: Record<AchievementType, {
  name: string;
  description: string;
  check: (stats: UserStats) => boolean;
}> = {
  first_session: {
    name: 'First Steps',
    description: 'Complete your first coding session',
    check: (stats) => stats.totalSessions >= 1,
  },
  first_hour: {
    name: 'Hour One',
    description: 'Code for a total of 1 hour',
    check: (stats) => stats.totalMinutes >= 60,
  },
  first_day_100: {
    name: 'Century',
    description: 'Code for 100 minutes in a single day',
    check: (stats) => stats.todayMinutes >= 100,
  },
  week_streak_7: {
    name: 'Week Warrior',
    description: 'Maintain a 7-day coding streak',
    check: (stats) => stats.currentStreak >= 7,
  },
  week_streak_30: {
    name: 'Monthly Master',
    description: 'Maintain a 30-day coding streak',
    check: (stats) => stats.currentStreak >= 30,
  },
  total_hours_100: {
    name: 'Centurion',
    description: 'Accumulate 100 hours of coding',
    check: (stats) => stats.totalMinutes >= 6000,
  },
  total_hours_500: {
    name: 'Veteran',
    description: 'Accumulate 500 hours of coding',
    check: (stats) => stats.totalMinutes >= 30000,
  },
  total_hours_1000: {
    name: 'Legendary',
    description: 'Accumulate 1000 hours of coding',
    check: (stats) => stats.totalMinutes >= 60000,
  },
  polyglot_5: {
    name: 'Polyglot',
    description: 'Use 5 different programming languages',
    check: (stats) => stats.languagesUsed >= 5,
  },
  polyglot_10: {
    name: 'Language Master',
    description: 'Use 10 different programming languages',
    check: (stats) => stats.languagesUsed >= 10,
  },
  night_owl: {
    name: 'Night Owl',
    description: 'Code between midnight and 4 AM',
    check: (stats) => stats.hasNightSession,
  },
  early_bird: {
    name: 'Early Bird',
    description: 'Start coding before 6 AM',
    check: (stats) => stats.hasEarlySession,
  },
  marathon_session: {
    name: 'Marathon',
    description: 'Complete a 4+ hour coding session',
    check: (stats) => stats.longestSessionMinutes >= 240,
  },
  focus_master: {
    name: 'Focus Master',
    description: 'Complete a 2+ hour session on a single project',
    check: (stats) => stats.longestSingleProjectMinutes >= 120,
  },
};

interface UserStats {
  totalSessions: number;
  totalMinutes: number;
  todayMinutes: number;
  currentStreak: number;
  languagesUsed: number;
  hasNightSession: boolean;
  hasEarlySession: boolean;
  longestSessionMinutes: number;
  longestSingleProjectMinutes: number;
}

export class GoalService {
  async createGoal(userId: string, type: GoalType, target: number): Promise<Goal> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: userId,
        type,
        target,
        current: 0,
        is_active: true,
        start_date: now,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Goal;
  }

  async updateGoalProgress(userId: string, goalId: string, current: number) {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('goals')
      .update({
        current,
        updated_at: now,
      })
      .eq('id', goalId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async getActiveGoals(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;
    return (data || []) as Goal[];
  }

  async updateGoalsFromActivity(userId: string, todayMinutes: number) {
    const goals = await this.getActiveGoals(userId);
    const now = new Date().toISOString();

    for (const goal of goals) {
      if (goal.type === 'daily_minutes') {
        await supabase
          .from('goals')
          .update({
            current: todayMinutes,
            updated_at: now,
          })
          .eq('id', goal.id);
      }
    }
  }

  async checkAchievements(userId: string): Promise<Achievement[]> {
    const stats = await this.getUserStats(userId);
    const newAchievements: Achievement[] = [];

    // Get existing achievements
    const { data: existing } = await supabase
      .from('achievements')
      .select('type')
      .eq('user_id', userId);

    const existingTypes = new Set(existing?.map(a => a.type) || []);

    for (const [type, definition] of Object.entries(ACHIEVEMENT_DEFINITIONS)) {
      if (existingTypes.has(type)) continue;

      if (definition.check(stats)) {
        const now = new Date().toISOString();

        const { data, error } = await supabase
          .from('achievements')
          .insert({
            user_id: userId,
            type,
            unlocked_at: now,
            metadata: { stats },
          })
          .select()
          .single();

        if (!error && data) {
          newAchievements.push(data as unknown as Achievement);
        }
      }
    }

    return newAchievements;
  }

  private async getUserStats(userId: string): Promise<UserStats> {
    const today = new Date().toISOString().split('T')[0];

    // Get sessions
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId);

    // Get streak
    const { data: streak } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get today's summary
    const { data: todaySummary } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    // Calculate stats
    let totalMinutes = 0;
    let longestSessionMinutes = 0;
    let longestSingleProjectMinutes = 0;
    const languages = new Set<string>();
    let hasNightSession = false;
    let hasEarlySession = false;

    for (const session of sessions || []) {
      const sessionMinutes = session.duration_ms / 60000;
      totalMinutes += sessionMinutes;
      longestSessionMinutes = Math.max(longestSessionMinutes, sessionMinutes);

      // Check session time
      const startHour = new Date(session.start_time).getHours();
      if (startHour >= 0 && startHour < 4) hasNightSession = true;
      if (startHour >= 4 && startHour < 6) hasEarlySession = true;

      // Track languages
      const summary = session.summary;
      for (const lang of Object.keys(summary.languages)) {
        languages.add(lang);
      }

      // Track single project focus
      for (const mins of Object.values(summary.projects)) {
        longestSingleProjectMinutes = Math.max(longestSingleProjectMinutes, mins as number);
      }
    }

    return {
      totalSessions: sessions?.length || 0,
      totalMinutes,
      todayMinutes: todaySummary?.total_minutes || 0,
      currentStreak: streak?.current_streak || 0,
      languagesUsed: languages.size,
      hasNightSession,
      hasEarlySession,
      longestSessionMinutes,
      longestSingleProjectMinutes,
    };
  }

  async getAchievementDefinitions() {
    return Object.entries(ACHIEVEMENT_DEFINITIONS).map(([type, def]) => ({
      type,
      name: def.name,
      description: def.description,
    }));
  }
}

export const goalService = new GoalService();
