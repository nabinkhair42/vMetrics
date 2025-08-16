import LoginCard from '@/components/auth/LoginCard';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { UniversalLoading } from '@/components/UniversalLoading';
import { authAPI } from '@/lib/api';
import { useAuthStore, useDashboardStore, useError, useIsLoading, useSelectedTimeRange, useUIStore } from '@/store';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function Dashboard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const isLoading = useIsLoading();
  const error = useError();
  const selectedTimeRange = useSelectedTimeRange();

  // Hydrate stores on mount
  useEffect(() => {
    useAuthStore.persist.rehydrate();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        useDashboardStore.getState().fetchDashboardData(selectedTimeRange);
      }, 30000); // 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, selectedTimeRange]);

  // Initial data load
  useEffect(() => {
    if (isAuthenticated) {
      useUIStore.getState().setLoading(true);
      useDashboardStore.getState().fetchDashboardData(selectedTimeRange)
        .catch(() => useUIStore.getState().setError('Failed to load dashboard data'))
        .finally(() => useUIStore.getState().setLoading(false));
    }
  }, [isAuthenticated, selectedTimeRange]);

  // Error handling
  useEffect(() => {
    if (error) {
      toast.error(error);
      useUIStore.getState().clearError();
    }
  }, [error]);

  const handleRefresh = async () => {
    try {
      useUIStore.getState().setLoading(true);
      await useDashboardStore.getState().fetchDashboardData(selectedTimeRange);
      toast.success('Data refreshed');
    } catch {
      toast.error('Failed to refresh data');
    } finally {
      useUIStore.getState().setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      useAuthStore.getState().logout();
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed');
    }
  };

  if (!isAuthenticated) {
    return <LoginCard />;
  }

  if (isLoading && !selectedTimeRange) {
    return <UniversalLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <div className="container mx-auto p-6 space-y-6">
        <DashboardHeader onLogout={handleLogout} />
        <DashboardFilters
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />
        {children}
      </div>
    </div>
  );
}



