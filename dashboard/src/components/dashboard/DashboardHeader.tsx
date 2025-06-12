import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAutoRefresh, useRefreshInterval, useSettingsStore, useSelectedTimeRange, useUIStore, useUser } from '@/store';
import { LogOut, RefreshCw } from 'lucide-react';

interface DashboardHeaderProps {
  lastUpdated: number | null;
  onRefresh: () => void;
  onLogout: () => void;
  isLoading: boolean;
}

export function DashboardHeader({ lastUpdated, onRefresh, onLogout, isLoading }: DashboardHeaderProps) {
  const user = useUser();
  const autoRefresh = useAutoRefresh();
  const refreshInterval = useRefreshInterval();

  const formatLastUpdated = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return 'Over a day ago';
  };

  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Welcome back, {user?.username}! 👋
        </h1>
        <p className="text-muted-foreground">Here&apos;s your coding productivity overview</p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs">
            Last updated: {formatLastUpdated(lastUpdated)}
          </Badge>
          {autoRefresh && (
            <Badge variant="secondary" className="text-xs">
              Auto-refresh: {refreshInterval}s
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <TimeRangeSelector />
        <AutoRefreshToggle />
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button variant="outline" size="sm" onClick={onLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}

function TimeRangeSelector() {
  const selectedTimeRange = useSelectedTimeRange();
  
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {(['today', 'week', 'month'] as const).map((range) => (
        <Button
          key={range}
          variant={selectedTimeRange === range ? 'default' : 'ghost'}
          size="sm"
          onClick={() => useUIStore.getState().setSelectedTimeRange(range)}
          className="text-xs"
        >
          {range.charAt(0).toUpperCase() + range.slice(1)}
        </Button>
      ))}
    </div>
  );
}

function AutoRefreshToggle() {
  const autoRefresh = useAutoRefresh();
  
  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={autoRefresh}
        onCheckedChange={useSettingsStore.getState().setAutoRefresh}
        id="auto-refresh"
      />
      <label htmlFor="auto-refresh" className="text-sm text-muted-foreground">
        Auto-refresh
      </label>
    </div>
  );
}
