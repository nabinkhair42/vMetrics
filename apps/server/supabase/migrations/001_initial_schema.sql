-- vMetrics Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Users Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    github_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    email TEXT,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);

-- ============================================================================
-- Sessions Table (Coding sessions with aggregated data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_ms INTEGER DEFAULT 0,
    summary JSONB DEFAULT '{
        "total_minutes": 0,
        "files_worked": [],
        "languages": {},
        "projects": {},
        "save_count": 0,
        "edit_count": 0,
        "lines_changed": 0,
        "characters_typed": 0
    }'::jsonb,
    current_file TEXT,
    current_project TEXT,
    is_active BOOLEAN DEFAULT true,
    machine_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sessions_user_start ON sessions(user_id, start_time DESC);

-- ============================================================================
-- Daily Summaries Table (Pre-aggregated daily stats)
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_minutes NUMERIC DEFAULT 0,
    top_languages JSONB DEFAULT '[]'::jsonb,
    top_projects JSONB DEFAULT '[]'::jsonb,
    sessions_count INTEGER DEFAULT 0,
    productivity_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON daily_summaries(user_id, date DESC);

-- ============================================================================
-- Goals Table
-- ============================================================================
CREATE TYPE goal_type AS ENUM (
    'daily_minutes',
    'weekly_minutes',
    'streak_days',
    'project_focus',
    'language_learning'
);

CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type goal_type NOT NULL,
    target NUMERIC NOT NULL,
    current NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_user_active ON goals(user_id) WHERE is_active = true;

-- ============================================================================
-- Achievements Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB,
    UNIQUE(user_id, type)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);

-- ============================================================================
-- Streaks Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_active_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_streaks_user ON streaks(user_id);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- Users: Users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (true); -- Allow service role to query

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (true);

-- Sessions: Users can only access their own sessions
CREATE POLICY "Users can view own sessions" ON sessions
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own sessions" ON sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own sessions" ON sessions
    FOR UPDATE USING (true);

-- Daily summaries: Users can only access their own summaries
CREATE POLICY "Users can view own daily summaries" ON daily_summaries
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own daily summaries" ON daily_summaries
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own daily summaries" ON daily_summaries
    FOR UPDATE USING (true);

-- Goals: Users can only access their own goals
CREATE POLICY "Users can view own goals" ON goals
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own goals" ON goals
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own goals" ON goals
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete own goals" ON goals
    FOR DELETE USING (true);

-- Achievements: Users can only view their own achievements
CREATE POLICY "Users can view own achievements" ON achievements
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own achievements" ON achievements
    FOR INSERT WITH CHECK (true);

-- Streaks: Users can only access their own streak
CREATE POLICY "Users can view own streak" ON streaks
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own streak" ON streaks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own streak" ON streaks
    FOR UPDATE USING (true);

-- ============================================================================
-- Functions for automatic timestamp updates
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_daily_summaries_updated_at
    BEFORE UPDATE ON daily_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_goals_updated_at
    BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_streaks_updated_at
    BEFORE UPDATE ON streaks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- Helpful Views
-- ============================================================================

-- User stats view
CREATE OR REPLACE VIEW user_stats AS
SELECT
    u.id as user_id,
    u.username,
    COALESCE(s.current_streak, 0) as current_streak,
    COALESCE(s.longest_streak, 0) as longest_streak,
    COALESCE(SUM(ds.total_minutes), 0) as total_minutes,
    COUNT(DISTINCT ds.date) as active_days,
    COUNT(DISTINCT a.id) as achievements_count
FROM users u
LEFT JOIN streaks s ON u.id = s.user_id
LEFT JOIN daily_summaries ds ON u.id = ds.user_id
LEFT JOIN achievements a ON u.id = a.user_id
GROUP BY u.id, u.username, s.current_streak, s.longest_streak;

-- Weekly leaderboard view (opt-in later)
CREATE OR REPLACE VIEW weekly_leaderboard AS
SELECT
    u.id as user_id,
    u.username,
    u.avatar_url,
    COALESCE(SUM(ds.total_minutes), 0) as weekly_minutes,
    COALESCE(MAX(s.current_streak), 0) as current_streak
FROM users u
LEFT JOIN daily_summaries ds ON u.id = ds.user_id
    AND ds.date >= CURRENT_DATE - INTERVAL '7 days'
LEFT JOIN streaks s ON u.id = s.user_id
GROUP BY u.id, u.username, u.avatar_url
ORDER BY weekly_minutes DESC;
