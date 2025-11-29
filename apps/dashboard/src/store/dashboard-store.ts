import { create } from 'zustand';
import { api, type DashboardData } from '@/lib/api';

type TimeRange = 'today' | 'week' | 'month';

interface DashboardState {
  data: DashboardData | null;
  timeRange: TimeRange;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  setTimeRange: (range: TimeRange) => void;
  fetchData: (range?: TimeRange) => Promise<void>;
  clearData: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  data: null,
  timeRange: 'today',
  isLoading: false,
  error: null,
  lastUpdated: null,

  setTimeRange: (range) => {
    set({ timeRange: range });
    get().fetchData(range);
  },

  fetchData: async (range) => {
    const timeRange = range || get().timeRange;
    set({ isLoading: true, error: null });

    try {
      const data = await api.getDashboardData(timeRange);
      set({ data, isLoading: false, lastUpdated: Date.now() });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch data',
      });
    }
  },

  clearData: () => {
    set({ data: null, lastUpdated: null, error: null });
  },
}));
