"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  useSelectedTimeRange,
  useUIStore,
} from "@/store"
import { Calendar, CalendarDays, Clock, RefreshCw } from "lucide-react"

interface DashboardFiltersProps {
  onRefresh: () => void
  isLoading: boolean
}

export function DashboardFilters({ onRefresh, isLoading }: DashboardFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-end gap-2 p-4">
      <TimeRangeSelector />
      <Button
        variant="outline"
        onClick={onRefresh}
        disabled={isLoading}
        className="h-9 w-9 p-0"
      >
        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        <span className="sr-only">Refresh data</span>
      </Button>
    </div>
  )
}

function TimeRangeSelector() {
  const selectedTimeRange = useSelectedTimeRange()

  const timeRanges = [
    { value: "today", label: "Today", icon: Clock },
    { value: "week", label: "Week", icon: Calendar },
    { value: "month", label: "Month", icon: CalendarDays },
  ] as const

  return (
      <div className="flex items-center bg-muted rounded-lg border p-1 h-9">
        {timeRanges.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant="ghost"
            size="sm"
            onClick={() => useUIStore.getState().setSelectedTimeRange(value)}
            className={cn(
              "h-7 px-3 text-xs font-medium transition-all duration-200 rounded-md",
              selectedTimeRange === value
                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                : "text-muted-foreground",
            )}
          >
            <Icon className="h-3 w-3 mr-1.5" />
            {label}
          </Button>
        ))}
      </div>
  )
} 