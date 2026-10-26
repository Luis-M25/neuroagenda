'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/routes';

export default function HcePage() {
  const router = useRouter();
  useEffect(() => { router.replace(ROUTES.admin.hceEspecialistas); }, [router]);
  return null;
}
