"use client";

import Dashboard from '@/components/dashboard/Dashboard';
import { ActivityChart } from '@/components/charts/ActivityChart';
import { LanguageStats } from '@/components/dashboard/LanguageStats';
import { useLanguageStats } from '@/store';

export default function LanguagesPage() {
	const languageStats = useLanguageStats();
	return (
		<Dashboard>
			<div className="space-y-6">
				<div className="flex flex-col gap-6">
					<LanguageStats languages={languageStats} />
					<ActivityChart
						data={languageStats.map((l) => ({
							date: new Date().toISOString(),
							label: l.name,
							value: l.minutes,
						}))}
						type="area"
						title="Language Time Distribution"
						description="Time spent in each language"
						className="lg:col-span-1"
					/>
				</div>
			</div>
		</Dashboard>
	);
}