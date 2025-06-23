'use client';

import Dashboard from '@/components/dashboard/Dashboard';
import { getBreadcrumbStructuredData } from '@/config/seo-config';

export default function DashboardPage() {
  const breadcrumbData = getBreadcrumbStructuredData([
    { name: 'Home', url: '/' },
    { name: 'Dashboard', url: '/dashboard' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData),
        }}
      />
      <Dashboard />
    </>
  );
}
