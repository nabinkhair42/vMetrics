import { ActivityChart } from '@/components/charts/ActivityChart';
import { ProjectChart } from '@/components/charts/ProjectChart';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDailyStats, useLanguageStats, useProjectStats, useSelectedView, useUIStore } from '@/store';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, BarChart3, Code, Target, TrendingUp } from 'lucide-react';
import { ActivityHeatmap } from './ActivityHeatmap';
import { LanguageStats } from './LanguageStats';
import { RecentActivity } from './RecentActivity';
import { EnhancedStatsOverview } from './StatsOverview';

export function DashboardTabs() {
  const selectedView = useSelectedView();
  const dailyStats = useDailyStats();
  const languageStats = useLanguageStats();
  const projectStats = useProjectStats();

  return (
    <Tabs 
      value={selectedView} 
      onValueChange={(value) => useUIStore.getState().setSelectedView(value as 'overview' | 'activity' | 'projects' | 'languages' | 'goals')} 
      className="space-y-6"
    >
      <TabsList className="grid w-full grid-cols-5">
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
          <TrendingUp className="h-4 w-4" />
          <span className="hidden sm:inline">Languages</span>
        </TabsTrigger>
        <TabsTrigger value="goals" className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          <span className="hidden sm:inline">Goals</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <EnhancedStatsOverview />
            <div className="grid gap-6 lg:grid-cols-7">
              <ActivityChart data={dailyStats} title="Activity Trend" description="Your coding activity over time" className="col-span-4" />
              <RecentActivity showLiveIndicator={true} />
            </div>
            <ActivityHeatmap data={dailyStats.map(d => ({ date: d.date, minutes: d.value, sessions: 1 }))} />
          </motion.div>
        </AnimatePresence>
      </TabsContent>

      <TabsContent value="activity" className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <ActivityChart data={dailyStats} type="line" title="Activity Timeline" description="Detailed view of your coding patterns" />
              <RecentActivity />
            </div>
            <ActivityHeatmap data={dailyStats.map(d => ({ date: d.date, minutes: d.value, sessions: 1 }))} weeks={26} />
          </motion.div>
        </AnimatePresence>
      </TabsContent>

      <TabsContent value="projects" className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key="projects"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="grid gap-6 lg:grid-cols-7">
              <ProjectChart data={projectStats} className="col-span-4" />
              <RecentActivity />
            </div>
          </motion.div>
        </AnimatePresence>
      </TabsContent>

      <TabsContent value="languages" className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key="languages"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <LanguageStats languages={languageStats} />
              <Card>
                <CardHeader>
                  <CardTitle>Language Insights</CardTitle>
                  <CardDescription>Your programming language usage patterns</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {languageStats.length > 0 ? (
                    <div className="space-y-4">
                      <div className="text-center p-6 bg-muted/50 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2">Most Used Language</h3>
                        <p className="text-2xl font-bold text-primary">{languageStats[0]?.name || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">{languageStats[0]?.percentage.toFixed(1)}% of your coding time</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 border rounded-lg">
                          <p className="text-lg font-semibold">{languageStats.length}</p>
                          <p className="text-sm text-muted-foreground">Languages Used</p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <p className="text-lg font-semibold">{Math.round(languageStats.reduce((sum, lang) => sum + lang.minutes, 0) / 60)}h</p>
                          <p className="text-sm text-muted-foreground">Total Time</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No language data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </AnimatePresence>
      </TabsContent>

      <TabsContent value="goals" className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key="goals"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center py-12">
              <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Goals & Progress Tracking</h3>
              <p className="text-muted-foreground mb-6">Set and track your coding goals to improve productivity</p>
              <Badge variant="outline">Coming Soon</Badge>
            </div>
          </motion.div>
        </AnimatePresence>
      </TabsContent>
    </Tabs>
  );
}
