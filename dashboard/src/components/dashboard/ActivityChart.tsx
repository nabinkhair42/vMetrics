'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ActivityChartProps {
  data: Array<{
    time: string;
    minutes: number;
    sessions: number;
  }>;
  type: 'bar' | 'line';
}

export function ActivityChart({ data, type = 'bar' }: ActivityChartProps) {
  const formatTooltip = (value: any, name: string) => {
    if (name === 'minutes') {
      const hours = Math.floor(value / 60);
      const mins = value % 60;
      return [`${hours}h ${mins}m`, 'Coding Time'];
    }
    return [value, name];
  };

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Daily Activity</CardTitle>
        <CardDescription>Your coding activity over the past week</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          {type === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip formatter={formatTooltip} />
              <Bar dataKey="minutes" fill="#8884d8" />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip formatter={formatTooltip} />
              <Line type="monotone" dataKey="minutes" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ProjectChart({ data }: { data: Array<{ name: string; minutes: number; files: number }> }) {
  const chartData = data.map(project => ({
    name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
    minutes: project.minutes,
    files: project.files
  }));

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Top Projects</CardTitle>
        <CardDescription>Your most active projects this period</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip formatter={(value: any, name: string) => {
              if (name === 'minutes') {
                const hours = Math.floor(value / 60);
                const mins = value % 60;
                return [`${hours}h ${mins}m`, 'Time Spent'];
              }
              return [value, name];
            }} />
            <Bar dataKey="minutes" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function RecentActivity({ activities }: { 
  activities: Array<{
    timestamp: string;
    type: 'file_open' | 'file_save' | 'session_start' | 'session_end';
    file?: string;
    project?: string;
    duration?: number;
  }> 
}) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'file_open': return '📂';
      case 'file_save': return '💾';
      case 'session_start': return '🚀';
      case 'session_end': return '🏁';
      default: return '📝';
    }
  };

  const getActivityDescription = (activity: any) => {
    switch (activity.type) {
      case 'file_open':
        return `Opened ${activity.file ? activity.file.split('/').pop() : 'file'}${activity.project ? ` in ${activity.project}` : ''}`;
      case 'file_save':
        return `Saved ${activity.file ? activity.file.split('/').pop() : 'file'}${activity.project ? ` in ${activity.project}` : ''}`;
      case 'session_start':
        return `Started coding session${activity.project ? ` in ${activity.project}` : ''}`;
      case 'session_end':
        return `Ended coding session${activity.duration ? ` (${Math.round(activity.duration / 60000)}m)` : ''}`;
      default:
        return 'Activity recorded';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest coding activities</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent activity to display</p>
            <p className="text-sm">Start coding to see your activity here!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                <span className="text-lg">{getActivityIcon(activity.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{getActivityDescription(activity)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
