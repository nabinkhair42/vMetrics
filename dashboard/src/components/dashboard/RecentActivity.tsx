"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, FileText, Save, Play, Square, Clock, FolderOpen } from "lucide-react"
import { useRecentActivity } from "@/store"


interface RecentActivity {
  timestamp: number | string
  type: "file_open" | "file_save" | "session_start" | "session_end" | "file_close" | "file_edit" | "text_change" | "focus" | "blur" | "idle_start" | "idle_end" | "workspace_change"
  file?: string
  project?: string
  duration?: number
}

interface RecentActivityProps {
  className?: string
}

export function RecentActivity({ className }: RecentActivityProps) {
  const activities = useRecentActivity()

  const formatTime = (timestamp: string | number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "file_open":
        return <FolderOpen className="h-4 w-4 text-blue-500" />
      case "file_save":
        return <Save className="h-4 w-4 text-green-500" />
      case "session_start":
        return <Play className="h-4 w-4 text-emerald-500" />
      case "session_end":
        return <Square className="h-4 w-4 text-red-500" />
      case "file_close":
        return <FileText className="h-4 w-4 text-gray-500" />
      case "file_edit":
      case "text_change":
        return <FileText className="h-4 w-4 text-yellow-500" />
      case "focus":
        return <Activity className="h-4 w-4 text-green-400" />
      case "blur":
        return <Clock className="h-4 w-4 text-gray-400" />
      case "idle_start":
      case "idle_end":
        return <Clock className="h-4 w-4 text-orange-500" />
      case "workspace_change":
        return <FolderOpen className="h-4 w-4 text-purple-500" />
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getActivityText = (activity: RecentActivity) => {
    switch (activity.type) {
      case "file_open":
        return `Opened ${activity.file || 'a file'}`
      case "file_save":
        return `Saved ${activity.file || 'a file'}`
      case "file_close":
        return `Closed ${activity.file || 'a file'}`
      case "file_edit":
      case "text_change":
        return `Edited ${activity.file || 'a file'}`
      case "session_start":
        return `Started coding session`
      case "session_end":
        return `Ended coding session`
      case "focus":
        return `Focused on editor`
      case "blur":
        return `Left editor`
      case "idle_start":
        return `Went idle`
      case "idle_end":
        return `Resumed activity`
      case "workspace_change":
        return `Changed workspace`
      default:
        return "Unknown activity"
    }
  }

  const getActivityBadge = (activity: RecentActivity) => {
    if (activity.type === "session_end" && activity.duration) {
      const hours = Math.floor(activity.duration / 60)
      const mins = activity.duration % 60
      const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
      return (
        <Badge variant="outline" className="text-xs">
          {timeStr}
        </Badge>
      )
    }
    return null
  }

  const recentSessions = activities.filter((a) => a.type === "session_end").length
  const recentFiles = activities.filter((a) => a.type === "file_save").length

  console.log("Recent activities:", activities)
  return (
    <Card className={`${className} flex flex-col border border-border`}>
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">Your latest coding activities and sessions</CardDescription>

        {/* Summary Stats */}
        {activities.length > 0 && (
          <div className="flex flex-wrap gap-3 sm:gap-4 pt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary/60" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                Activities: <span className="font-medium text-foreground">{activities.length}</span>
              </span>
            </div>
            {recentSessions > 0 && (
              <div className="flex items-center gap-1.5">
                <Play className="h-3 w-3 text-emerald-500" />
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Sessions: <span className="font-medium text-foreground">{recentSessions}</span>
                </span>
              </div>
            )}
            {recentFiles > 0 && (
              <div className="flex items-center gap-1.5">
                <Save className="h-3 w-3 text-green-500" />
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Files: <span className="font-medium text-foreground">{recentFiles}</span>
                </span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-4 sm:p-6 pt-0">
        {activities.length > 0 ? (
          <div className="space-y-3 sm:space-y-4 max-h-64 sm:max-h-80 overflow-y-auto">
            {activities.map((activity, index) => (
              <div
                key={`activity-${activity.timestamp}-${activity.type}-${index}`}
                className="flex items-start gap-3 p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm sm:text-base font-medium truncate">{getActivityText(activity)}</p>
                    {getActivityBadge(activity)}
                  </div>
                  {activity.project && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">in {activity.project}</p>
                  )}
                </div>
                <div className="flex-shrink-0 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs sm:text-sm text-muted-foreground">{formatTime(activity.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 text-muted-foreground">
            <Activity className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
            <p className="text-sm sm:text-base font-medium mb-1">No recent activity</p>
            <p className="text-xs sm:text-sm opacity-75">Start coding to see your activity here</p>
          </div>
        )}

        {/* Additional insights for larger screens */}
        {activities.length > 0 && (
          <div className="hidden sm:flex justify-between items-center mt-6 pt-4 border-t border-border/50">
            <div className="text-sm text-muted-foreground">
              Last Activity: <span className="font-medium text-foreground">{formatTime(activities[0]?.timestamp)}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Total Events: <span className="font-medium text-foreground">{activities.length}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
