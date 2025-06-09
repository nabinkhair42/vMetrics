'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Clock, FileText, Code, TrendingUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ title, value, description, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center pt-1">
            <TrendingUp className={`h-4 w-4 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`} />
            <span className={`text-xs ml-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}% from yesterday
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatsOverviewProps {
  stats: {
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
  };
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Today's Coding Time"
        value={formatTime(stats.todayMinutes)}
        description="Total active coding time"
        icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        trend={stats.trends ? {
          value: stats.trends.time,
          isPositive: stats.trends.time > 0
        } : undefined}
      />
      <StatCard
        title="Files Worked On"
        value={stats.todayFiles.toString()}
        description="Different files opened today"
        icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        trend={stats.trends ? {
          value: stats.trends.files,
          isPositive: stats.trends.files > 0
        } : undefined}
      />
      <StatCard
        title="Active Projects"
        value={stats.todayProjects.toString()}
        description="Projects worked on today"
        icon={<Code className="h-4 w-4 text-muted-foreground" />}
        trend={stats.trends ? {
          value: stats.trends.projects,
          isPositive: stats.trends.projects > 0
        } : undefined}
      />
      <StatCard
        title="Longest Session"
        value={formatTime(stats.longestSession)}
        description="Your longest focus session"
        icon={<Activity className="h-4 w-4 text-muted-foreground" />}
      />
    </div>
  );
}
