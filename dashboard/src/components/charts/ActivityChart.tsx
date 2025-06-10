import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartDataPoint } from '@/lib/types';
import { Area, AreaChart, Bar, BarChart, Line, LineChart, XAxis, YAxis } from 'recharts';

interface ActivityChartProps {
  data: ChartDataPoint[];
  type?: 'area' | 'bar' | 'line';
  title?: string;
  description?: string;
  className?: string;
}

const chartConfig = {
  value: {
    label: 'Activity',
    color: 'hsl(var(--primary))',
  },
} satisfies import('@/components/ui/chart').ChartConfig;

export function ActivityChart({ data, type = 'area', title = 'Activity', description, className }: ActivityChartProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const chartData = data.map(d => ({
    date: d.date,
    value: d.value,
    label: d.label || new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
  }));

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'line':
        return (
          <LineChart {...commonProps}>
            <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="var(--color-value)" 
              strokeWidth={3}
              dot={{ fill: 'var(--color-value)', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        );
      default:
        return (
          <AreaChart {...commonProps}>
            <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="var(--color-value)" 
              strokeWidth={2}
              fill="var(--color-value)" 
              fillOpacity={0.4}
            />
          </AreaChart>
        );
    }
  };

  const totalValue = data.reduce((sum, d) => sum + d.value, 0);
  const avgValue = data.length > 0 ? totalValue / data.length : 0;
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        <div className="flex gap-4 text-sm">
          <span>Total: {formatTime(totalValue)}</span>
          <span>Avg: {formatTime(avgValue)}</span>
          <span>Peak: {formatTime(maxValue)}</span>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          {renderChart()}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
