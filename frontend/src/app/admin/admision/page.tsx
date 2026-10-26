'use client';

import { useEffect, useState, useCallback } from 'react';
import { citasApi, pacientesApi } from '@/lib/api-client';
import { cn, formatDate, getEstadoCitaColor, todayStr } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import {
  Search, User, Clock, CalendarDays, Filter, CheckCircle2,
  AlertTriangle, Users, Stethoscope, X,
} from 'lucide-react';

export default function AdmisionPage() {
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEspecialidad, setFilterEspecialidad] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ hoy: 0, enEspera: 0, enAtencion: 0, pendientes: 0, atendidas: 0 });

  const today = todayStr();
  const especialidades = Array.from(new Set(citas.map((c: any) => c.especialidad).filter(Boolean))) as string[];

  const loadCitas = useCallback(() => {
    setLoading(true);
    citasApi.getAll({ fechaInicio: today, fechaFin: today })
      .then((res: any) => {
        const list = Array.isArray(res) ? res : [];
        setCitas(list);
        setStats({
          hoy: list.length,
          enEspera: list.filter((c: any) => c.estado === 'EN_ESPERA').length,
          enAtencion: list.filter((c: any) => c.estado === 'EN_ATENCION').length,
          pendientes: list.filter((c: any) => c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA').length,
          atendidas: list.filter((c: any) => c.estado === 'ATENDIDA').length,
        });
      })
      .catch((e: any) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [today]);

  useEffect(() => { loadCitas(); }, [loadCitas]);

  const handleEstado = async (citaId: string, estado: string) => {
    setUpdatingId(citaId);
    try {
      await citasApi.updateEstado(citaId, { estado } as any);
      toast.success(`Cita marcada como ${estado.replace(/_/g, ' ')}`);
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
      || (c.paciente?.numeroIdentificacion || '').includes(s)
      || (c.especialista?.nombres || '').toLowerCase().includes(s);
    const matchEsp = !filterEspecialidad || c.especialidad === filterEspecialidad;
    const matchEst = !filterEstado || c.estado === filterEstado;
    return matchSearch && matchEsp && matchEst;
  }).sort((a: any, b: any) => (a.horaInicio || '').localeCompare(b.horaInicio || ''));

  return (
    <div className="space-y-6">
      <PageHeader title="Admisión" description="Gestión de admisión de pacientes — citas del día" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{stats.hoy}</p>
          <p className="text-xs text-neutral-500">Citas hoy</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.pendientes}</p>
          <p className="text-xs text-neutral-500">Pendientes</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.enEspera}</p>
          <p className="text-xs text-neutral-500">En espera</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.enAtencion}</p>
          <p className="text-xs text-neutral-500">En atención</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-neutral-600">{stats.atendidas}</p>
          <p className="text-xs text-neutral-500">Atendidas</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input type="text" placeholder="Buscar paciente o especialista..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500" />
          </div>
          <select value={filterEspecialidad} onChange={(e) => setFilterEspecialidad(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-xl bg-white">
            <option value="">Todas las especialidades</option>
            {especialidades.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-xl bg-white">
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="CONFIRMADA">Confirmada</option>
            <option value="EN_ESPERA">En espera</option>
            <option value="EN_ATENCION">En atención</option>
            <option value="ATENDIDA">Atendida</option>
          </select>
        </div>
      </Card>

      {/* List */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<CalendarDays size={32} />} title="Sin citas para hoy"
            description="No hay citas programadas para el día de hoy con los filtros seleccionados." />
        ) : (
          <div className="divide-y">
            {filtered.map((c: any) => (
              <div key={c.id} className={cn(
                'p-4 flex items-start gap-4 hover:bg-neutral-50 transition-colors',
                c.estado === 'EN_ATENCION' && 'bg-green-50/50',
                c.estado === 'EN_ESPERA' && 'bg-purple-50/50',
              )}>
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold shrink-0">
                  {c.paciente?.nombres?.[0]}{c.paciente?.apellidos?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-neutral-900">
                      {c.paciente?.nombres} {c.paciente?.apellidos}
                    </span>
                    <span className="text-xs text-neutral-400">{c.paciente?.numeroIdentificacion}</span>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getEstadoCitaColor(c.estado))}>
                      {c.estado?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                    <span className="flex items-center gap-1"><Clock size={12} /> {c.horaInicio?.slice(0, 5)} - {c.horaFin?.slice(0, 5)}</span>
                    <span className="flex items-center gap-1"><Stethoscope size={12} /> {c.especialidad}</span>
                    <span className="flex items-center gap-1"><User size={12} /> {c.especialista?.nombres} {c.especialista?.apellidos}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {(c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA') && (
                    <Button onClick={() => handleEstado(c.id, 'EN_ESPERA')} disabled={updatingId === c.id}
                      size="sm" variant="outline">
                      {updatingId === c.id ? '...' : 'Espera'}
                    </Button>
                  )}
                  {c.estado === 'EN_ESPERA' && (
                    <Button onClick={() => handleEstado(c.id, 'EN_ATENCION')} disabled={updatingId === c.id}
                      size="sm" variant="primary">
                      {updatingId === c.id ? '...' : 'Atender'}
                    </Button>
                  )}
                  {c.estado === 'EN_ATENCION' && (
                    <Button onClick={() => handleEstado(c.id, 'ATENDIDA')} disabled={updatingId === c.id}
                      size="sm" variant="primary">
                      {updatingId === c.id ? '...' : 'Finalizar'}
                    </Button>
                  )}
                  {(c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA') && (
                    <Button onClick={() => handleEstado(c.id, 'CANCELADA')} disabled={updatingId === c.id}
                      size="sm" variant="danger">
                      {updatingId === c.id ? '...' : 'Cancelar'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
