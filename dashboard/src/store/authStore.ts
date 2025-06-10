import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  logout: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        setUser: (user) => set({ user, isAuthenticated: !!user }, false, 'setUser'),
        logout: () => {
          localStorage.removeItem('auth_token');
          set(initialState, false, 'logout');
        },
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        skipHydration: true,
      }
    ),
    { name: 'auth-store' }
  )
);

// Selectors
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
