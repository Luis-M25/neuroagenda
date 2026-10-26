'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace(ROUTES.login);
      return;
    }

    const user = getUser();
    if (user?.rol === 'ESPECIALISTA') {
      router.replace(ROUTES.especialista.dashboard);
    } else if (user?.rol === 'PORTERO') {
      router.replace('/portero');
    } else if (user?.rol === 'AUDITOR') {
      router.replace(ROUTES.auditor.dashboard);
    } else if (user?.rol === 'ENFERMERO') {
      router.replace('/enfermero');
    } else {
      router.replace(ROUTES.admin.dashboard);
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  );
}
