'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { eachDayOfInterval, endOfWeek, format, isSameDay, isToday, startOfWeek, subWeeks } from 'date-fns';

interface ActivityData {
  date: string;
  minutes: number;
  sessions: number;
}

interface ActivityHeatmapProps {
  data: ActivityData[];
  weeks?: number;
}

export function ActivityHeatmap({ data, weeks = 12 }: ActivityHeatmapProps) {
  const today = new Date();
  const startDate = startOfWeek(subWeeks(today, weeks - 1));
  const endDate = endOfWeek(today);
  
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Create weeks array
  const weekData: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weekData.push(allDays.slice(i, i + 7));
  }
  
  const getIntensity = (date: Date): number => {
    const dayData = data.find(d => isSameDay(new Date(d.date), date));
    if (!dayData) return 0;
    
    // Normalize intensity (0-4 based on minutes)
    if (dayData.minutes === 0) return 0;
    if (dayData.minutes <= 30) return 1;
    if (dayData.minutes <= 60) return 2;
    if (dayData.minutes <= 180) return 3;
    return 4;
  };
  
  const getIntensityColor = (intensity: number): string => {
    const colors = [
      'bg-gray-100 dark:bg-gray-800', // No activity
      'bg-green-200 dark:bg-green-900', // Low activity
      'bg-green-300 dark:bg-green-700', // Medium-low activity
      'bg-green-500 dark:bg-green-600', // Medium-high activity
      'bg-green-700 dark:bg-green-500', // High activity
    ];
    return colors[intensity] || colors[0];
  };
  
  const getDayData = (date: Date) => {
    return data.find(d => isSameDay(new Date(d.date), date));
  };
  
  const formatTooltip = (date: Date) => {
    const dayData = getDayData(date);
    const dateStr = format(date, 'MMM d, yyyy');
    
    if (!dayData || dayData.minutes === 0) {
      return `${dateStr}: No activity`;
    }
    
    const hours = Math.floor(dayData.minutes / 60);
    const minutes = dayData.minutes % 60;
    const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    
    return `${dateStr}: ${timeStr} coding time (${dayData.sessions} sessions)`;
  };
  
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📅 Activity Heatmap
        </CardTitle>
        <CardDescription>
          Your coding activity over the past {weeks} weeks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="space-y-2">
            {/* Month labels */}
            <div className="flex justify-between text-xs text-muted-foreground pl-8">
              {months.map((month, index) => (
                <span key={month}>{month}</span>
              ))}
            </div>
            
            <div className="flex gap-1">
              {/* Weekday labels */}
              <div className="flex flex-col gap-1 text-xs text-muted-foreground justify-between pr-2">
                {weekdays.map((day, index) => (
                  <div key={day} className="h-3 flex items-center">
                    {index % 2 === 1 && <span>{day}</span>}
                  </div>
                ))}
              </div>
              
              {/* Heatmap grid */}
              <div className="flex gap-1">
                {weekData.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {week.map((date, dayIndex) => {
                      const intensity = getIntensity(date);
                      const dayData = getDayData(date);
                      
                      return (
                        <Tooltip key={date.toISOString()}>
                          <TooltipTrigger asChild>
                            <div
                              className={`
                                w-3 h-3 rounded-sm border border-gray-200 dark:border-gray-700 cursor-pointer
                                hover:ring-2 hover:ring-blue-500 hover:ring-opacity-50 transition-all
                                ${getIntensityColor(intensity)}
                                ${isToday(date) ? 'ring-2 ring-blue-500' : ''}
                              `}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{formatTooltip(date)}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
              <span>Less</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((intensity) => (
                  <div
                    key={intensity}
                    className={`w-3 h-3 rounded-sm border border-gray-200 dark:border-gray-700 ${getIntensityColor(intensity)}`}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
