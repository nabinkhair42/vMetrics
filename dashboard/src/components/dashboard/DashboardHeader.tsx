import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAutoRefresh, useRefreshInterval, useSettingsStore, useSelectedTimeRange, useUIStore, useUser } from '@/store';
import { 
  LogOut, 
  RefreshCw, 
  MoreVertical, 
  Clock,
  Calendar,
  CalendarDays,
} from 'lucide-react';

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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Welcome Section */}
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {user?.username}
          </h1>
          <p className="text-sm text-muted-foreground">
            Your coding productivity dashboard
          </p>
          
          {/* Status Badge */}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {formatLastUpdated(lastUpdated)}
            </Badge>
            {autoRefresh && (
              <Badge variant="secondary" className="text-xs">
                Auto-refresh {refreshInterval}s
              </Badge>
            )}
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-3">
          <TimeRangeSelector />
          <AutoRefreshToggle />
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile Actions */}
        <div className="flex lg:hidden items-center gap-2">
          <TimeRangeSelector />
          <MobileActionsMenu 
            onRefresh={onRefresh}
            onLogout={onLogout}
            isLoading={isLoading}
            autoRefresh={autoRefresh}
          />
        </div>
      </div>

      {/* Mobile Auto-refresh */}
      <div className="lg:hidden">
        <AutoRefreshToggle />
      </div>
    </div>
  );
}

function TimeRangeSelector() {
  const selectedTimeRange = useSelectedTimeRange();
  
  const timeRanges = [
    { value: 'today', label: 'Today', icon: Clock },
    { value: 'week', label: 'Week', icon: Calendar },
    { value: 'month', label: 'Month', icon: CalendarDays },
  ] as const;

  return (
    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-md">
      {timeRanges.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          variant={selectedTimeRange === value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => useUIStore.getState().setSelectedTimeRange(value)}
          className="text-xs px-2 sm:px-3 h-7"
        >
          <Icon className="h-3 w-3 sm:mr-1" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  );
}

function AutoRefreshToggle() {
  const autoRefresh = useAutoRefresh();
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <Switch
        checked={autoRefresh}
        onCheckedChange={useSettingsStore.getState().setAutoRefresh}
        id="auto-refresh"
      />
      <label htmlFor="auto-refresh" className="text-muted-foreground cursor-pointer">
        Auto-refresh
      </label>
    </div>
  );
}

function MobileActionsMenu({ 
  onRefresh, 
  onLogout, 
  isLoading, 
}: {
  onRefresh: () => void;
  onLogout: () => void;
  isLoading: boolean;
  autoRefresh: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
