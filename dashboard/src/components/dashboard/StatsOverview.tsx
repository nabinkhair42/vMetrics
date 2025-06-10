'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSummary, useUserStats, useDailyGoal, useWeeklyGoal } from '@/store';
import { motion } from 'framer-motion';
import { Activity, Clock, Code, FileText, Flame, Target, TrendingUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  progress?: {
    current: number;
    target: number;
  };
  className?: string;
}

function StatCard({ title, value, description, icon, trend, progress, className }: StatCardProps) {
  const progressPercentage = progress ? Math.min((progress.current / progress.target) * 100, 100) : undefined;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`relative overflow-hidden ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
          
          {/* Progress bar for goals */}
          {progress && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span>Progress</span>
                <span className="font-medium">{Math.round(progressPercentage || 0)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}
          
          {/* Trend indicator */}
          {trend && (
            <div className="flex items-center pt-2">
              <TrendingUp className={`h-4 w-4 ${trend.isPositive ? 'text-green-600' : 'text-red-600 rotate-180'}`} />
              <span className={`text-xs ml-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '+' : ''}{trend.value}% from yesterday
              </span>
            </div>
          )}
        </CardContent>
        
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 pointer-events-none" />
      </Card>
    </motion.div>
  );
}

export function EnhancedStatsOverview() {
  const summary = useSummary();
  const userStats = useUserStats();
  const dailyGoal = useDailyGoal();
  const weeklyGoal = useWeeklyGoal();
  
  if (!summary || !userStats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
  
  // Calculate weekly progress
  const weeklyProgress = userStats.weeklyStats.totalTime;
  const dailyProgress = summary.todayMinutes;
  
  // Calculate streak (mock for now - should come from backend)
  const currentStreak = userStats.totalSessions > 0 ? Math.min(userStats.totalSessions, 7) : 0;
  
  return (
    <div className="space-y-6">
      {/* Primary stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Coding Time"
          value={formatTime(summary.todayMinutes)}
          description="Time spent coding today"
          icon={<Clock className="h-4 w-4" />}
          trend={summary.trends ? {
            value: summary.trends.time * 10, // Mock percentage
            isPositive: summary.trends.time > 0
          } : undefined}
          progress={{
            current: dailyProgress,
            target: dailyGoal
          }}
          className="border-l-4 border-l-blue-500"
        />
        
        <StatCard
          title="Files Worked On"
          value={summary.todayFiles.toString()}
          description="Different files opened today"
          icon={<FileText className="h-4 w-4" />}
          trend={summary.trends ? {
            value: summary.trends.files * 15,
            isPositive: summary.trends.files > 0
          } : undefined}
          className="border-l-4 border-l-green-500"
        />
        
        <StatCard
          title="Active Projects"
          value={summary.todayProjects.toString()}
          description="Projects worked on today"
          icon={<Code className="h-4 w-4" />}
          trend={summary.trends ? {
            value: Math.abs(summary.trends.projects) * 8,
            isPositive: summary.trends.projects > 0
          } : undefined}
          className="border-l-4 border-l-purple-500"
        />
        
        <StatCard
          title="Current Streak"
          value={`${currentStreak} days`}
          description="Consecutive coding days"
          icon={<Flame className="h-4 w-4" />}
          className="border-l-4 border-l-orange-500"
        />
      </div>
      
      {/* Goals and Progress */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Weekly Goal Progress
            </CardTitle>
            <CardDescription>
              {formatTime(weeklyProgress)} of {formatTime(weeklyGoal)} weekly goal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Weekly Progress</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round((weeklyProgress / weeklyGoal) * 100)}%
                </span>
              </div>
              <Progress 
                value={(weeklyProgress / weeklyGoal) * 100} 
                className="h-3"
              />
            </div>
            
            <div className="grid grid-cols-7 gap-1 mt-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                // Mock daily data - should come from actual daily stats
                const dayProgress = Math.random() * dailyGoal;
                const percentage = (dayProgress / dailyGoal) * 100;
                
                return (
                  <div key={day} className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">{day}</div>
                    <div className="h-12 bg-muted rounded-sm relative overflow-hidden">
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-primary transition-all duration-300"
                        style={{ height: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs mt-1 font-medium">
                      {Math.round(dayProgress / 60)}h
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Most Active Project</span>
                <Badge variant="secondary" className="text-xs">
                  {summary.activeProject || userStats.mostActiveProject || 'None'}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Top Language</span>
                <Badge variant="outline" className="text-xs">
                  {userStats.mostUsedLanguage || 'N/A'}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Sessions</span>
                <span className="text-sm font-medium">{userStats.totalSessions}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Avg Session</span>
                <span className="text-sm font-medium">
                  {formatTime(userStats.averageSessionTime)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Time</span>
                <span className="text-sm font-medium">
                  {formatTime(userStats.totalCodingTime)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
