"use client";

import Dashboard from '@/components/dashboard/Dashboard';
import { ActivityChart } from '@/components/charts/ActivityChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { useDailyStats } from '@/store';

export default function ActivityPage() {
	const dailyStats = useDailyStats();
	return (
		<Dashboard>
			<div className="space-y-6">
				<div className="flex flex-col gap-6">
					<ActivityChart
						data={dailyStats}
						type="bar"
						title="Daily Activity"
						description="Your coding activity by day"
					/>
					<RecentActivity />
				</div>
			</div>
		</Dashboard>
	);
}