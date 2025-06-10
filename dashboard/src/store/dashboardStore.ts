import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { activityAPI } from '@/lib/api';
import type { UserStats, DashboardSummary, LanguageChartData, ProjectChartData, ChartDataPoint } from '@/lib/types';

interface DashboardState {
  userStats: UserStats | null;
  summary: DashboardSummary | null;
  dailyStats: ChartDataPoint[];
  languageStats: LanguageChartData[];
  projectStats: ProjectChartData[];
  recentActivity: any[];
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
    (set, get) => ({
      ...initialState,
      
      fetchDashboardData: async (timeRange = 'today') => {
        try {
          const days = timeRange === 'today' ? 1 : timeRange === 'week' ? 7 : 30;
          
          const [userStats, dailyData, projects, languages, recentActivity] = await Promise.all([
            activityAPI.getUserStats(),
            activityAPI.getTimeSeries(days),
            activityAPI.getProjects(30),
            activityAPI.getLanguages(30),
            activityAPI.getRecentActivity(20),
          ]);

          const dailyStats = dailyData.map((day: any) => ({
            date: day._id,
            value: Math.round(day.totalMinutes || 0),
            label: new Date(day._id).toLocaleDateString('en-US', { weekday: 'short' }),
          }));

          const transformedProjects = projects.map((project: any, index: number) => ({
            name: project._id || 'Unknown',
            timeSpent: Math.round(project.totalMinutes || 0),
            percentage: 0,
            color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
          }));

          const totalProjectTime = transformedProjects.reduce((sum: number, p: any) => sum + p.timeSpent, 0);
          transformedProjects.forEach((project: any) => {
            project.percentage = totalProjectTime > 0 ? (project.timeSpent / totalProjectTime) * 100 : 0;
          });

          const languageStats = languages.map((lang: any) => ({
            name: lang.name,
            minutes: lang.minutes,
            percentage: lang.percentage,
            color: lang.color,
          }));

          const summary: DashboardSummary = {
            todayMinutes: userStats.todayMinutes,
            todayFiles: userStats.activeProjects.length,
            todayProjects: userStats.activeProjects.length,
            activeProject: userStats.currentProject,
            longestSession: Math.round(userStats.averageSessionTime),
            trends: {
              time: userStats.todayMinutes > userStats.weeklyStats.averageDaily ? 1 : -1,
              files: userStats.activeProjects.length > 3 ? 1 : -1,
              projects: userStats.activeProjects.length,
            },
          };

          set({
            userStats,
            summary,
            dailyStats,
            languageStats,
            projectStats: transformedProjects.slice(0, 10),
            recentActivity: recentActivity || [],
            lastUpdated: Date.now(),
          }, false, 'fetchDashboardData');
        } catch (error) {
          console.error('Failed to fetch dashboard data:', error);
          throw error;
        }
      },

      setDashboardData: (data) => set(data, false, 'setDashboardData'),
      clearDashboardData: () => set(initialState, false, 'clearDashboardData'),
    }),
    { name: 'dashboard-store' }
  )
);

// Individual selectors (recommended for performance)
export const useUserStats = () => useDashboardStore((state) => state.userStats);
export const useSummary = () => useDashboardStore((state) => state.summary);
export const useDailyStats = () => useDashboardStore((state) => state.dailyStats);
export const useLanguageStats = () => useDashboardStore((state) => state.languageStats);
export const useProjectStats = () => useDashboardStore((state) => state.projectStats);
export const useRecentActivity = () => useDashboardStore((state) => state.recentActivity);
export const useLastUpdated = () => useDashboardStore((state) => state.lastUpdated);

// Deprecated: Use individual selectors above to avoid infinite loops
// export const useDashboardData = () => useDashboardStore((state) => ({
//   userStats: state.userStats,
//   summary: state.summary,
//   dailyStats: state.dailyStats,
//   languageStats: state.languageStats,
//   projectStats: state.projectStats,
//   recentActivity: state.recentActivity,
//   lastUpdated: state.lastUpdated,
// }));
