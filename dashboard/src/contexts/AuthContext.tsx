'use client';

import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/store';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Sync with Zustand store whenever user state changes
  useEffect(() => {
    useAuthStore.getState().setUser(user);
  }, [user]);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const userData = await authAPI.verifyToken(token);
        setUser(userData.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    authAPI.loginWithGithub();
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      localStorage.removeItem('auth_token');
      // Also clear the Zustand store
      useAuthStore.getState().logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
