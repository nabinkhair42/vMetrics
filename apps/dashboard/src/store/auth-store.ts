import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, type User } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (token: string) => Promise<void>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),
      setToken: (token) => {
        api.setToken(token);
        set({ token });
      },

      login: async (token) => {
        set({ isLoading: true, error: null });

        try {
          api.setToken(token);
          const { user } = await api.verifyToken(token);
          set({ user, token, isLoading: false });
        } catch (error) {
          set({
            user: null,
            token: null,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
          api.setToken(null);
          throw error;
        }
      },

      logout: () => {
        api.setToken(null);
        set({ user: null, token: null, error: null });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'vmetrics-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        // Restore API token after rehydration
        if (state?.token) {
          api.setToken(state.token);
        }
      },
    }
  )
);
