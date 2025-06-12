import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authAPI } from '@/lib/api';
import { useAuthStore, useDashboardStore, useAutoRefresh, useRefreshInterval, useSettingsStore, useIsLoading, useError, useSelectedTimeRange, useLastUpdated, useUIStore } from '@/store';
import { RefreshCw } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
  const { isAuthenticated } = useAuthStore();
  const lastUpdated = useLastUpdated();
  const isLoading = useIsLoading();
  const error = useError();
  const selectedTimeRange = useSelectedTimeRange();
  const autoRefresh = useAutoRefresh();
  const refreshInterval = useRefreshInterval();

  // Hydrate stores on mount
  useEffect(() => {
    useAuthStore.persist.rehydrate();
    useSettingsStore.persist.rehydrate();
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && isAuthenticated) {
      const interval = setInterval(() => {
        useDashboardStore.getState().fetchDashboardData(selectedTimeRange);
      }, refreshInterval * 1000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, isAuthenticated, selectedTimeRange]);

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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please login to view your productivity dashboard</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.href = '/'}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading && !lastUpdated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium">Loading your productivity data...</p>
          <p className="text-sm text-muted-foreground">This may take a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto p-6 space-y-6">
        <DashboardHeader
          lastUpdated={lastUpdated}
          onRefresh={handleRefresh}
          onLogout={handleLogout}
          isLoading={isLoading}
        />
        <DashboardTabs />
      </div>
    </div>
  );
}
