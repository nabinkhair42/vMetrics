'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Language {
  name: string;
  minutes: number;
  percentage: number;
  color: string;
}

interface LanguageStatsProps {
  languages: Language[];
}

export function LanguageStats({ languages }: LanguageStatsProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Programming Languages</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {languages.map((language, index) => (
          <div key={language.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: language.color }}
                />
                <span className="font-medium">{language.name}</span>
              </div>
              <div className="text-right space-x-2">
                <span className="text-sm text-muted-foreground">
                  {formatTime(language.minutes)}
                </span>
                <Badge variant="secondary">
                  {language.percentage.toFixed(1)}%
                </Badge>
              </div>
            </div>
            <Progress value={language.percentage} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface RecentActivity {
  timestamp: string;
  type: 'file_open' | 'file_save' | 'session_start' | 'session_end';
  file?: string;
  project?: string;
  duration?: number;
}

interface RecentActivityProps {
  activities: RecentActivity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'file_open': return '📂';
      case 'file_save': return '💾';
      case 'session_start': return '▶️';
      case 'session_end': return '⏹️';
      default: return '📝';
    }
  };

  const getActivityText = (activity: RecentActivity) => {
    switch (activity.type) {
      case 'file_open':
        return `Opened ${activity.file}`;
      case 'file_save':
        return `Saved ${activity.file}`;
      case 'session_start':
        return `Started coding session in ${activity.project}`;
      case 'session_end':
        return `Ended coding session (${Math.floor((activity.duration || 0) / 60)}m)`;
      default:
        return 'Unknown activity';
    }
  };

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center space-x-3">
              <span className="text-lg">{getActivityIcon(activity.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {getActivityText(activity)}
                </p>
                {activity.project && (
                  <p className="text-xs text-muted-foreground">
                    in {activity.project}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatTime(activity.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
