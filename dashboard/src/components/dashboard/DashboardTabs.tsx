"use client"

import { ActivityChart } from "@/components/charts/ActivityChart"
import { ProjectChart } from "@/components/charts/ProjectChart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDailyStats, useLanguageStats, useProjectStats, useSelectedView, useUIStore } from "@/store"
import { Activity, BarChart3, Code, FileCode } from "lucide-react"
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
        <RecentActivity className="lg:col-span-1" />
      </div>

      {/* Activity Heatmap */}
      <ActivityHeatmap 
        data={dailyStats.map((d) => ({ 
          date: d.date, 
          minutes: d.value, 
          sessions: 1 
        }))} 
      />
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
          description="Detailed coding patterns"
        />
        <RecentActivity />
      </div>

      {/* Extended Heatmap */}
      <ActivityHeatmap 
        data={dailyStats.map((d) => ({ 
          date: d.date, 
          minutes: d.value, 
          sessions: 1 
        }))} 
        weeks={26} 
      />
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
        <RecentActivity />
      </div>
    </div>
  )
}

// Languages Tab Content
function LanguagesTab() {
  const languageStats = useLanguageStats()

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <LanguageStats languages={languageStats} />
        <RecentActivity />
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
    <Tabs value={selectedView} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4 bg-muted/50">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Overview</span>
        </TabsTrigger>
        <TabsTrigger value="activity" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <span className="hidden sm:inline">Activity</span>
        </TabsTrigger>
        <TabsTrigger value="projects" className="flex items-center gap-2">
          <Code className="h-4 w-4" />
          <span className="hidden sm:inline">Projects</span>
        </TabsTrigger>
        <TabsTrigger value="languages" className="flex items-center gap-2">
          <FileCode className="h-4 w-4" />
          <span className="hidden sm:inline">Languages</span>
        </TabsTrigger>
      </TabsList>

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
  )
}
