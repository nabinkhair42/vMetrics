import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface SettingsState {
  autoRefresh: boolean;
  refreshInterval: number;
  dailyGoal: number;
  weeklyGoal: number;
  currentStreak: number;
  longestStreak: number;
}

interface SettingsActions {
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (seconds: number) => void;
  setDailyGoal: (minutes: number) => void;
  setWeeklyGoal: (minutes: number) => void;
  updateStreak: (current: number, longest: number) => void;
}

type SettingsStore = SettingsState & SettingsActions;

const initialState: SettingsState = {
  autoRefresh: true,
  refreshInterval: 30,
  dailyGoal: 240,
  weeklyGoal: 1200,
  currentStreak: 0,
  longestStreak: 0,
};

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        setAutoRefresh: (enabled) => set({ autoRefresh: enabled }, false, 'setAutoRefresh'),
        setRefreshInterval: (seconds) => set({ refreshInterval: seconds }, false, 'setRefreshInterval'),
        setDailyGoal: (minutes) => set({ dailyGoal: minutes }, false, 'setDailyGoal'),
        setWeeklyGoal: (minutes) => set({ weeklyGoal: minutes }, false, 'setWeeklyGoal'),
        updateStreak: (current, longest) => set({ currentStreak: current, longestStreak: longest }, false, 'updateStreak'),
      }),
      {
        name: 'settings-store',
        skipHydration: true,
      }
    ),
    { name: 'settings-store' }
  )
);

// Individual selectors (recommended for performance)
export const useAutoRefresh = () => useSettingsStore((state) => state.autoRefresh);
export const useRefreshInterval = () => useSettingsStore((state) => state.refreshInterval);
export const useDailyGoal = () => useSettingsStore((state) => state.dailyGoal);
export const useWeeklyGoal = () => useSettingsStore((state) => state.weeklyGoal);
export const useCurrentStreak = () => useSettingsStore((state) => state.currentStreak);
export const useLongestStreak = () => useSettingsStore((state) => state.longestStreak);

// Simple combined selector using single subscription
export const useSettings = () => useSettingsStore((state) => ({
  autoRefresh: state.autoRefresh,
  refreshInterval: state.refreshInterval,
  dailyGoal: state.dailyGoal,
  weeklyGoal: state.weeklyGoal,
  currentStreak: state.currentStreak,
  longestStreak: state.longestStreak,
}));
