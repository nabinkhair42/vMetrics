import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import type { ChartDataPoint } from "@/lib/types"
import { getActivityColor, getProjectColor } from "@/lib/utils"
import { getLanguageIcon } from "@/lib/language-icons"
import { Activity } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, Cell, Line, LineChart, ResponsiveContainer, Tooltip, TooltipProps, XAxis, YAxis } from "recharts"

interface ActivityChartProps {
  data: ChartDataPoint[]
  type?: "area" | "bar" | "line"
  title?: string
  description?: string
  className?: string
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean
  payload?: Array<{
    value: number
    payload: ChartDataPoint
  }>
}

const chartConfig = {
  value: {
    label: "Time",
  },
} satisfies import("@/components/ui/chart").ChartConfig

const commonAxisProps = {
  stroke: "hsl(var(--muted-foreground))",
  strokeWidth: 1,
  fontSize: 12,
  tickLine: false,
  axisLine: true,
}

export function ActivityChart({ data, type = "area", title = "Activity", description, className }: ActivityChartProps) {
  const commonProps = {
    data,
    margin: { top: 5, right: 5, left: 5, bottom: 5 },
  }

  const formatTime = (value: number) => {
    const hours = Math.floor(value / 60)
    const minutes = value % 60
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const getBarColor = (entry: ChartDataPoint, index: number) => {
    if (entry) {
      // First use the color if it was passed in the data
      if (entry.color) {
        return entry.color
      }
      // Then check if it's a language
      if (entry.label) {
        const languageInfo = getLanguageIcon(entry.label)
        if (languageInfo) {
          return languageInfo.color
        }
        // If not a language, use project color
        return getProjectColor(index)
      }
    }
    // Default activity color for time series data
    return getActivityColor(2)
  }

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (!active || !payload?.length) return null

    const data = payload[0]
    if (!data) return null

    const formatTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60)
      const mins = Math.round(minutes % 60)
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    }

    return (
      <div className="rounded-lg border bg-background p-2 shadow-md">
        <p className="text-sm font-medium">
          {data.payload.label || "Activity"}: {formatTime(data.value)}
        </p>
      </div>
    )
  }

  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart {...commonProps}>
              <XAxis dataKey="label" {...commonAxisProps} interval="preserveStartEnd" className="text-xs sm:text-sm" />
              <YAxis {...commonAxisProps} width={40} className="text-xs sm:text-sm" tickFormatter={formatTime} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }} />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                className="drop-shadow-sm"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry, index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )
      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart {...commonProps}>
              <XAxis dataKey="label" {...commonAxisProps} interval="preserveStartEnd" className="text-xs sm:text-sm" />
              <YAxis {...commonAxisProps} width={40} className="text-xs sm:text-sm" tickFormatter={formatTime} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={getActivityColor(1)}
                strokeWidth={3}
                dot={false}
                className="drop-shadow-sm"
              />
            </LineChart>
          </ResponsiveContainer>
        )
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart {...commonProps}>
              <XAxis dataKey="label" {...commonAxisProps} interval="preserveStartEnd" className="text-xs sm:text-sm" />
              <YAxis {...commonAxisProps} width={40} className="text-xs sm:text-sm" tickFormatter={formatTime} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={getActivityColor(2)}
                fill={getActivityColor(2)}
                strokeWidth={3}
                fillOpacity={0.2}
                className="drop-shadow-sm"
              />
            </AreaChart>
          </ResponsiveContainer>
        )
    }
  }

  // const totalValue = data.reduce((sum, d) => sum + d.value, 0)
  // const avgValue = data.length > 0 ? totalValue / data.length : 0
  // const maxValue = Math.max(...data.map((d) => d.value))

  return (
    <Card className={`${className} flex flex-col border border-border/50 bg-card/50 backdrop-blur-sm`}>
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-semibold">
          <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-sm sm:text-base text-muted-foreground">{description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-4 sm:p-6 pt-0">
        <div className="h-[200px] sm:h-[300px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            {renderChart()}
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
