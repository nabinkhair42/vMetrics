"use client"

import { ActivityChart } from "@/components/charts/ActivityChart"
import { ProjectChart } from "@/components/charts/ProjectChart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDailyStats, useLanguageStats, useProjectStats, useSelectedView, useUIStore } from "@/store"
import { Activity, BarChart2, Code2, Layout } from "lucide-react"
import { ActivityHeatmap } from "./ActivityHeatmap"
import { LanguageStats } from "@/components/dashboard/LanguageStats"
import { RecentActivity } from "./RecentActivity"
import { EnhancedStatsOverview } from "@/components/dashboard/StatsOverview"

// Overview Tab Content - Main dashboard with all key metrics
function OverviewTab() {
  const dailyStats = useDailyStats()

  return (
    <div className="space-y-6">
      <EnhancedStatsOverview />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityChart
          data={dailyStats}
          type="area"
          title="Daily Activity"
          description="Your coding activity over time"
        />
        <ActivityHeatmap 
          data={dailyStats.map((d) => ({ 
            date: d.date, 
            minutes: d.value, 
            sessions: 1 
          }))} 
        />
      </div>
      <RecentActivity />
    </div>
  )
}

// Activity Tab Content - Detailed activity view
function ActivityTab() {
  const dailyStats = useDailyStats()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
          <ActivityChart
            data={dailyStats}
            type="bar"
            title="Daily Activity"
            description="Your coding activity by day"
          />
         <RecentActivity  />
      </div>
    </div>
  )
}

// Projects Tab Content - Project-specific metrics
function ProjectsTab() {
  const projectStats = useProjectStats()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <ProjectChart data={projectStats} />
        <ActivityChart
          data={projectStats.map((p) => ({ 
            date: new Date().toISOString(),
            label: p.name, 
            value: p.timeSpent,
            color: p.color
          }))}
          type="bar"
          title="Project Time Distribution"
          description="Time spent on each project"
          className="lg:col-span-1"
        />
      </div>
    </div>
  )
}

// Languages Tab Content - Language-specific metrics
function LanguagesTab() {
  const languageStats = useLanguageStats()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <LanguageStats languages={languageStats} />
        <ActivityChart
          data={languageStats.map((l) => ({ 
            date: new Date().toISOString(),
            label: l.name, 
            value: l.minutes
          }))}
          type="bar"
          title="Language Time Distribution"
          description="Time spent in each language"
          className="lg:col-span-1"
        />
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
    <Tabs defaultValue={selectedView} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex gap-1 p-1 mb-4">
        <TabsTrigger value="overview" className="sm:min-w-32">
          <Layout className="h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="activity" className="sm:min-w-32">
          <Activity className="h-4 w-4" />
          Activity
        </TabsTrigger>
        <TabsTrigger value="projects" className="sm:min-w-32">
          <BarChart2 className="h-4 w-4" />
          Projects
        </TabsTrigger>
        <TabsTrigger value="languages" className="sm:min-w-32">
          <Code2 className="h-4 w-4" />
          Languages
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4 outline-none">
        <OverviewTab />
      </TabsContent>

      <TabsContent value="activity" className="space-y-4 outline-none">
        <ActivityTab />
      </TabsContent>

      <TabsContent value="projects" className="space-y-4 outline-none">
        <ProjectsTab />
      </TabsContent>

      <TabsContent value="languages" className="space-y-4 outline-none">
        <LanguagesTab />
      </TabsContent>
    </Tabs>
  )
}
