"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Layout, Activity, BarChart2, Code2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
	{ href: '/dashboard/overview', label: 'Overview', icon: Layout },
	{ href: '/dashboard/activity', label: 'Activity', icon: Activity },
	{ href: '/dashboard/projects', label: 'Projects', icon: BarChart2 },
	{ href: '/dashboard/languages', label: 'Languages', icon: Code2 },
]

export function Sidebar() {
	const pathname = usePathname()
	return (
		<nav className="p-4 md:p-6 space-y-2">
			<div className="px-2 text-xs uppercase text-muted-foreground tracking-wide">Dashboard</div>
			<ul className="space-y-1">
				{links.map(({ href, label, icon: Icon }) => {
					const active = pathname?.startsWith(href)
					return (
						<li key={href}>
							<Link
								href={href}
								className={cn(
									'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
									active
										? 'bg-background text-foreground border border-border'
										: 'text-muted-foreground hover:text-foreground hover:bg-muted'
								)}
							>
								<Icon className="h-4 w-4" />
								<span>{label}</span>
							</Link>
						</li>
					)
				})}
			</ul>
		</nav>
	)
}