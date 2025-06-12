"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { eachDayOfInterval, endOfWeek, format, isSameDay, isToday, startOfWeek, subWeeks } from "date-fns"
import { Calendar } from "lucide-react"

interface ActivityData {
  date: string
  minutes: number
  sessions: number
}

interface ActivityHeatmapProps {
  data: ActivityData[]
  weeks?: number
  className?: string
}

export function ActivityHeatmap({ data, weeks = 12, className }: ActivityHeatmapProps) {
  const today = new Date()
  const startDate = startOfWeek(subWeeks(today, weeks - 1))
  const endDate = endOfWeek(today)

  const allDays = eachDayOfInterval({ start: startDate, end: endDate })

  // Create weeks array
  const weekData: Date[][] = []
  for (let i = 0; i < allDays.length; i += 7) {
    weekData.push(allDays.slice(i, i + 7))
  }

  const getIntensity = (date: Date): number => {
    const dayData = data.find((d) => isSameDay(new Date(d.date), date))
    if (!dayData) return 0

    // Normalize intensity (0-4 based on minutes)
    if (dayData.minutes === 0) return 0
    if (dayData.minutes <= 30) return 1
    if (dayData.minutes <= 60) return 2
    if (dayData.minutes <= 180) return 3
    return 4
  }

  const getIntensityColor = (intensity: number): string => {
    const colors = [
      "bg-gray-100 dark:bg-gray-800", // No activity
      "bg-green-200 dark:bg-green-900", // Low activity
      "bg-green-300 dark:bg-green-700", // Medium-low activity
      "bg-green-500 dark:bg-green-600", // Medium-high activity
      "bg-green-700 dark:bg-green-500", // High activity
    ]
    return colors[intensity] || colors[0]
  }

  const getDayData = (date: Date) => {
    return data.find((d) => isSameDay(new Date(d.date), date))
  }

  const formatTooltip = (date: Date) => {
    const dayData = getDayData(date)
    const dateStr = format(date, "MMM d, yyyy")

    if (!dayData || dayData.minutes === 0) {
      return `${dateStr}: No activity`
    }

    const hours = Math.floor(dayData.minutes / 60)
    const minutes = dayData.minutes % 60
    const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

    return `${dateStr}: ${timeStr} coding time (${dayData.sessions} sessions)`
  }

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Get visible months in the date range
  const visibleMonths: { month: string; position: number }[] = []
  let currentMonth = -1
  allDays.forEach((date, index) => {
    const month = date.getMonth()
    if (month !== currentMonth) {
      currentMonth = month
      visibleMonths.push({
        month: format(date, "MMM"),
        position: Math.floor(index / 7),
      })
    }
  })

  // Calculate total stats
  const totalMinutes = data.reduce((sum, day) => sum + day.minutes, 0)
  const totalSessions = data.reduce((sum, day) => sum + day.sessions, 0)
  const activeDays = data.filter((day) => day.minutes > 0).length

  // Format total time
  const formatTotalTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <Card className={`${className} flex flex-col bg-card/50 border border-border`}>
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
          Activity Heatmap
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Your coding activity over the past {weeks} weeks
        </CardDescription>

        {/* Summary Stats */}
        {data.length > 0 && (
          <div className="flex flex-wrap gap-3 sm:gap-4 pt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                Total: <span className="font-medium text-foreground">{formatTotalTime(totalMinutes)}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-300" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                Sessions: <span className="font-medium text-foreground">{totalSessions}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-green-600" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                Active Days: <span className="font-medium text-foreground">{activeDays}</span>
              </span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-4 sm:p-6 pt-0">
        <TooltipProvider>
          <div className="space-y-2 sm:space-y-4">
            {/* Month labels */}
            <div className="flex text-xs text-muted-foreground pl-8 relative h-5">
              {visibleMonths.map(({ month, position }) => (
                <div
                  key={`${month}-${position}`}
                  className="absolute text-xs font-medium"
                  style={{ left: `${position * 16 + 8}px` }}
                >
                  {month}
                </div>
              ))}
            </div>

            <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-2">
              {/* Weekday labels */}
              <div className="flex flex-col gap-1 text-xs text-muted-foreground justify-between pr-2">
                {weekdays.map((day, index) => (
                  <div key={day} className="h-3 sm:h-4 flex items-center">
                    {index % 2 === 1 && <span className="text-[10px] sm:text-xs">{day}</span>}
                  </div>
                ))}
              </div>

              {/* Heatmap grid */}
              <div className="flex gap-1">
                {weekData.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {week.map((date) => {
                      const intensity = getIntensity(date)

                      return (
                        <Tooltip key={date.toISOString()}>
                          <TooltipTrigger asChild>
                            <div
                              className={`
                                w-3 h-3 sm:w-4 sm:h-4 rounded-sm border border-gray-200 dark:border-gray-700 cursor-pointer
                                hover:ring-2 hover:ring-blue-500 hover:ring-opacity-50 transition-all
                                ${getIntensityColor(intensity)}
                                ${isToday(date) ? "ring-2 ring-blue-500" : ""}
                              `}
                              aria-label={formatTooltip(date)}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs sm:text-sm">
                            <p>{formatTooltip(date)}</p>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
              <span>Less</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((intensity) => (
                  <div
                    key={intensity}
                    className={`w-3 h-3 sm:w-4 sm:h-4 rounded-sm border border-gray-200 dark:border-gray-700 ${getIntensityColor(
                      intensity,
                    )}`}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
