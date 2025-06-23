import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ProjectChartData } from "@/lib/types"
import { getProjectColor } from "@/lib/utils"
import { Code } from "lucide-react"
import { Pie, PieChart, ResponsiveContainer, Tooltip, TooltipProps } from "recharts"

interface ProjectChartProps {
  data: ProjectChartData[]
  className?: string
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean
  payload?: Array<{
    value: number
    payload: ProjectChartData
  }>
}

const chartConfig = {
  timeSpent: {
    label: "Time",
  },
} satisfies import("@/components/ui/chart").ChartConfig

export function ProjectChart({ data, className }: ProjectChartProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (!active || !payload?.length) return null

    const data = payload[0]
    if (!data) return null

    return (
      <div className="rounded-lg border bg-background p-2 shadow-md">
        <p className="text-sm font-medium">
          {data.payload.name}: {formatTime(data.payload.timeSpent)}
        </p>
      </div>
    )
  }

  const chartData = data.map((project, index) => ({
    ...project,
    fill: getProjectColor(index),
  }))

  return (
    <Card className={`${className} flex flex-col border border-border/50 bg-card/50 backdrop-blur-sm`}>
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-semibold">
          <Code className="h-4 w-4 sm:h-5 sm:w-5" />
          Top Projects
        </CardTitle>
        <CardDescription className="text-sm sm:text-base text-muted-foreground">
          Your most active projects this period
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 p-4 sm:p-6 pt-0">
        {/* Chart Section */}
        <div className="mb-6 sm:mb-8">
          <div className="h-48 sm:h-56 md:h-64 lg:h-72">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={chartData}
                    dataKey="timeSpent"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    innerRadius="60%"
                    fill="fill"
                    strokeWidth={2}
                    stroke="hsl(var(--border))"
                    className="drop-shadow-sm"
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>

        {/* Project List Section */}
        <ScrollArea className="h-[200px] sm:h-[240px] rounded-md border border-border/50 bg-background/50">
          <div className="p-4">
            {data.map((project, index) => (
              <div
                key={project.name}
                className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 hover:bg-muted/50 -mx-3 transition-colors group border-b "
              >
                <div className="flex items-center gap-3 min-w-0 ">
                  <div 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: getProjectColor(index) }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {((project.timeSpent / data.reduce((acc, curr) => acc + curr.timeSpent, 0)) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div 
                    className="h-1.5 w-16 rounded-full hidden sm:block"
                    style={{ 
                      background: `${getProjectColor(index)}33`,
                      boxShadow: `inset 0 0 0 1px ${getProjectColor(index)}1A`,
                    }}
                  >
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${(project.timeSpent / data.reduce((acc, curr) => acc + curr.timeSpent, 0)) * 100}%`,
                        backgroundColor: getProjectColor(index),
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatTime(project.timeSpent)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}