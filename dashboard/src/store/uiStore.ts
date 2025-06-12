import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  isLoading: boolean;
  error: string | null;
  selectedTimeRange: 'today' | 'week' | 'month';
  selectedView: 'overview' | 'projects' | 'languages' | 'activity';
}

interface UIActions {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setSelectedTimeRange: (range: 'today' | 'week' | 'month') => void;
  setSelectedView: (view: 'overview' | 'projects' | 'languages' | 'activity') => void;
}

type UIStore = UIState & UIActions;

const initialState: UIState = {
  isLoading: false,
  error: null,
  selectedTimeRange: 'today',
  selectedView: 'overview',
};

export const useUIStore = create<UIStore>()(
  devtools(
    (set) => ({
      ...initialState,
      setLoading: (loading) => set({ isLoading: loading }, false, 'setLoading'),
      setError: (error) => set({ error }, false, 'setError'),
      clearError: () => set({ error: null }, false, 'clearError'),
      setSelectedTimeRange: (range) => set({ selectedTimeRange: range }, false, 'setSelectedTimeRange'),
      setSelectedView: (view) => set({ selectedView: view }, false, 'setSelectedView'),
    }),
    { name: 'ui-store' }
  )
);

// Individual selectors (recommended for performance)
export const useIsLoading = () => useUIStore((state) => state.isLoading);
export const useError = () => useUIStore((state) => state.error);
export const useSelectedTimeRange = () => useUIStore((state) => state.selectedTimeRange);
export const useSelectedView = () => useUIStore((state) => state.selectedView);

// Deprecated: Use individual selectors above to avoid infinite loops
// export const useUIState = () => useUIStore((state) => ({
//   isLoading: state.isLoading,
//   error: state.error,
//   selectedTimeRange: state.selectedTimeRange,
//   selectedView: state.selectedView,
// }));
