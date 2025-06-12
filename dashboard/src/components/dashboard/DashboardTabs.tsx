"use client"

import { ActivityChart } from "@/components/charts/ActivityChart"
import { ProjectChart } from "@/components/charts/ProjectChart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDailyStats, useLanguageStats, useProjectStats, useSelectedView, useUIStore } from "@/store"
import { Activity, BarChart3, Clock, Code, FileCode, TrendingUp } from "lucide-react"
import { ActivityHeatmap } from "./ActivityHeatmap"
import { LanguageStats } from "./LanguageStats"
import { RecentActivity } from "./RecentActivity"
import { EnhancedStatsOverview } from "./StatsOverview"

// Overview Tab Content
function OverviewTab() {
  const dailyStats = useDailyStats()

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <EnhancedStatsOverview />

      {/* Activity and Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityChart
            data={dailyStats}
            title="Activity Trend"
            description="Your coding activity over time"
            className="h-full"
          />
        </div>
        <div className="lg:col-span-1">
          <RecentActivity className="h-full" />
        </div>
      </div>

      {/* Activity Heatmap */}
      <ActivityHeatmap data={dailyStats.map((d) => ({ date: d.date, minutes: d.value, sessions: 1 }))} />
    </div>
  )
}

// Activity Tab Content
function ActivityTab() {
  const dailyStats = useDailyStats()

  return (
    <div className="space-y-6">
      {/* Activity Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityChart
          data={dailyStats}
          type="line"
          title="Activity Timeline"
          description="Detailed view of your coding patterns"
        />
        <RecentActivity />
      </div>

      {/* Extended Heatmap */}
      <ActivityHeatmap data={dailyStats.map((d) => ({ date: d.date, minutes: d.value, sessions: 1 }))} weeks={26} />
    </div>
  )
}

// Projects Tab Content
function ProjectsTab() {
  const projectStats = useProjectStats()

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProjectChart data={projectStats} />
        </div>
        <div className="lg:col-span-1">
          <RecentActivity />
        </div>
      </div>
    </div>
  )
}

// Languages Tab Content
function LanguagesTab() {
  const languageStats = useLanguageStats()

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const totalTime = languageStats.reduce((sum, lang) => sum + lang.minutes, 0)
  const topLanguage = languageStats.length > 0 ? languageStats[0] : null

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <LanguageStats languages={languageStats} />

        <Card className="bg-card/50 border border-border">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <FileCode className="h-4 w-4 sm:h-5 sm:w-5" />
              Language Insights
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">Your programming language usage patterns</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {languageStats.length > 0 ? (
              <div className="space-y-4 sm:space-y-6">
                {/* Most Used Language Highlight */}
                <div className="text-center p-4 sm:p-6 bg-muted/50 rounded-lg">
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Most Used Language</h3>
                  <p className="text-xl sm:text-2xl font-bold text-primary mb-1">{topLanguage?.name || "N/A"}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {topLanguage?.percentage.toFixed(1)}% of your coding time
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="text-center p-3 sm:p-4 border rounded-lg bg-card/30">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Code className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-base sm:text-lg font-semibold">{languageStats.length}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Languages Used</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 border rounded-lg bg-card/30">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-base sm:text-lg font-semibold">{formatTime(totalTime)}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Total Time</p>
                  </div>
                </div>

                {/* Language Distribution */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Language Distribution</h4>
                  <div className="space-y-2">
                    {languageStats.slice(0, 3).map((lang) => (
                      <div key={lang.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lang.color }} />
                          <span>{lang.name}</span>
                        </div>
                        <span className="font-medium">{formatTime(lang.minutes)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 text-muted-foreground">
                <Code className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm sm:text-base font-medium mb-1">No language data available</p>
                <p className="text-xs sm:text-sm opacity-75">Start coding to see your language breakdown</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Main Dashboard Tabs Component
export function DashboardTabs() {
  const selectedView = useSelectedView()

  const handleTabChange = (value: string) => {
    useUIStore.getState().setSelectedView(value as "overview" | "activity" | "projects" | "languages")
  }

  return (
    <div className="space-y-6">
      <Tabs value={selectedView} onValueChange={handleTabChange} className="w-full">
        {/* Responsive Tab Navigation */}
        <div className="w-full overflow-x-auto">
          <TabsList className="inline-flex h-10 sm:h-12 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground min-w-full sm:min-w-0 sm:w-auto">
            <TabsTrigger
              value="overview"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger
              value="projects"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2"
            >
              <Code className="h-4 w-4" />
              <span className="hidden sm:inline">Projects</span>
            </TabsTrigger>
            <TabsTrigger
              value="languages"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Languages</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          <TabsContent value="overview" className="mt-0">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="activity" className="mt-0">
            <ActivityTab />
          </TabsContent>

          <TabsContent value="projects" className="mt-0">
            <ProjectsTab />
          </TabsContent>

          <TabsContent value="languages" className="mt-0">
            <LanguagesTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
