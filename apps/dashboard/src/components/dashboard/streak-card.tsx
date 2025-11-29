'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Flame, Trophy, Target } from 'lucide-react';
import { cn, calculatePercentage, formatDuration } from '@/lib/utils';
import type { Goal } from '@/lib/api';

interface StreakCardProps {
  streak: {
    current: number;
    longest: number;
  };
  goals: Goal[];
  todayMinutes: number;
}

export function StreakCard({ streak, goals, todayMinutes }: StreakCardProps) {
  const dailyGoal = goals.find((g) => g.type === 'daily_minutes');
  const goalProgress = dailyGoal
    ? calculatePercentage(todayMinutes, dailyGoal.target)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Goals & Streaks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Streak display */}
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-full',
              streak.current > 0 ? 'bg-orange-500/10' : 'bg-muted'
            )}
          >
            <Flame
              className={cn(
                'h-8 w-8',
                streak.current > 0
                  ? 'text-orange-500'
                  : 'text-muted-foreground'
              )}
            />
          </div>
          <div>
            <p className="text-3xl font-bold">{streak.current}</p>
            <p className="text-sm text-muted-foreground">day streak</p>
          </div>
          <div className="ml-auto text-right">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Trophy className="h-4 w-4" />
              <span className="text-sm">{streak.longest}</span>
            </div>
            <p className="text-xs text-muted-foreground">longest</p>
          </div>
        </div>

        {/* Daily goal */}
        {dailyGoal && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Daily Goal</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatDuration(todayMinutes)} / {formatDuration(dailyGoal.target)}
              </span>
            </div>
            <Progress value={goalProgress} className="h-3" />
            <p className="text-xs text-muted-foreground text-right">
              {goalProgress >= 100
                ? 'Goal achieved!'
                : `${100 - goalProgress}% to go`}
            </p>
          </div>
        )}

        {/* Motivational message */}
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground">
            {streak.current === 0
              ? 'Start coding to begin your streak!'
              : streak.current === 1
              ? 'Great start! Keep it going tomorrow.'
              : streak.current < 7
              ? `${7 - streak.current} more days to reach a week streak!`
              : streak.current < 30
              ? `Amazing! ${30 - streak.current} days to reach a month streak!`
              : "You're on fire! Keep up the incredible work!"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
