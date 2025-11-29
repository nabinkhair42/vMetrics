'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useDashboardStore } from '@/store/dashboard-store';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { StatsCard } from '@/components/dashboard/stats-card';
import { ActivityChart } from '@/components/dashboard/activity-chart';
import { LanguageChart } from '@/components/dashboard/language-chart';
import { ProjectList } from '@/components/dashboard/project-list';
import { StreakCard } from '@/components/dashboard/streak-card';
import { AchievementsCard } from '@/components/dashboard/achievements-card';
import { formatDuration, getGreeting } from '@/lib/utils';
import {
  BarChart3,
  Clock,
  FileCode,
  FolderGit2,
  LogOut,
  RefreshCw,
  Loader2,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { data, timeRange, isLoading, fetchData, setTimeRange } =
    useDashboardStore();

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    fetchData();
  }, [user, router, fetchData]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            <span className="text-xl font-bold">vMetrics</span>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchData()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </Button>

            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback>
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline">
                {user.username}
              </span>
            </div>

            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome & Time Range */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {getGreeting()}, {user.name || user.username}
            </h1>
            <p className="text-muted-foreground">
              Here&apos;s your coding activity overview
            </p>
          </div>

          <Tabs
            value={timeRange}
            onValueChange={(v) => setTimeRange(v as 'today' | 'week' | 'month')}
          >
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading && !data ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : data ? (
          <>
            {/* Stats Overview */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Coding Time"
                value={formatDuration(data.summary.total_minutes)}
                subtitle={`${data.summary.sessions_count} sessions`}
                icon={Clock}
              />
              <StatsCard
                title="Files Worked"
                value={data.summary.total_files.toString()}
                subtitle="Unique files"
                icon={FileCode}
              />
              <StatsCard
                title="Projects"
                value={data.summary.total_projects.toString()}
                subtitle="Active projects"
                icon={FolderGit2}
              />
              <StatsCard
                title="Avg Session"
                value={formatDuration(data.summary.average_session_minutes)}
                subtitle={`Longest: ${formatDuration(data.summary.longest_session_minutes)}`}
                icon={BarChart3}
              />
            </div>

            <Separator className="my-8" />

            {/* Charts */}
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ActivityChart data={data.daily_stats} />
              </div>
              <div>
                <StreakCard
                  streak={data.streak}
                  goals={data.goals}
                  todayMinutes={data.summary.total_minutes}
                />
              </div>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-3">
              <LanguageChart data={data.language_stats} />
              <ProjectList data={data.project_stats} />
              <AchievementsCard achievements={data.achievements} />
            </div>
          </>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No data yet</h3>
            <p className="text-muted-foreground">
              Start coding with the vMetrics extension to see your stats
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
