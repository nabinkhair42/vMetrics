"use client";

import Dashboard from '@/components/dashboard/Dashboard';
import { EnhancedStatsOverview } from '@/components/dashboard/StatsOverview';
import { ActivityChart } from '@/components/charts/ActivityChart';
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap';
import { useDailyStats } from '@/store';

export default function OverviewPage() {
	const dailyStats = useDailyStats();
	return (
		<Dashboard>
			<div className="space-y-6">
				<EnhancedStatsOverview />
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<ActivityChart
						data={dailyStats}
						type="area"
						title="Daily Activity"
						description="Your coding activity over time"
					/>
					<ActivityHeatmap 
						data={dailyStats.map((d) => ({ 
							date: d.date, 
							minutes: d.value, 
							sessions: 1 
						}))} 
					/>
				</div>
			</div>
		</Dashboard>
	);
}