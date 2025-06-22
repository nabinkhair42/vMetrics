"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { LanguageIcon } from "@/lib/language-icons"
import { useSummary, useUserStats } from "@/store"
import {
  Activity,
  Code,
  FileText,
  Target,
  Timer,
  TrendingDown,
  TrendingUp
} from "lucide-react"
import type React from "react"

interface StatCardProps {
  title: string
  value: string | number
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
    <Card className={`${className} border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-200 hover:shadow-sm`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground group-hover:text-foreground transition-colors">
          {icon}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold tracking-tight">
            {value}
          </div>
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
          
          {trend && (
            <div className="flex items-center text-xs text-muted-foreground pt-1">
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={trend.isPositive ? "text-green-600" : "text-red-600"}>
                {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}% from yesterday
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={`stat-${i}`} className="border border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={`section-${i}`} className="border border-border/50 bg-card/50">
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(4)].map((_, j) => (
                <div key={`item-${j}`} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function EnhancedStatsOverview() {
  const summary = useSummary()
  const userStats = useUserStats()

  if (!summary || !userStats) {
    return <StatsSkeleton />
  }

  const formatTime = (minutes: number) => {
    if (minutes < 1) return '0m'
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getProductivityScore = () => {
    const todayMinutes = summary.todayMinutes || 0
    if (todayMinutes === 0) return 0
    if (todayMinutes < 30) return 1
    if (todayMinutes < 120) return 2
    if (todayMinutes < 240) return 3
    if (todayMinutes < 480) return 4
    return 5
  }

  const productivityScore = getProductivityScore()
  const currentStreak = userStats.totalSessions > 0 ? Math.min(userStats.totalSessions, 7) : 0

  return (
    <div className="space-y-6">
      {/* Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Focus Time"
          value={formatTime(summary.todayMinutes)}
          description="Active coding time"
          icon={<Timer className="h-4 w-4" />}
          trend={
            summary.trends
              ? {
                  value: summary.trends.time * 12,
                  isPositive: summary.trends.time > 0,
                }
              : undefined
          }
        />

        <StatCard
          title="Productivity Score"
          value={`${productivityScore}/5`}
          description="Based on activity"
          icon={<Target className="h-4 w-4" />}
        />

        <StatCard
          title="Files Modified"
          value={summary.todayFiles}
          description="Files worked on"
          icon={<FileText className="h-4 w-4" />}
          trend={
            summary.trends
              ? {
                  value: summary.trends.files * 18,
                  isPositive: summary.trends.files > 0,
                }
              : undefined
          }
        />

        <StatCard
          title="Current Streak"
          value={`${currentStreak} days`}
          description="Active days"
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      {/* Detailed Analytics */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Session Analytics */}
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Session Analytics
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="text-xl font-bold mb-1 text-primary">
                  {userStats.totalSessions}
                </div>
                <div className="text-xs text-muted-foreground">Total Sessions</div>
              </div>
              
              <div className="text-center p-3 rounded-lg bg-secondary/10 border border-secondary/20">
                <div className="text-xl font-bold mb-1 text-secondary-foreground">
                  {formatTime(userStats.averageSessionTime)}
                </div>
                <div className="text-xs text-muted-foreground">Avg Session</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Active Project</span>
                <Badge variant="secondary" className="text-xs">
                  {summary.activeProject || userStats.mostActiveProject || "None"}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={userStats.isCurrentlyActive ? "default" : "outline"} className="text-xs">
                  {userStats.isCurrentlyActive ? "Active" : "Idle"}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Longest Session</span>
                <span className="font-medium">
                  {formatTime(summary.longestSession)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Development Stats */}
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Code className="h-4 w-4 text-muted-foreground" />
              Development Stats
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-accent/10 border border-accent/20">
                <div className="text-xl font-bold mb-1 text-accent-foreground">
                  {summary.todayProjects}
                </div>
                <div className="text-xs text-muted-foreground">Active Projects</div>
              </div>
              
              <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="text-xl font-bold mb-1">
                  {formatTime(userStats.totalCodingTime)}
                </div>
                <div className="text-xs text-muted-foreground">Total Time</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Top Language</span>
                <div className="flex items-center gap-2">
                  {userStats.mostUsedLanguage && (
                    <LanguageIcon language={userStats.mostUsedLanguage} size={14} />
                  )}
                  <Badge variant="outline" className="text-xs">
                    {userStats.mostUsedLanguage || "N/A"}
                  </Badge>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Current File</span>
                <span className="font-medium truncate max-w-32 text-xs">
                  {userStats.currentFile ? userStats.currentFile.split('/').pop() : "None"}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Projects Today</span>
                <span className="font-medium">
                  {userStats.activeProjects.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
