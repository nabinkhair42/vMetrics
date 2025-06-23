import { pageSEO } from '@/config/seo-config';
import type { Metadata } from 'next';

export const metadata: Metadata = pageSEO.auth;

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
