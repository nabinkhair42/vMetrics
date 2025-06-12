import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { ProjectChartData } from "@/lib/types"
import { Code } from "lucide-react"
import { Pie, PieChart, ResponsiveContainer } from "recharts"

interface ProjectChartProps {
  data: ProjectChartData[]
  className?: string
}

const chartConfig = {
  timeSpent: {
    label: "Time Spent",
  },
} satisfies import("@/components/ui/chart").ChartConfig

export function ProjectChart({ data, className }: ProjectChartProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const chartData = data.map((project, index) => ({
    name: project.name.length > 15 ? project.name.substring(0, 15) + "..." : project.name,
    timeSpent: project.timeSpent,
    percentage: project.percentage,
    fill: project.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
    fullName: project.name,
  }))

  return (
    <Card className={`${className} flex flex-col border border-border`}>
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Code className="h-4 w-4 sm:h-5 sm:w-5" />
          Top Projects
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">Your most active projects this period</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 p-4 sm:p-6 pt-0">
        {/* Chart Section */}
        <div className="mb-6 sm:mb-8">
          <div className="h-48 sm:h-56 md:h-64 lg:h-72">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Pie
                    data={chartData}
                    dataKey="timeSpent"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    innerRadius="0%"
                    fill="fill"
                    strokeWidth={2}
                    stroke="hsl(var(--border))"
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>

        {/* Project List Section */}
        <div className="space-y-2 sm:space-y-3">
          {chartData.length > 0 ? (
            <div className="grid gap-2 sm:gap-3">
              {chartData.map((project) => (
                <div
                  key={project.name}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-lg border transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div
                      className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.fill }}
                    />
                    <span className="text-sm sm:text-base font-medium truncate" title={project.fullName}>
                      {project.name}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-semibold text-sm sm:text-base">{formatTime(project.timeSpent)}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{project.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 text-muted-foreground">
              <Code className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base font-medium mb-1">No project data available</p>
              <p className="text-xs sm:text-sm opacity-75">Start tracking your projects to see insights here</p>
            </div>
          )}
        </div>

        {/* Summary Stats for larger screens */}
        {chartData.length > 0 && (
          <div className="hidden sm:flex justify-between items-center mt-6 pt-4 border-t border-border/50">
            <div className="text-sm text-muted-foreground">
              Total Projects: <span className="font-medium text-foreground">{chartData.length}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Total Time:{" "}
              <span className="font-medium text-foreground">
                {formatTime(chartData.reduce((sum, project) => sum + project.timeSpent, 0))}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
