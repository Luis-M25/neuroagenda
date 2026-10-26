'use client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function EnfermeroLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout allowedRoles={['ENFERMERO', 'ADMISION_PRINCIPAL', 'ADMIN']}>{children}</DashboardLayout>;
}
