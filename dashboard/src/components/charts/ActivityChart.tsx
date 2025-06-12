import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { ChartDataPoint } from "@/lib/types"
import { Activity, BarChart3, TrendingUp, BarChart } from "lucide-react"
import { Area, AreaChart, Bar, ResponsiveContainer, XAxis, YAxis } from "recharts"

interface ActivityChartProps {
  data: ChartDataPoint[]
  type?: "area" | "bar" | "line"
  title?: string
  description?: string
  className?: string
}

const chartConfig = {
  value: {
    label: "Activity",
    color: "hsl(var(--primary))",
  },
} satisfies import("@/components/ui/chart").ChartConfig

export function ActivityChart({ data, type = "area", title = "Activity", description, className }: ActivityChartProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const chartData = data.map((d) => ({
    date: d.date,
    value: d.value,
    label: d.label || new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }),
  }))

  const getChartIcon = () => {
    switch (type) {
      case "bar":
        return <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
      case "line":
        return <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
      default:
        return <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
    }
  }

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: {
        top: 10,
        right: 10,
        left: 0,
        bottom: 0,
      },
    }

    const commonAxisProps = {
      tick: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
      axisLine: false,
      tickLine: false,
    }

    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart {...commonProps}>
              <XAxis dataKey="label" {...commonAxisProps} interval="preserveStartEnd" className="text-xs sm:text-sm" />
              <YAxis {...commonAxisProps} width={40} className="text-xs sm:text-sm" />
              <ChartTooltip cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }} content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        )
      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart {...commonProps}>
              <XAxis dataKey="label" {...commonAxisProps} interval="preserveStartEnd" className="text-xs sm:text-sm" />
              <YAxis {...commonAxisProps} width={40} className="text-xs sm:text-sm" />
              <ChartTooltip
                cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
                content={<ChartTooltipContent />}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2}
                fill="var(--color-value)"
                fillOpacity={0.2}
                className="drop-shadow-sm"
              />
            </AreaChart>
          </ResponsiveContainer>
        )
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart {...commonProps}>
              <XAxis dataKey="label" {...commonAxisProps} interval="preserveStartEnd" className="text-xs sm:text-sm" />
              <YAxis {...commonAxisProps} width={40} className="text-xs sm:text-sm" />
              <ChartTooltip
                cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
                content={<ChartTooltipContent />}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2}
                fill="var(--color-value)"
                fillOpacity={0.2}
                className="drop-shadow-sm"
              />
            </AreaChart>
          </ResponsiveContainer>
        )
    }
  }

  const totalValue = data.reduce((sum, d) => sum + d.value, 0)
  const avgValue = data.length > 0 ? totalValue / data.length : 0
  const maxValue = Math.max(...data.map((d) => d.value))

  return (
    <Card className={`${className} flex flex-col  border border-border`}>
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          {getChartIcon()}
          {title}
        </CardTitle>
        {description && <CardDescription className="text-sm sm:text-base">{description}</CardDescription>}

        {/* Stats Summary */}
        <div className="flex flex-wrap gap-3 sm:gap-4 pt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary/60" />
            <span className="text-xs sm:text-sm text-muted-foreground">
              Total: <span className="font-medium text-foreground">{formatTime(totalValue)}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary/40" />
            <span className="text-xs sm:text-sm text-muted-foreground">
              Avg: <span className="font-medium text-foreground">{formatTime(avgValue)}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-primary" />
            <span className="text-xs sm:text-sm text-muted-foreground">
              Peak: <span className="font-medium text-foreground">{formatTime(maxValue)}</span>
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4 sm:p-6 pt-0">
        {data.length > 0 ? (
          <div className="h-48 sm:h-56 md:h-64 lg:h-72">
            <ChartContainer config={chartConfig} className="h-full w-full">
              {renderChart()}
            </ChartContainer>
          </div>
        ) : (
          <div className="h-48 sm:h-56 md:h-64 lg:h-72 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Activity className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base font-medium mb-1">No activity data available</p>
              <p className="text-xs sm:text-sm opacity-75">Start tracking to see your activity patterns</p>
            </div>
          </div>
        )}

        {/* Additional insights for larger screens */}
        {data.length > 0 && (
          <div className="hidden sm:flex justify-between items-center mt-6 pt-4 border-t border-border/50">
            <div className="text-sm text-muted-foreground">
              Data Points: <span className="font-medium text-foreground">{data.length}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Chart Type: <span className="font-medium text-foreground capitalize">{type}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
