'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { citasApi, hceApi } from '@/lib/api-client';
import type { DerivacionHCE } from '@/lib/api/hce.api';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { todayStr } from '@/lib/utils';
import {
  CalendarDays, CheckCircle2, Clock, Search, Share2, Stethoscope, X,
} from 'lucide-react';

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function addMinutes(hora: string, minutos: number) {
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m + minutos;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function fmtFecha(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
}

function prioridadBadge(prioridad: string) {
  if (prioridad === 'ALTA') return 'bg-red-100 text-red-700 border-red-200';
  if (prioridad === 'MEDIA') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-neutral-100 text-neutral-600 border-neutral-200';
}

export default function DerivacionesPage() {
  const [derivaciones, setDerivaciones] = useState<DerivacionHCE[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('');
  const [filterPrioridad, setFilterPrioridad] = useState('');
  const [search, setSearch] = useState('');

  const [seleccion, setSeleccion] = useState<{ derivacion: DerivacionHCE; destino: DerivacionHCE['destinos'][number] } | null>(null);
  const [fecha, setFecha] = useState(addDays(todayStr(), 1));
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [duracion, setDuracion] = useState('30');
  const [lugar, setLugar] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    hceApi.getDerivaciones({
      estado: filterEstado || undefined,
      prioridad: filterPrioridad || undefined,
    })
      .then((res) => setDerivaciones(Array.isArray(res) ? res : []))
      .catch((e: any) => toast.error(e.message || 'No se pudieron cargar las derivaciones'))
      .finally(() => setLoading(false));
  }, [filterEstado, filterPrioridad]);

  useEffect(() => { load(); }, [load]);

  const filtradas = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return derivaciones;
    return derivaciones.filter((d) => {
      const paciente = `${d.paciente?.nombres || ''} ${d.paciente?.apellidos || ''} ${d.paciente?.numeroIdentificacion || ''}`.toLowerCase();
      const destino = d.destinos.map((x) => `${x.especialista?.nombres || ''} ${x.especialista?.apellidos || ''} ${x.especialidad}`).join(' ').toLowerCase();
      return paciente.includes(q) || destino.includes(q) || d.motivo.toLowerCase().includes(q);
    });
  }, [derivaciones, search]);

  const stats = useMemo(() => ({
    total: derivaciones.length,
    pendientes: derivaciones.filter((d) => d.estado === 'PENDIENTE').length,
    enProceso: derivaciones.filter((d) => d.estado === 'EN_PROCESO').length,
    programadas: derivaciones.filter((d) => d.estado === 'PROGRAMADA').length,
  }), [derivaciones]);

  const abrirProgramar = (derivacion: DerivacionHCE, destino: DerivacionHCE['destinos'][number]) => {
    setSeleccion({ derivacion, destino });
    setFecha(addDays(todayStr(), 1));
    setHoraInicio('09:00');
    setDuracion('30');
    setLugar(destino.especialista?.consultorioPredeterminado || destino.especialista?.sede || 'Consultorio');
  };

  const programar = async () => {
    if (!seleccion) return;
    if (!fecha || !horaInicio) {
      toast.error('Complete la fecha y la hora');
      return;
    }
    if (!lugar.trim()) {
      toast.error('Indique el lugar o consultorio');
      return;
    }
    setSaving(true);
    try {
      const minutos = Number(duracion) || 30;
      const cita: any = await citasApi.create({
        especialistaId: seleccion.destino.especialista!.id,
        pacienteId: seleccion.derivacion.pacienteId,
        fecha,
        horaInicio,
        horaFin: addMinutes(horaInicio, minutos),
        duracionMinutos: minutos,
        especialidad: seleccion.destino.especialidad,
        lugar: lugar.trim(),
        motivo: seleccion.derivacion.motivo,
        tipo: 'EVALUACION',
      } as any);
      await hceApi.programarDerivacion(seleccion.destino.id, cita.id);
      toast.success('Cita programada y vinculada a la derivación');
      setSeleccion(null);
      load();
    } catch (e: any) {
      toast.error(e.message || 'No se pudo programar la cita');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Derivaciones"
        description="Pacientes derivados por especialistas. Programe las citas y dé seguimiento."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{stats.total}</p>
          <p className="text-xs text-neutral-500">Total</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.pendientes}</p>
          <p className="text-xs text-neutral-500">Pendientes</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.enProceso}</p>
          <p className="text-xs text-neutral-500">En proceso</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.programadas}</p>
          <p className="text-xs text-neutral-500">Programadas</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar paciente, especialista o motivo..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-xl bg-white"
          >
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="PROGRAMADA">Programada</option>
          </select>
          <select
            value={filterPrioridad}
            onChange={(e) => setFilterPrioridad(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-xl bg-white"
          >
            <option value="">Todas las prioridades</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Media</option>
            <option value="BAJA">Baja</option>
          </select>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-neutral-400">Cargando derivaciones...</div>
      ) : filtradas.length === 0 ? (
        <EmptyState
          icon={<Share2 size={24} />}
          title="Sin derivaciones"
          description="No hay derivaciones que coincidan con los filtros seleccionados."
        />
      ) : (
        <div className="space-y-3">
          {filtradas.map((d) => (
            <Card key={d.id} className="p-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold shrink-0">
                  {d.paciente?.nombres?.[0]}{d.paciente?.apellidos?.[0]}
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-neutral-900">
                      {d.paciente?.nombres} {d.paciente?.apellidos}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${prioridadBadge(d.prioridad)}`}>
                      {d.prioridad}
                    </span>
                    <Badge variant={d.estado === 'PROGRAMADA' ? 'success' : d.estado === 'EN_PROCESO' ? 'info' : 'warning'}>
                      {d.estado.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {d.paciente?.numeroIdentificacion} · {d.paciente?.telefono || 'Sin teléfono'} · Derivado el {fmtFecha(d.createdAt)}
                  </p>
                  <p className="text-sm text-neutral-700 mt-2">{d.motivo}</p>
                  {d.observacion && <p className="text-xs text-neutral-500 mt-1">{d.observacion}</p>}
                  <p className="text-xs text-neutral-500 mt-1.5">
                    Origen: {d.especialistaOrigen ? `${d.especialistaOrigen.nombres} ${d.especialistaOrigen.apellidos} — ${d.especialistaOrigen.especialidad}` : 'Administración'}
                  </p>
                </div>
              </div>

              <div className="mt-3 border-t pt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                {d.destinos.map((dest) => (
                  <div key={dest.id} className="rounded-xl border bg-neutral-50/60 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Stethoscope size={14} className="text-primary-600" />
                      <span className="text-sm font-medium text-neutral-800">
                        {dest.especialista ? `${dest.especialista.nombres} ${dest.especialista.apellidos}` : dest.especialidad}
                      </span>
                      <span className="text-[11px] text-neutral-500">{dest.especialidad}</span>
                      <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${dest.estado === 'PROGRAMADA' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {dest.estado}
                      </span>
                    </div>
                    {dest.especialista?.sede && (
                      <p className="text-[11px] text-neutral-500 mt-1">
                        {dest.especialista.sede}{dest.especialista.consultorioPredeterminado ? ` · ${dest.especialista.consultorioPredeterminado}` : ''}
                      </p>
                    )}
                    {dest.cita ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-2 py-1.5">
                        <CheckCircle2 size={13} />
                        <CalendarDays size={13} /> {fmtFecha(dest.cita.fecha)}
                        <Clock size={13} /> {dest.cita.horaInicio}
                        <span className="text-[10px] uppercase">{dest.cita.estado}</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => abrirProgramar(d, dest)}
                      >
                        <CalendarDays size={13} className="mr-1" /> Programar cita
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {seleccion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Programar cita de derivación</h2>
                <p className="text-xs text-neutral-500">
                  {seleccion.derivacion.paciente?.nombres} {seleccion.derivacion.paciente?.apellidos} → {seleccion.destino.especialidad}
                </p>
              </div>
              <button onClick={() => setSeleccion(null)} className="p-1.5 hover:bg-neutral-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Fecha *</label>
                  <input type="date" value={fecha} min={todayStr()} onChange={(e) => setFecha(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Hora inicio *</label>
                  <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Duración (min)</label>
                  <select value={duracion} onChange={(e) => setDuracion(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                    {[15, 20, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} minutos</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Hora fin</label>
                  <input readOnly value={addMinutes(horaInicio || '09:00', Number(duracion) || 30)} className="w-full border rounded-lg px-3 py-2 text-sm bg-neutral-50" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Lugar / consultorio *</label>
                <input value={lugar} onChange={(e) => setLugar(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Consultorio" />
              </div>
              <p className="text-[11px] text-neutral-400">
                La cita se validará contra el horario y la disponibilidad del especialista. Si el horario no está disponible, el sistema mostrará el motivo.
              </p>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t bg-neutral-50 rounded-b-2xl">
              <Button variant="outline" onClick={() => setSeleccion(null)}>Cancelar</Button>
              <Button onClick={programar} disabled={saving}>
                {saving ? 'Programando...' : 'Programar cita'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
