'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock } from 'lucide-react';
import { ROUTES } from '@/lib/routes';

/**
 * Ruta legada de "Nueva Consulta".
 *
 * La consulta clínica se registra únicamente desde una cita programada para
 * mantener la trazabilidad cita → consulta → firma → documentos. Esta pantalla
 * se conserva solo para redirigir enlaces antiguos y evitar un formulario HCE
 * paralelo con reglas distintas.
 */
export default function NuevaConsultaRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.especialista.misCitas);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mb-3">
        <CalendarClock size={22} />
      </div>
      <h1 className="font-semibold text-gray-900">La consulta se inicia desde una cita</h1>
      <p className="text-sm text-gray-500 mt-1 max-w-md">
        Para registrar una atención, abra la cita del paciente en Mis Citas.
        Redirigiendo…
      </p>
    </div>
  );
}
