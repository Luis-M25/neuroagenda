'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { citasApi } from '@/lib/api-client';
import { ROUTES } from '@/lib/routes';
import AtencionView from '../../AtencionView';

export default function AtencionCitaPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [cita, setCita] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    citasApi
      .getById(id as string)
      .then((data) => setCita(data))
      .catch((e: any) => {
        toast.error(e.message || 'No se pudo cargar la cita');
        router.replace(ROUTES.especialista.misCitas);
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const volver = () => router.push(ROUTES.especialista.misCitas);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!cita) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 font-medium">Cita no encontrada</p>
        <Link
          href={ROUTES.especialista.misCitas}
          className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 mt-2"
        >
          <ArrowLeft size={14} /> Volver a Mis Citas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href={ROUTES.especialista.misCitas}
        className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
      >
        <ArrowLeft size={14} /> Volver a Mis Citas
      </Link>
      <AtencionView cita={cita} onClose={volver} />
    </div>
  );
}
