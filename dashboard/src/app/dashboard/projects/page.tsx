"use client";

import Dashboard from '@/components/dashboard/Dashboard';
import { ActivityChart } from '@/components/charts/ActivityChart';
import { ProjectChart } from '@/components/charts/ProjectChart';
import { useProjectStats } from '@/store';

export default function ProjectsPage() {
	const projectStats = useProjectStats();
	return (
		<Dashboard>
			<div className="space-y-6">
				<div className="flex flex-col gap-6">
					<ProjectChart data={projectStats} />
					<ActivityChart
						data={projectStats.map((p) => ({
							date: new Date().toISOString(),
							label: p.name,
							value: p.timeSpent,
							color: p.color,
						}))}
						type="bar"
						title="Project Time Distribution"
						description="Time spent on each project"
						className="lg:col-span-1"
					/>
				</div>
			</div>
		</Dashboard>
	);
}