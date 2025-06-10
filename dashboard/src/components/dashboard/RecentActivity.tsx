'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRecentActivity } from '@/store';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Clock,
  Code,
  FileText,
  Folder,
  Play,
  Save,
  Square
} from 'lucide-react';

interface ActivityItem {
  id?: string;
  timestamp: string;
  type: 'file_open' | 'file_save' | 'file_close' | 'session_start' | 'session_end' | 'text_change';
  file?: string;
  project?: string;
  language?: string;
  duration?: number;
  linesChanged?: number;
  charactersTyped?: number;
}

interface RecentActivityProps {
  activities?: ActivityItem[];
  showLiveIndicator?: boolean;
}

export function RecentActivity({ activities, showLiveIndicator = true }: RecentActivityProps) {
  const recentActivity = useRecentActivity();
  const data = activities || recentActivity || [];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'file_open': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'file_save': return <Save className="h-4 w-4 text-green-500" />;
      case 'file_close': return <FileText className="h-4 w-4 text-gray-500" />;
      case 'session_start': return <Play className="h-4 w-4 text-green-600" />;
      case 'session_end': return <Square className="h-4 w-4 text-red-500" />;
      case 'text_change': return <Code className="h-4 w-4 text-purple-500" />;
      default: return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getActivityText = (activity: ActivityItem): { primary: string; secondary?: string } => {
    const fileName = activity.file ? activity.file.split('/').pop() || activity.file : '';
    
    switch (activity.type) {
      case 'file_open':
        return {
          primary: `Opened ${fileName}`,
          secondary: activity.project ? `in ${activity.project}` : undefined
        };
      case 'file_save':
        return {
          primary: `Saved ${fileName}`,
          secondary: activity.language ? `${activity.language} file` : undefined
        };
      case 'file_close':
        return {
          primary: `Closed ${fileName}`,
          secondary: activity.duration ? `after ${Math.round(activity.duration / 60000)}m` : undefined
        };
      case 'session_start':
        return {
          primary: 'Started coding session',
          secondary: activity.project ? `in ${activity.project}` : undefined
        };
      case 'session_end':
        return {
          primary: 'Ended coding session',
          secondary: activity.duration ? `lasted ${Math.round(activity.duration / 60000)}m` : undefined
        };
      case 'text_change':
        return {
          primary: `Edited ${fileName}`,
          secondary: activity.linesChanged ? `${activity.linesChanged} lines changed` : undefined
        };
      default:
        return { primary: 'Unknown activity' };
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'file_open': return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800';
      case 'file_save': return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800';
      case 'session_start': return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800';
      case 'session_end': return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800';
      case 'text_change': return 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800';
      default: return 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
              {showLiveIndicator && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-600 font-normal">Live</span>
                </div>
              )}
            </CardTitle>
            <CardDescription>Real-time coding activity feed</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {data.length} events
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-6">
          <AnimatePresence mode="popLayout">
            {data.length > 0 ? (
              <div className="space-y-3 pb-4">
                {data.map((activity, index) => {
                  const activityText = getActivityText(activity);
                  const activityColor = getActivityColor(activity.type);
                  
                  return (
                    <motion.div
                      key={activity.id || `${activity.timestamp}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors hover:shadow-sm ${activityColor}`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">
                            {activityText.primary}
                          </p>
                          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        
                        {activityText.secondary && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {activityText.secondary}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          {activity.project && (
                            <Badge variant="outline" className="text-xs">
                              <Folder className="h-3 w-3 mr-1" />
                              {activity.project}
                            </Badge>
                          )}
                          {activity.language && (
                            <Badge variant="secondary" className="text-xs">
                              <Code className="h-3 w-3 mr-1" />
                              {activity.language}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No Recent Activity
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Start coding to see your activity feed here. Your file operations, saves, and sessions will appear in real-time.
                </p>
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export function LiveActivityIndicator() {
  return (
    <motion.div
      className="fixed bottom-4 right-4 z-50"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="shadow-lg border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Tracking activity
            </span>
            <Clock className="h-4 w-4 text-green-600" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
