import { pageSEO } from '@/config/seo-config';
import type { Metadata } from 'next';
import { Sidebar } from '@/components/dashboard/Sidebar';

export const metadata: Metadata = pageSEO.dashboard;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="border-r bg-muted/20">
        <Sidebar />
      </aside>
      <main>{children}</main>
    </div>
  );
}
