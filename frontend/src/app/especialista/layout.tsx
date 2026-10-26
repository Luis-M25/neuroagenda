'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function EspecialistaLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout allowedRoles={['ESPECIALISTA']}>
      {children}
    </DashboardLayout>
  );
}
