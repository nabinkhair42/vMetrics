import { pageSEO } from '@/config/seo-config';
import type { Metadata } from 'next';

export const metadata: Metadata = pageSEO.dashboard;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
