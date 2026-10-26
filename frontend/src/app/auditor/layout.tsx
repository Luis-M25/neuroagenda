'use client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function AuditorLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout allowedRoles={['AUDITOR', 'ADMISION_PRINCIPAL', 'ADMIN']}>{children}</DashboardLayout>;
}
