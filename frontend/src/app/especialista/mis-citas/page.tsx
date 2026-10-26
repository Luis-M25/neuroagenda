'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { citasApi } from '@/lib/api-client';
import { ROUTES } from '@/lib/routes';
import { ESTADOS_CITA, cn, getEstadoCitaColor, todayStr } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

const ESTADO_ORDEN: Record<string, number> = {
  PENDIENTE: 0, CONFIRMADA: 1, EN_ESPERA: 2, EN_ATENCION: 3, REAGENDADA: 4, NO_ASISTIO: 5, CANCELADA: 6, ATENDIDA: 7,
};

export default function MisCitasPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState(searchParams.get('estado') || '');
  const [filtroFecha, setFiltroFecha] = useState('');

  const load = async () => {
    try {
      const data = await citasApi.getAll();
      setCitas(data);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const hoy = todayStr();

  const filtered = useMemo(() => {
    return citas
      .filter(c => !filtro || c.estado === filtro)
      .filter(c => !filtroFecha || c.fecha?.slice(0, 10) === filtroFecha)
      .sort((a, b) => {
        const fa = a.fecha?.slice(0, 10) || '';
        const fb = b.fecha?.slice(0, 10) || '';
        if (fa !== fb) return fa.localeCompare(fb);
        const oa = ESTADO_ORDEN[a.estado] ?? 99;
        const ob = ESTADO_ORDEN[b.estado] ?? 99;
        if (oa !== ob) return oa - ob;
        return (a.horaInicio || '').localeCompare(b.horaInicio || '');
      });
  }, [citas, filtro, filtroFecha]);

  const ESTADOS_FILTRO = [
    { value: '', label: 'Todas' },
    ...ESTADOS_CITA,
  ];

  function formatCitaFecha(fecha: string): string {
    const d = new Date(fecha);
    const dias = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Mis Citas" />

      <div className="flex gap-2 overflow-x-auto pb-2 flex-wrap items-center">
        {ESTADOS_FILTRO.map(e => (
          <button key={e.value} onClick={() => setFiltro(e.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filtro === e.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {e.label || 'Todas'}
          </button>
        ))}
        <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)}
          className="px-4 py-2 rounded-full text-sm border bg-white ml-auto"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-neutral-100 p-3 flex items-center gap-3 animate-pulse">
              <div className="w-14 h-10 bg-neutral-100 rounded-lg shrink-0" />
              <div className="w-24 h-4 bg-neutral-100 rounded shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-100 rounded w-1/3" />
                <div className="h-3 bg-neutral-100 rounded w-1/2" />
              </div>
              <div className="w-20 h-6 bg-neutral-100 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">No se encontraron citas</p>
          <p className="text-sm text-gray-400 mt-1">Selecciona otro filtro o fecha</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered.map(cita => {
            const fechaStr = cita.fecha?.slice(0, 10) || '';
            const esHoy = fechaStr === hoy;
            return (
              <button key={cita.id} onClick={() => router.push(ROUTES.especialista.atencion(cita.id))}
                className={cn(
                  'bg-white rounded-xl border p-3 hover:shadow-md transition-shadow text-left flex items-center gap-3 w-full h-[68px]',
                  cita.estado === 'PENDIENTE' ? 'border-l-4 border-l-yellow-400 bg-yellow-50/20' :
                  cita.estado === 'CONFIRMADA' ? 'border-l-4 border-l-blue-400 bg-blue-50/20' :
                  cita.estado === 'EN_ESPERA' ? 'border-l-4 border-l-purple-400 bg-purple-50/20' :
                  cita.estado === 'EN_ATENCION' ? 'border-l-4 border-l-green-400 bg-green-50/20' :
                  cita.estado === 'ATENDIDA' ? 'border-l-4 border-l-gray-300 bg-gray-50/40' :
                  cita.estado === 'CANCELADA' ? 'border-l-4 border-l-red-400 bg-red-50/20' :
                  cita.estado === 'NO_ASISTIO' ? 'border-l-4 border-l-orange-400 bg-orange-50/20' :
                  'border-l-4 border-l-gray-200'
                )}>
                <div className={cn('w-14 shrink-0 text-center rounded-lg py-1.5', esHoy ? 'bg-primary-50 ring-1 ring-primary-200' : 'bg-neutral-50')}>
                  <span className={cn('text-sm font-bold font-mono', esHoy ? 'text-primary-600' : 'text-neutral-700')}>{cita.horaInicio?.slice(0, 5)}</span>
                </div>
                <span className="text-xs font-medium text-neutral-500 w-[95px] shrink-0 truncate">{formatCitaFecha(cita.fecha)}</span>
                <div className="flex-1 min-w-0 pr-2">
                  <p className="font-semibold text-sm text-neutral-900 truncate" title={`${cita.paciente?.nombres} ${cita.paciente?.apellidos}`}>
                    {cita.paciente?.nombres} {cita.paciente?.apellidos}
                  </p>
                  <p className="text-xs text-neutral-400 truncate mt-0.5" title={`${cita.especialidad} · ${cita.lugar || ''}${cita.motivo ? ` · ${cita.motivo}` : ''}`}>
                    {cita.especialidad} · {cita.lugar || 'Consultorio'}{cita.motivo ? ` · ${cita.motivo}` : ''}
                  </p>
                </div>
                <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium shrink-0 whitespace-nowrap', getEstadoCitaColor(cita.estado))}>
                  {ESTADOS_CITA.find(e => e.value === cita.estado)?.label || cita.estado}
                </span>
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
}
