import { supabase } from '../config/supabase.js';
import type {
  SessionUpdateRequest,
  DashboardResponse,
  LanguageStat,
  ProjectStat,
} from '../types/index.js';

// Language colors mapping
const LANGUAGE_COLORS: Record<string, string> = {
  typescript: '#3178c6',
  javascript: '#f7df1e',
  python: '#3776ab',
  rust: '#dea584',
  go: '#00add8',
  java: '#b07219',
  csharp: '#239120',
  cpp: '#f34b7d',
  c: '#555555',
  ruby: '#cc342d',
  php: '#4f5d95',
  swift: '#f05138',
  kotlin: '#a97bff',
  scala: '#c22d40',
  html: '#e34c26',
  css: '#563d7c',
  scss: '#c6538c',
  vue: '#42b883',
  react: '#61dafb',
  svelte: '#ff3e00',
  markdown: '#083fa1',
  json: '#292929',
  yaml: '#cb171e',
  sql: '#e38c00',
  shell: '#89e051',
  dockerfile: '#384d54',
};

function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language.toLowerCase()] || '#6b7280';
}

export class ActivityService {
  async updateSession(userId: string, data: SessionUpdateRequest) {
    const now = new Date().toISOString();

    // Check if session exists
    const { data: existing } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', data.session_id)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing session
      const { error } = await supabase
        .from('sessions')
        .update({
          end_time: data.end_time || null,
          duration_ms: data.duration_ms,
          summary: data.summary,
          current_file: data.current_file || null,
          current_project: data.current_project || null,
          is_active: data.is_active,
          updated_at: now,
        })
        .eq('id', data.session_id);

      if (error) throw error;
    } else {
      // Create new session
      const { error } = await supabase
        .from('sessions')
        .insert({
          id: data.session_id,
          user_id: userId,
          start_time: data.start_time,
          end_time: data.end_time || null,
          duration_ms: data.duration_ms,
          summary: data.summary,
          current_file: data.current_file || null,
          current_project: data.current_project || null,
          is_active: data.is_active,
          machine_id: data.machine_id,
          created_at: now,
          updated_at: now,
        });

      if (error) throw error;
    }

    // Update daily summary
    await this.updateDailySummary(userId);

    return { success: true };
  }

  async endSession(userId: string, sessionId: string) {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('sessions')
      .update({
        is_active: false,
        end_time: now,
        updated_at: now,
      })
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true };
  }

  async updateDailySummary(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = `${today}T00:00:00.000Z`;
    const endOfDay = `${today}T23:59:59.999Z`;

    // Get today's sessions
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay);

    if (error) throw error;

    if (!sessions || sessions.length === 0) return;

    // Aggregate statistics
    let totalMinutes = 0;
    const languageMinutes: Record<string, number> = {};
    const projectMinutes: Record<string, number> = {};

    for (const session of sessions) {
      const summary = session.summary;
      totalMinutes += summary.total_minutes;

      for (const [lang, mins] of Object.entries(summary.languages)) {
        languageMinutes[lang] = (languageMinutes[lang] || 0) + mins;
      }

      for (const [proj, mins] of Object.entries(summary.projects)) {
        projectMinutes[proj] = (projectMinutes[proj] || 0) + mins;
      }
    }

    // Calculate top languages
    const topLanguages: LanguageStat[] = Object.entries(languageMinutes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, minutes]) => ({
        name,
        minutes,
        percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
        color: getLanguageColor(name),
      }));

    // Calculate top projects
    const topProjects: ProjectStat[] = Object.entries(projectMinutes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, minutes]) => ({
        name,
        minutes,
        percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
      }));

    // Productivity score (100% = 4 hours)
    const productivityScore = Math.min(100, Math.round((totalMinutes / 240) * 100));

    const now = new Date().toISOString();

    // Upsert daily summary
    const { error: upsertError } = await supabase
      .from('daily_summaries')
      .upsert({
        user_id: userId,
        date: today,
        total_minutes: totalMinutes,
        top_languages: topLanguages,
        top_projects: topProjects,
        sessions_count: sessions.length,
        productivity_score: productivityScore,
        updated_at: now,
      }, {
        onConflict: 'user_id,date',
      });

    if (upsertError) throw upsertError;

    // Update streak
    await this.updateStreak(userId);
  }

  async updateStreak(userId: string) {
    const today = new Date().toISOString().split('T')[0];

    // Get user's streak record
    const { data: streak } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    const now = new Date().toISOString();

    if (!streak) {
      // Create new streak record
      await supabase.from('streaks').insert({
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_active_date: today,
        created_at: now,
        updated_at: now,
      });
      return;
    }

    // Check if last active was yesterday
    const lastActive = new Date(streak.last_active_date);
    const todayDate = new Date(today);
    const diffDays = Math.floor(
      (todayDate.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    );

    let newStreak = streak.current_streak;

    if (diffDays === 1) {
      // Consecutive day - increment streak
      newStreak = streak.current_streak + 1;
    } else if (diffDays > 1) {
      // Streak broken - reset
      newStreak = 1;
    }
    // diffDays === 0 means same day, keep current streak

    const newLongest = Math.max(streak.longest_streak, newStreak);

    await supabase
      .from('streaks')
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_active_date: today,
        updated_at: now,
      })
      .eq('user_id', userId);
  }

  async getDashboardData(
    userId: string,
    timeRange: 'today' | 'week' | 'month'
  ): Promise<DashboardResponse> {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const startDateStr = startDate.toISOString();

    // Fetch all data in parallel
    const [
      sessionsResult,
      dailySummariesResult,
      goalsResult,
      achievementsResult,
      streakResult,
      currentSessionResult,
    ] = await Promise.all([
      supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', startDateStr)
        .order('start_time', { ascending: false }),
      supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true }),
      supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true),
      supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false }),
      supabase
        .from('streaks')
        .select('*')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single(),
    ]);

    const sessions = sessionsResult.data || [];
    const dailySummaries = dailySummariesResult.data || [];
    const goals = goalsResult.data || [];
    const achievements = achievementsResult.data || [];
    const streak = streakResult.data;
    const currentSession = currentSessionResult.data;

    // Calculate summary
    let totalMinutes = 0;
    const allFiles = new Set<string>();
    const allProjects = new Set<string>();
    const languageMinutes: Record<string, number> = {};
    const projectMinutes: Record<string, number> = {};
    let longestSessionMs = 0;

    for (const session of sessions) {
      const summary = session.summary;
      totalMinutes += summary.total_minutes;
      longestSessionMs = Math.max(longestSessionMs, session.duration_ms);

      for (const file of summary.files_worked) {
        allFiles.add(file);
      }

      for (const [lang, mins] of Object.entries(summary.languages)) {
        languageMinutes[lang] = (languageMinutes[lang] || 0) + mins;
      }

      for (const [proj, mins] of Object.entries(summary.projects)) {
        allProjects.add(proj);
        projectMinutes[proj] = (projectMinutes[proj] || 0) + mins;
      }
    }

    // Build language stats
    const languageStats: LanguageStat[] = Object.entries(languageMinutes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, minutes]) => ({
        name,
        minutes,
        percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
        color: getLanguageColor(name),
      }));

    // Build project stats
    const projectStats: ProjectStat[] = Object.entries(projectMinutes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, minutes]) => ({
        name,
        minutes,
        percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
      }));

    // Build daily stats
    const dailyStats = dailySummaries.map(ds => ({
      date: ds.date,
      minutes: ds.total_minutes,
      productivity_score: ds.productivity_score,
    }));

    return {
      summary: {
        total_minutes: totalMinutes,
        total_files: allFiles.size,
        total_projects: allProjects.size,
        sessions_count: sessions.length,
        longest_session_minutes: Math.round(longestSessionMs / 60000),
        average_session_minutes: sessions.length > 0
          ? Math.round(totalMinutes / sessions.length)
          : 0,
      },
      daily_stats: dailyStats,
      language_stats: languageStats,
      project_stats: projectStats,
      goals: goals.map(g => ({
        id: g.id,
        user_id: g.user_id,
        type: g.type,
        target: g.target,
        current: g.current,
        is_active: g.is_active,
        start_date: g.start_date,
        end_date: g.end_date,
        created_at: g.created_at,
        updated_at: g.updated_at,
      })),
      achievements: achievements.map(a => ({
        id: a.id,
        user_id: a.user_id,
        type: a.type as any,
        unlocked_at: a.unlocked_at,
        metadata: a.metadata || undefined,
      })),
      streak: {
        current: streak?.current_streak || 0,
        longest: streak?.longest_streak || 0,
      },
      current_session: currentSession ? {
        id: currentSession.id,
        user_id: currentSession.user_id,
        start_time: currentSession.start_time,
        end_time: currentSession.end_time,
        duration_ms: currentSession.duration_ms,
        summary: currentSession.summary,
        current_file: currentSession.current_file,
        current_project: currentSession.current_project,
        is_active: currentSession.is_active,
        machine_id: currentSession.machine_id,
        created_at: currentSession.created_at,
        updated_at: currentSession.updated_at,
      } : null,
    };
  }

  async getRecentSessions(userId: string, limit = 10) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}

export const activityService = new ActivityService();
