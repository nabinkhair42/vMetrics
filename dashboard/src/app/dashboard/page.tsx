'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { activityAPI } from '@/lib/api';
import type { UserStats, DashboardSummary } from '@/lib/types';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { ActivityChart, ProjectChart } from '@/components/dashboard/ActivityChart';
import { LanguageStats, RecentActivity } from '@/components/dashboard/LanguageStats';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, RefreshCw } from 'lucide-react';

interface DashboardData {
  userStats: UserStats;
  summary: DashboardSummary;
  timeSeries: Array<{
    time: string;
    minutes: number;
    sessions: number;
  }>;
  projects: Array<{
    name: string;
    minutes: number;
    files: number;
  }>;
  languages: Array<{
    name: string;
    minutes: number;
    percentage: number;
    color: string;
  }>;
  recentActivity: Array<{
    timestamp: string;
    type: 'file_open' | 'file_save' | 'session_start' | 'session_end';
    file?: string;
    project?: string;
    duration?: number;
  }>;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [userStats, dailyStats, projects, languages, recentActivity] = await Promise.all([
        activityAPI.getUserStats(),
        activityAPI.getTimeSeries(7),
        activityAPI.getProjects(30),
        activityAPI.getLanguages(30),
        activityAPI.getRecentActivity(10)
      ]);

      // Transform daily stats for chart
      const timeSeries = dailyStats.map((day: any) => ({
        time: new Date(day._id).toLocaleDateString('en-US', { weekday: 'short' }),
        minutes: Math.round(day.totalMinutes || 0),
        sessions: day.sessionCount || 0
      }));

      // Transform projects data
      const transformedProjects = projects.map((project: any) => ({
        name: project._id || 'Unknown',
        minutes: Math.round(project.totalMinutes || 0),
        files: project.sessionCount || 0
      }));

      // Create dashboard summary from user stats
      const summary: DashboardSummary = {
        todayMinutes: userStats.todayMinutes,
        todayFiles: userStats.activeProjects.length,
        todayProjects: userStats.activeProjects.length,
        activeProject: userStats.currentProject,
        longestSession: Math.round(userStats.averageSessionTime),
        trends: {
          time: userStats.todayMinutes > userStats.weeklyStats.averageDaily ? 1 : -1,
          files: userStats.activeProjects.length > 3 ? 1 : -1,
          projects: userStats.activeProjects.length
        }
      };

      const dashboardData: DashboardData = {
        userStats,
        summary,
        timeSeries,
        projects: transformedProjects.slice(0, 5),
        languages: languages.slice(0, 5),
        recentActivity: recentActivity || []
      };

      setData(dashboardData);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading your productivity data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchDashboardData} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.username}!</h1>
          <p className="text-muted-foreground">Here's your coding productivity overview</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {data && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="languages">Languages</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Overview */}
            <StatsOverview stats={data.summary} />

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-7">
              <ActivityChart data={data.timeSeries} type="bar" />
              <LanguageStats languages={data.languages} />
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-7">
              <ProjectChart data={data.projects} />
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                  <CardDescription>Detailed breakdown of your project activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.projects.map((project, index) => (
                      <div key={project.name} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{project.name}</h3>
                          <p className="text-sm text-muted-foreground">{project.files} files worked on</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {Math.floor(project.minutes / 60)}h {project.minutes % 60}m
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="languages" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <LanguageStats languages={data.languages} />
              <Card>
                <CardHeader>
                  <CardTitle>Language Insights</CardTitle>
                  <CardDescription>Your programming language usage patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-muted rounded-lg">
                      <h3 className="text-lg font-semibold mb-2">Most Used Language</h3>
                      <p className="text-2xl font-bold">{data.languages[0]?.name || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.languages[0]?.percentage.toFixed(1)}% of your coding time
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <div className="grid gap-6">
              <ActivityChart data={data.timeSeries} type="line" />
              <RecentActivity activities={data.recentActivity} />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
