'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Achievement } from '@/lib/api';
import {
  Trophy,
  Clock,
  Flame,
  Code2,
  Moon,
  Sun,
  Timer,
  Target,
  Award,
} from 'lucide-react';

const ACHIEVEMENT_CONFIG: Record<
  string,
  { icon: typeof Trophy; label: string; description: string }
> = {
  first_session: {
    icon: Award,
    label: 'First Steps',
    description: 'Complete your first session',
  },
  first_hour: {
    icon: Clock,
    label: 'Hour One',
    description: 'Code for 1 hour total',
  },
  first_day_100: {
    icon: Target,
    label: 'Century',
    description: '100 minutes in a day',
  },
  week_streak_7: {
    icon: Flame,
    label: 'Week Warrior',
    description: '7-day coding streak',
  },
  week_streak_30: {
    icon: Trophy,
    label: 'Monthly Master',
    description: '30-day coding streak',
  },
  total_hours_100: {
    icon: Clock,
    label: 'Centurion',
    description: '100 hours total',
  },
  total_hours_500: {
    icon: Clock,
    label: 'Veteran',
    description: '500 hours total',
  },
  total_hours_1000: {
    icon: Trophy,
    label: 'Legendary',
    description: '1000 hours total',
  },
  polyglot_5: {
    icon: Code2,
    label: 'Polyglot',
    description: 'Use 5 languages',
  },
  polyglot_10: {
    icon: Code2,
    label: 'Language Master',
    description: 'Use 10 languages',
  },
  night_owl: {
    icon: Moon,
    label: 'Night Owl',
    description: 'Code after midnight',
  },
  early_bird: {
    icon: Sun,
    label: 'Early Bird',
    description: 'Code before 6 AM',
  },
  marathon_session: {
    icon: Timer,
    label: 'Marathon',
    description: '4+ hour session',
  },
  focus_master: {
    icon: Target,
    label: 'Focus Master',
    description: '2+ hours on one project',
  },
};

interface AchievementsCardProps {
  achievements: Achievement[];
}

export function AchievementsCard({ achievements }: AchievementsCardProps) {
  const sortedAchievements = [...achievements].sort(
    (a, b) => new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime()
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium">Achievements</CardTitle>
        <Badge variant="secondary">{achievements.length}</Badge>
      </CardHeader>
      <CardContent>
        {sortedAchievements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              No achievements yet. Keep coding!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {sortedAchievements.slice(0, 6).map((achievement) => {
              const config = ACHIEVEMENT_CONFIG[achievement.type];
              const Icon = config?.icon || Trophy;

              return (
                <div
                  key={achievement.id}
                  className="flex flex-col items-center rounded-lg bg-muted/50 p-3 text-center"
                >
                  <div className="rounded-full bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="mt-2 text-xs font-medium">
                    {config?.label || achievement.type}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {sortedAchievements.length > 6 && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            +{sortedAchievements.length - 6} more achievements
          </p>
        )}
      </CardContent>
    </Card>
  );
}
