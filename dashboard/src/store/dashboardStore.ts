import { activityAPI } from '@/lib/api';
import type { ActivityEvent, ChartDataPoint, DashboardSummary, LanguageChartData, ProjectChartData, UserStats } from '@/lib/types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// API Response types
interface ApiLanguage {
  name: string;
  minutes: number;
  percentage: number;
}

interface ApiProject {
  name: string;
  minutes: number;
  files: number;
  percentage?: number;
}

// Legacy API response types
interface LegacyDailyStat {
  _id: string;
  totalMinutes: number;
}

interface LegacyProject {
  _id: string;
  totalMinutes: number;
}

interface LegacyLanguage {
  name: string;
  minutes: number;
  percentage: number;
}

interface DashboardState {
  userStats: UserStats | null;
  summary: DashboardSummary | null;
  dailyStats: ChartDataPoint[];
  languageStats: LanguageChartData[];
  projectStats: ProjectChartData[];
  recentActivity: ActivityEvent[];
  lastUpdated: number | null;
}

interface DashboardActions {
  fetchDashboardData: (timeRange?: 'today' | 'week' | 'month') => Promise<void>;
  setDashboardData: (data: Partial<DashboardState>) => void;
  clearDashboardData: () => void;
}

type DashboardStore = DashboardState & DashboardActions;

const initialState: DashboardState = {
  userStats: null,
  summary: null,
  dailyStats: [],
  languageStats: [],
  projectStats: [],
  recentActivity: [],
  lastUpdated: null,
};

export const useDashboardStore = create<DashboardStore>()(
  devtools(
    (set) => ({
      ...initialState,
      
      fetchDashboardData: async (timeRange = 'today') => {
        try {
          // Use the consolidated API for better performance
          const dashboardData = await activityAPI.getDashboardData(timeRange);
          
          // Transform data for dashboard components
          const dailyStats = dashboardData.dailyTrend?.map((day: { date: string; minutes: number }) => ({
            date: day.date,
            value: day.minutes,
            label: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
          })) || [];

          const languageStats = dashboardData.languages.map((lang: ApiLanguage, index: number) => ({
            name: lang.name,
            minutes: lang.minutes,
            percentage: lang.percentage,
            color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
          }));

          const projectStats = dashboardData.projects.map((project: ApiProject, index: number) => ({
            name: project.name || 'Unknown',
            timeSpent: project.minutes,
            percentage: project.percentage,
            color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
          }));

          // Create comprehensive UserStats object
          const userStats: UserStats = {
            todayMinutes: dashboardData.summary.totalMinutes,
            totalCodingTime: dashboardData.summary.totalMinutes,
            currentFile: dashboardData.currentActivity.currentFile,
            currentProject: dashboardData.currentActivity.currentProject,
            activeProjects: dashboardData.projects.map((p: ApiProject) => p.name).slice(0, 5),
            languageStats: languageStats.map((lang: LanguageChartData) => ({
              language: lang.name,
              timeSpent: lang.minutes,
              filesWorked: 0,
              percentage: lang.percentage
            })),
            totalSessions: dashboardData.summary.totalSessions,
            averageSessionTime: dashboardData.summary.averageSessionTime,
            mostUsedLanguage: languageStats[0]?.name,
            mostActiveProject: projectStats[0]?.name,
            dailyStats: dailyStats.map((day: ChartDataPoint) => ({
              date: day.date,
              codingTime: day.value,
              filesWorked: [],
              languages: [],
              projects: [],
              sessions: 0
            })),
            weeklyStats: {
              totalTime: dashboardData.summary.totalMinutes,
              averageDaily: dashboardData.summary.totalMinutes / 7,
              mostProductiveDay: dailyStats[0]?.date || new Date().toISOString().split('T')[0],
              languageBreakdown: languageStats.map((lang: LanguageChartData) => ({
                language: lang.name,
                timeSpent: lang.minutes,
                filesWorked: 0,
                percentage: lang.percentage
              })),
              projectBreakdown: projectStats.map((proj: ProjectChartData) => ({
                project: proj.name,
                timeSpent: proj.timeSpent,
                filesWorked: 0,
                percentage: proj.percentage || 0
              }))
            },
            isCurrentlyActive: dashboardData.currentActivity.isActive,
            lastActivityTime: dashboardData.currentActivity.lastActivity ? 
              new Date(dashboardData.currentActivity.lastActivity).getTime() : Date.now()
          };

          const recentActivity = dashboardData.recentSessions.map((session: { startTime: string; currentFile: string; currentProject: string; duration: number }) => ({
            timestamp: session.startTime,
            type: 'session' as const,
            file: session.currentFile,
            project: session.currentProject,
            duration: session.duration * 60 * 1000, // Convert minutes to ms
            language: 'unknown'
          }));

          set({
            userStats,
            dailyStats,
            languageStats,
            projectStats,
            recentActivity,
            lastUpdated: Date.now()
          });
        } catch (error) {
          console.error('V2 API failed, falling back to legacy API:', error);
          
          // Fallback to legacy API
          try {
            const days = timeRange === 'today' ? 1 : timeRange === 'week' ? 7 : 30;
            
            const [userStatsData, dailyData, projectsData, languagesData, recentActivityData] = await Promise.all([
              activityAPI.getUserStats(),
              activityAPI.getTimeSeries(days),
              activityAPI.getProjects(30),
              activityAPI.getLanguages(30),
              activityAPI.getRecentActivity(20),
            ]);

            const dailyStats = dailyData.map((day: LegacyDailyStat) => ({
              date: day._id,
              value: Math.round(day.totalMinutes || 0),
              label: new Date(day._id).toLocaleDateString('en-US', { weekday: 'short' }),
            }));

            const transformedProjects = projectsData.map((project: LegacyProject, index: number) => ({
              name: project._id || 'Unknown',
              timeSpent: Math.round(project.totalMinutes || 0),
              percentage: 0,
              color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
            }));

            const totalProjectTime = transformedProjects.reduce((sum: number, p: ProjectChartData) => sum + p.timeSpent, 0);
            transformedProjects.forEach((project: ProjectChartData) => {
              project.percentage = totalProjectTime > 0 ? Math.round((project.timeSpent / totalProjectTime) * 100) : 0;
            });

            const transformedLanguages = languagesData.map((lang: LegacyLanguage, index: number) => ({
              name: lang.name,
              minutes: Math.round(lang.minutes || 0),
              percentage: Math.round(lang.percentage || 0),
              color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
            }));

            set({
              userStats: userStatsData,
              dailyStats,
              languageStats: transformedLanguages,
              projectStats: transformedProjects,
              recentActivity: recentActivityData,
              lastUpdated: Date.now()
            });
          } catch (legacyError) {
            console.error('Both V2 and legacy APIs failed:', legacyError);
            throw legacyError;
          }
        }
      },

      setDashboardData: (data) => set(data),
      clearDashboardData: () => set(initialState),
    }),
    {
      name: 'dashboard-store',
    }
  )
);

// Individual selector hooks for optimized re-renders
export const useUserStats = () => useDashboardStore((state) => state.userStats);
export const useDailyStats = () => useDashboardStore((state) => state.dailyStats);
export const useLanguageStats = () => useDashboardStore((state) => state.languageStats);
export const useProjectStats = () => useDashboardStore((state) => state.projectStats);
export const useRecentActivity = () => useDashboardStore((state) => state.recentActivity);
export const useLastUpdated = () => useDashboardStore((state) => state.lastUpdated);

// Composite hook that provides summary data (combination of user stats and daily stats)
export const useSummary = () => {
  const userStats = useUserStats();
  const dailyStats = useDailyStats();
  
  return {
    userStats,
    dailyStats,
    todayMinutes: userStats?.todayMinutes || 0,
    totalMinutes: userStats?.totalCodingTime || 0,
    streakDays: userStats?.weeklyStats?.totalTime || 0,
    averageHours: userStats?.averageSessionTime ? userStats.averageSessionTime / 60 : 0,
    // Additional properties expected by StatsOverview
    todayFiles: userStats?.activeProjects?.length || 0,
    todayProjects: userStats?.activeProjects?.length || 0,
    activeProject: userStats?.currentProject || 'No project',
    longestSession: userStats?.averageSessionTime || 0,
    trends: {
      time: 0,
      files: 0,
      projects: 0
    }
  };
};
