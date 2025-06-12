"use client"

import type React from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useSummary, useUserStats } from "@/store"
import { Activity, Clock, Code, FileText, Flame, TrendingUp, TrendingDown } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

function StatCard({ title, value, description, icon, trend, className }: StatCardProps) {
  return (
    <Card className={`${className} relative overflow-hidden bg-card/50 border border-border`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
        <CardTitle className="text-sm sm:text-base font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-xl sm:text-2xl font-bold">{value}</div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">{description}</p>

        {/* Trend indicator */}
        {trend && (
          <div className="flex items-center pt-2">
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
            )}
            <span className={`text-xs sm:text-sm ml-1 ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
              {trend.isPositive ? "+" : ""}
              {trend.value}% from yesterday
            </span>
          </div>
        )}
      </CardContent>

      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 pointer-events-none" />
    </Card>
  )
}

export function EnhancedStatsOverview() {
  const summary = useSummary()
  const userStats = useUserStats()

  if (!summary || !userStats) {
    return (
      <div className="space-y-6">
        {/* Primary stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={`stat-${i}`} className="bg-card/50 border border-border">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick stats skeleton */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/50 border border-border">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={`quick-${i}`} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  // Calculate streak (mock for now - should come from backend)
  const currentStreak = userStats.totalSessions > 0 ? Math.min(userStats.totalSessions, 7) : 0

  return (
    <div className="space-y-6">
      {/* Primary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Today's Coding Time"
          value={formatTime(summary.todayMinutes)}
          description="Time spent coding today"
          icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5" />}
          trend={
            summary.trends
              ? {
                  value: summary.trends.time * 10, // Mock percentage
                  isPositive: summary.trends.time > 0,
                }
              : undefined
          }
          className="border-l-4 border-l-blue-500"
        />

        <StatCard
          title="Files Worked On"
          value={summary.todayFiles.toString()}
          description="Different files opened today"
          icon={<FileText className="h-4 w-4 sm:h-5 sm:w-5" />}
          trend={
            summary.trends
              ? {
                  value: summary.trends.files * 15,
                  isPositive: summary.trends.files > 0,
                }
              : undefined
          }
          className="border-l-4 border-l-green-500"
        />

        <StatCard
          title="Active Projects"
          value={summary.todayProjects.toString()}
          description="Projects worked on today"
          icon={<Code className="h-4 w-4 sm:h-5 sm:w-5" />}
          trend={
            summary.trends
              ? {
                  value: Math.abs(summary.trends.projects) * 8,
                  isPositive: summary.trends.projects > 0,
                }
              : undefined
          }
          className="border-l-4 border-l-purple-500"
        />

        <StatCard
          title="Current Streak"
          value={`${currentStreak} days`}
          description="Consecutive coding days"
          icon={<Flame className="h-4 w-4 sm:h-5 sm:w-5" />}
          className="border-l-4 border-l-orange-500"
        />
      </div>

      {/* Quick Stats and Session Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card/50 border border-border">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Most Active Project</span>
                <Badge variant="secondary" className="text-xs">
                  {summary.activeProject || userStats.mostActiveProject || "None"}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Top Language</span>
                <Badge variant="outline" className="text-xs">
                  {userStats.mostUsedLanguage || "N/A"}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Total Sessions</span>
                <span className="text-sm font-medium">{userStats.totalSessions}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Avg Session</span>
                <span className="text-sm font-medium">{formatTime(userStats.averageSessionTime)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Total Time</span>
                <span className="text-sm font-medium">{formatTime(userStats.totalCodingTime)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border border-border">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              Session Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Current File</span>
                <span className="text-sm font-medium truncate max-w-32">
                  {userStats.currentFile ? userStats.currentFile.split('/').pop() : "None"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Active Project</span>
                <span className="text-sm font-medium">
                  {userStats.currentProject || "None"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Status</span>
                <Badge variant={userStats.isCurrentlyActive ? "default" : "secondary"} className="text-xs">
                  {userStats.isCurrentlyActive ? "Active" : "Idle"}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Longest Session</span>
                <span className="text-sm font-medium">{formatTime(summary.longestSession)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Active Projects</span>
                <span className="text-sm font-medium">{userStats.activeProjects.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
