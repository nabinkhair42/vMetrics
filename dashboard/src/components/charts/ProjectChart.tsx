import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ProjectChartData } from '@/lib/types';
import { Code } from 'lucide-react';
import { Pie, PieChart } from 'recharts';

interface ProjectChartProps {
  data: ProjectChartData[];
  className?: string;
}

const chartConfig = {
  timeSpent: {
    label: 'Time Spent',
  },
} satisfies import('@/components/ui/chart').ChartConfig;

export function ProjectChart({ data, className }: ProjectChartProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const chartData = data.map((project, index) => ({
    name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
    timeSpent: project.timeSpent,
    percentage: project.percentage,
    fill: project.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
    fullName: project.name,
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          Top Projects
        </CardTitle>
        <CardDescription>Your most active projects this period</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64">
            <ChartContainer config={chartConfig}>
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Pie
                  data={chartData}
                  dataKey="timeSpent"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="fill"
                />
              </PieChart>
            </ChartContainer>
          </div>
          
          <div className="space-y-3">
            {chartData.map((project) => (
              <div key={project.name} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.fill }} />
                  <span className="text-sm font-medium" title={project.fullName}>
                    {project.name}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{formatTime(project.timeSpent)}</p>
                  <p className="text-xs text-muted-foreground">{project.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
            
            {chartData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No project data available</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
