'use client';

import { useEffect, useState, useCallback } from 'react';
import { citasApi } from '@/lib/api-client';
import { cn, formatDate, getEstadoCitaColor, todayStr } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import {
  Search, Clock, CalendarDays, ShieldCheck, LogOut, User,
} from 'lucide-react';

export default function AdminPorteroPage() {
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const today = todayStr();

  const loadCitas = useCallback(() => {
    setLoading(true);
    citasApi.getAll({ fechaInicio: today, fechaFin: today })
      .then((res: any) => setCitas(Array.isArray(res) ? res : []))
      .catch((e: any) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [today]);

  useEffect(() => { loadCitas(); }, [loadCitas]);

  const handleEspera = async (cita: any) => {
    if (cita.estado !== 'PENDIENTE' && cita.estado !== 'CONFIRMADA') {
      toast.error('Solo puede marcar en espera citas pendientes o confirmadas');
      return;
    }
    setUpdatingId(cita.id);
    try {
      await citasApi.updateEstado(cita.id, { estado: 'EN_ESPERA' } as any);
      toast.success('Cita marcada como EN ESPERA');
      loadCitas();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = citas.filter((c: any) => {
    const s = search.toLowerCase();
    const matchSearch = !s
      || (c.paciente?.nombres || '').toLowerCase().includes(s)
      || (c.paciente?.apellidos || '').toLowerCase().includes(s)
      || (c.paciente?.numeroIdentificacion || '').includes(s);
    const matchEst = !filterEstado || c.estado === filterEstado;
    return matchSearch && matchEst;
  }).sort((a: any, b: any) => (a.horaInicio || '').localeCompare(b.horaInicio || ''));

  return (
    <div className="space-y-6">
      <PageHeader title="Control de Portero" description="Verificación de acceso de pacientes — citas del día" />

      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input type="text" placeholder="Buscar por nombre o identificación..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500" />
          </div>
          <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-xl bg-white">
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="CONFIRMADA">Confirmada</option>
            <option value="EN_ESPERA">En espera</option>
            <option value="EN_ATENCION">En atención</option>
            <option value="ATENDIDA">Atendida</option>
            <option value="NO_ASISTIO">No asistió</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            <ShieldCheck size={40} className="mx-auto mb-3 text-neutral-300" />
            <p className="font-medium">Sin citas para hoy</p>
            <p className="text-sm mt-1">No se encontraron citas para el día de hoy con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((c: any) => (
              <div key={c.id} className={cn(
                'p-4 flex items-start gap-4 hover:bg-neutral-50 transition-colors',
                c.estado === 'EN_ESPERA' && 'bg-green-50/50 border-l-4 border-l-green-400',
                c.estado === 'EN_ATENCION' && 'bg-blue-50/50 border-l-4 border-l-blue-400',
                (c.estado === 'CANCELADA' || c.estado === 'NO_ASISTIO') && 'opacity-60',
              )}>
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold shrink-0">
                  {c.paciente?.nombres?.[0]}{c.paciente?.apellidos?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{c.paciente?.nombres} {c.paciente?.apellidos}</span>
                    <span className="text-xs text-neutral-400">{c.paciente?.numeroIdentificacion}</span>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getEstadoCitaColor(c.estado))}>
                      {c.estado?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                    <span className="flex items-center gap-1"><Clock size={12} /> {c.horaInicio?.slice(0, 5)} - {c.horaFin?.slice(0, 5)}</span>
                    {c.consultorio && <span>Consultorio: {c.consultorio}</span>}
                  </div>
                </div>
                <div className="shrink-0">
                  {c.estado === 'EN_ESPERA' ? (
                    <span className="text-xs font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded-lg">En espera ✓</span>
                  ) : (c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA') ? (
                    <Button onClick={() => handleEspera(c)} disabled={updatingId === c.id} size="sm">
                      {updatingId === c.id ? '...' : 'Marcar EN ESPERA'}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
