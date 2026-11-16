'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { NotificationBell } from './notification-bell';
import { isAuthenticated, getUser } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';

import { PageSkeleton } from '@/components/ui/skeleton';

interface DashboardLayoutProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function DashboardLayout({ children, allowedRoles }: DashboardLayoutProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // allowedRoles llega como array: su identidad cambia en cada render y hacia que
  // el efecto se re-ejecutara siempre. Lo convertimos a una clave estable.
  const allowedRolesKey = useMemo(() => (allowedRoles ? allowedRoles.join('|') : ''), [allowedRoles]);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) { router.replace(ROUTES.login); return; }
    if (allowedRolesKey) {
      const roles = allowedRolesKey.split('|');
      const user = getUser();
      const userRoles = new Set([...(user?.roles ?? []), ...(user?.rol ? [user.rol] : [])]);
      const hasAccess = Array.from(userRoles).some((r) => roles.includes(r));
      if (!user || !hasAccess) { router.replace(ROUTES.login); }
    }
  }, [router, allowedRolesKey]);

  if (!mounted || !isAuthenticated()) {
    return (
      <div className="min-h-screen flex bg-surface">
        <div className="hidden lg:block w-60 border-r border-neutral-100 bg-white p-4 space-y-4">
          <div className="h-10 bg-neutral-100 rounded-lg animate-pulse" />
          <div className="space-y-2 pt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-8 bg-neutral-100/70 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <PageSkeleton />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-surface">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-sm border-b border-neutral-100 px-4 py-2 flex justify-end">
          <NotificationBell />
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-thin">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
