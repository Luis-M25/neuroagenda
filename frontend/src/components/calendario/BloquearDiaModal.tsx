'use client';

import { useState, useMemo, useEffect } from 'react';
import { calendarioApi, especialistasApi, citasApi, ApiError } from '@/lib/api-client';
import { toast } from 'sonner';
import { cn, formatDate, getEstadoCitaColor } from '@/lib/utils';
import {
  X, CalendarDays, ShieldAlert, AlertCircle, CheckSquare, Square,
  Search, Stethoscope, Users, CheckCircle2, CalendarClock, Trash2, Ban,
} from 'lucide-react';

interface CitaPendiente {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado?: string;
  paciente: { nombres: string; apellidos: string };
  especialista: { nombres: string; apellidos: string };
}

interface Props {
  fecha: string;
  especialistas: any[];
  onClose: () => void;
  onComplete: () => void;
  onReagendar: () => void;
}

function getEsp(e: any) { return e.especialista || e; }
function getEspId(e: any) { return e.especialista?.id || e.id; }

function fechaLabel(fecha: string): string {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function BloquearDiaModal({ fecha, especialistas, onClose, onComplete, onReagendar }: Props) {
  const [mode, setMode] = useState<'completo' | 'especialistas'>('completo');
  const [citasPorEspecialista, setCitasPorEspecialista] = useState<Record<string, number>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [especialidadFilter, setEspecialidadFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [citasPendientes, setCitasPendientes] = useState<CitaPendiente[] | null>(null);
  const [yaBloqueado, setYaBloqueado] = useState(false);

  const especialidades = useMemo(() => {
    const set = new Set<string>();
    for (const e of especialistas) {
      const esp = getEsp(e);
      if (esp.especialidad) set.add(esp.especialidad);
    }
    return Array.from(set).sort();
  }, [especialistas]);

  const especialistasFiltrados = useMemo(() => {
    return especialistas.filter((e) => {
      const esp = getEsp(e);
      const nombre = `${esp.nombres || ''} ${esp.apellidos || ''}`.toLowerCase();
      const matchNombre = nombre.includes(search.toLowerCase());
      const matchEspecialidad = !especialidadFilter || esp.especialidad === especialidadFilter;
      return matchNombre && matchEspecialidad;
    });
  }, [especialistas, search, especialidadFilter]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [data, bloqueos] = await Promise.all([
          citasApi.getAll({ fechaInicio: fecha, fechaFin: fecha }),
          calendarioApi.getDiasBloqueados(fecha, fecha),
        ]);
        const map: Record<string, number> = {};
        for (const c of data) {
          if (!['CANCELADA', 'REAGENDADA', 'ATENDIDA', 'NO_ASISTIO', 'EN_ATENCION'].includes(c.estado)) {
            const espId = c.especialista?.id || c.especialistaId;
            if (espId) map[espId] = (map[espId] || 0) + 1;
          }
        }
        setCitasPorEspecialista(map);

        if (Array.isArray(bloqueos) && bloqueos.length > 0) {
          setYaBloqueado(true);
          setDescripcion(bloqueos[0].motivo || '');
        }
      } catch {
        setCitasPorEspecialista({});
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fecha]);

  const toggleEspecialista = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setCitasPendientes(null);
  };

  const marcarTodos = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const e of especialistasFiltrados) next.add(getEspId(e));
      return next;
    });
    setCitasPendientes(null);
  };

  const desmarcarTodos = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const e of especialistasFiltrados) next.delete(getEspId(e));
      return next;
    });
    setCitasPendientes(null);
  };

  const todosMarcados = especialistasFiltrados.length > 0 && especialistasFiltrados.every((e) => selectedIds.has(getEspId(e)));
  const selectedEspecialistas = especialistas.filter((e) => selectedIds.has(getEspId(e)));
  const totalCitasSeleccionadas = selectedEspecialistas.reduce((acc, e) => acc + (citasPorEspecialista[getEspId(e)] || 0), 0);

  const handleBloquearDiaCompleto = async (cancelarCitas = false) => {
    if (!descripcion.trim()) {
      toast.error('Ingrese un motivo para el bloqueo');
      return;
    }
    setSaving(true);
    try {
      const result = await calendarioApi.bloquearDia({
        fecha,
        motivo: descripcion.trim(),
        cancelarCitas,
      });

      if (result?.requiereAccion) {
        setCitasPendientes(result.citasAfectadas);
        toast.warning(result.mensaje);
        return;
      }

      toast.success('Día bloqueado correctamente');
      onComplete();
    } catch (e: any) {
      toast.error(e instanceof ApiError ? e.data?.message || e.message : e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBloquearEspecialistas = async (forzar = false) => {
    if (selectedIds.size === 0) {
      toast.error('Seleccione al menos un especialista');
      return;
    }
    setSaving(true);
    try {
      const body = {
        nombre: `Bloqueo ${fecha}`,
        descripcion: descripcion.trim() || `Bloqueo de día completo: ${fechaLabel(fecha)}`,
        fechaInicio: fecha,
        fechaFin: fecha,
        especialistaIds: Array.from(selectedIds),
        forzar,
      };
      await especialistasApi.createBloqueoGrupal(body);
      toast.success('Especialistas bloqueados correctamente');
      setCitasPendientes(null);
      onComplete();
    } catch (e: any) {
      if (e instanceof ApiError && e.data?.codigo === 'CITAS_PENDIENTES' && Array.isArray(e.data?.citas)) {
        setCitasPendientes(e.data.citas);
      } else {
        toast.error(e instanceof ApiError ? e.data?.message || e.message : e.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancelarYBloquear = async () => {
    if (!citasPendientes || citasPendientes.length === 0) return;
    if (!confirm(`Se cancelarán ${citasPendientes.length} cita(s) pendiente(s). ¿Continuar?`)) return;
    setSaving(true);
    try {
      await Promise.all(citasPendientes.map((c) =>
        citasApi.updateEstado(c.id, { estado: 'CANCELADA', motivoCancelacion: 'Bloqueo de día', canceladaPor: 'ADMIN' }).catch((e) => console.error('Error cancelando cita:', e))
      ));
      if (mode === 'completo') {
        await handleBloquearDiaCompleto(false);
      } else {
        await handleBloquearEspecialistas(false);
      }
    } catch (e: any) {
      toast.error(e instanceof ApiError ? e.data?.message || e.message : e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDesbloquearDia = async () => {
    setSaving(true);
    try {
      const bloqueos = await calendarioApi.getDiasBloqueados(fecha, fecha);
      if (Array.isArray(bloqueos) && bloqueos.length > 0) {
        await calendarioApi.eliminarBloqueo(bloqueos[0].id);
        toast.success('Día desbloqueado');
        onComplete();
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b bg-neutral-50">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
              <ShieldAlert size={18} className="text-primary-600" />
              {yaBloqueado ? 'Día bloqueado' : 'Bloquear día'}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">{fechaLabel(fecha)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-500">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b bg-neutral-50 px-5">
          <button
            onClick={() => { setMode('completo'); setCitasPendientes(null); }}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              mode === 'completo'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-700',
            )}
          >
            <Ban size={16} className="inline mr-1.5" />
            Bloqueo completo del día
          </button>
          <button
            onClick={() => { setMode('especialistas'); setCitasPendientes(null); }}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              mode === 'especialistas'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-700',
            )}
          >
            <Users size={16} className="inline mr-1.5" />
            Bloquear especialistas
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
            </div>
          ) : mode === 'completo' ? (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Bloqueará el día completo para la creación de nuevas citas. Los pacientes no podrán agendar citas en esta fecha.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Motivo del bloqueo</label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Feriado, mantenimiento, capacitación general"
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                  disabled={yaBloqueado}
                />
              </div>

              {yaBloqueado ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">Este día ya está bloqueado</p>
                      <p className="text-xs text-amber-700 mt-1">El día seleccionado tiene un bloqueo activo. Puede desbloquearlo para permitir nuevas citas.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDesbloquearDia}
                    disabled={saving}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50"
                  >
                    {saving ? 'Procesando...' : 'Desbloquear día'}
                  </button>
                </div>
              ) : (
                <div className="flex justify-end pt-2 gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleBloquearDiaCompleto(false)}
                    disabled={!descripcion.trim() || saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    <Ban size={16} />
                    {saving ? 'Bloqueando...' : 'Bloquear día completo'}
                  </button>
                </div>
              )}

              {citasPendientes && Array.isArray(citasPendientes) && citasPendientes.length > 0 && (
                <CitasPendientesAlert
                  citas={citasPendientes}
                  onCancelar={handleCancelarYBloquear}
                  onReagendar={() => { setCitasPendientes(null); onReagendar(); }}
                  saving={saving}
                />
              )}
            </>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Seleccione los especialistas cuya disponibilidad desea bloquear para este día.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Descripción</label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Capacitación, reunión médica"
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={15} />
                  <input
                    type="text"
                    placeholder="Buscar especialista..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-sm"
                  />
                </div>
                <select
                  value={especialidadFilter}
                  onChange={(e) => { setEspecialidadFilter(e.target.value); setCitasPendientes(null); }}
                  className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Todas las especialidades</option>
                  {especialidades.map((esp) => <option key={esp} value={esp}>{esp}</option>)}
                </select>
                <div className="flex gap-2">
                  <button onClick={marcarTodos} className="px-3 py-2 text-xs font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 inline-flex items-center gap-1">
                    <CheckSquare size={14} /> Marcar todos
                  </button>
                  <button onClick={desmarcarTodos} className="px-3 py-2 text-xs font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 inline-flex items-center gap-1">
                    <Square size={14} /> Desmarcar
                  </button>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-50 text-left">
                      <th className="px-4 py-2.5 text-xs font-semibold text-neutral-600 w-10">
                        <button onClick={todosMarcados ? desmarcarTodos : marcarTodos} className="hover:text-primary-600">
                          {todosMarcados ? <CheckSquare size={16} /> : <Square size={16} />}
                        </button>
                      </th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-neutral-600">Especialista</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-neutral-600">Especialidad</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-neutral-600 text-right">Citas pendientes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {especialistasFiltrados.length === 0 && (
                      <tr className="border-t">
                        <td colSpan={4} className="px-4 py-6 text-center text-sm text-neutral-400">
                          No se encontraron especialistas
                        </td>
                      </tr>
                    )}
                    {especialistasFiltrados.map((e) => {
                      const esp = getEsp(e);
                      const id = getEspId(e);
                      const citasCount = citasPorEspecialista[id] || 0;
                      return (
                        <tr key={id} className="border-t hover:bg-neutral-50">
                          <td className="px-4 py-2.5">
                            <button onClick={() => toggleEspecialista(id)}>
                              {selectedIds.has(id) ? (
                                <CheckSquare size={18} className="text-primary-600" />
                              ) : (
                                <Square size={18} className="text-neutral-400" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-2.5 font-medium text-neutral-900">{esp.nombres} {esp.apellidos}</td>
                          <td className="px-4 py-2.5 text-neutral-600">{esp.especialidad || '-'}</td>
                          <td className="px-4 py-2.5 text-right">
                            {citasCount > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">{citasCount}</span>
                            ) : (
                              <span className="text-neutral-400 text-xs">0</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {selectedIds.size > 0 && (
                <div className="bg-neutral-50 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-neutral-700">
                    <Users size={16} className="text-neutral-500" />
                    <span><strong>{selectedIds.size}</strong> especialista(s)</span>
                  </div>
                  {totalCitasSeleccionadas > 0 && (
                    <span className="text-sm text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                      {totalCitasSeleccionadas} cita(s)
                    </span>
                  )}
                </div>
              )}

              {citasPendientes && Array.isArray(citasPendientes) && citasPendientes.length > 0 && (
                <CitasPendientesAlert
                  citas={citasPendientes}
                  onCancelar={handleCancelarYBloquear}
                  onReagendar={() => { setCitasPendientes(null); onReagendar(); }}
                  saving={saving}
                />
              )}

              {(!citasPendientes || citasPendientes.length === 0) && (
                <div className="flex justify-end pt-2 gap-2">
                  <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50">
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleBloquearEspecialistas(false)}
                    disabled={selectedIds.size === 0 || saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle2 size={16} />
                    {saving ? 'Bloqueando...' : 'Bloquear especialistas'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CitasPendientesAlert({
  citas, onCancelar, onReagendar, saving,
}: {
  citas: CitaPendiente[];
  onCancelar: () => void;
  onReagendar: () => void;
  saving: boolean;
}) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-2">
        <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-900">Citas pendientes encontradas</p>
          <p className="text-xs text-amber-700">Hay {citas.length} cita(s) pendiente(s) en el día seleccionado.</p>
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden bg-white max-h-40 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 text-left">
              <th className="px-3 py-2 text-xs font-semibold text-neutral-600">Paciente</th>
              <th className="px-3 py-2 text-xs font-semibold text-neutral-600">Especialista</th>
              <th className="px-3 py-2 text-xs font-semibold text-neutral-600">Hora</th>
              <th className="px-3 py-2 text-xs font-semibold text-neutral-600">Estado</th>
            </tr>
          </thead>
          <tbody>
            {citas.slice(0, 20).map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-3 py-2">{c.paciente?.nombres} {c.paciente?.apellidos}</td>
                <td className="px-3 py-2">{c.especialista?.nombres} {c.especialista?.apellidos}</td>
                <td className="px-3 py-2">{c.horaInicio?.substring(0, 5)} – {c.horaFin?.substring(0, 5)}</td>
                <td className="px-3 py-2">
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium', getEstadoCitaColor(c.estado || ''))}>
                    {c.estado || '—'}
                  </span>
                </td>
              </tr>
            ))}
            {citas.length > 20 && (
              <tr className="border-t">
                <td colSpan={4} className="px-3 py-2 text-center text-xs text-neutral-400">
                  ...y {citas.length - 20} más
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-2">
        <button onClick={onReagendar} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-amber-300 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-100">
          <CalendarClock size={16} /> Reagendar citas primero
        </button>
        <button onClick={onCancelar} disabled={saving} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50">
          <Trash2 size={16} /> {saving ? 'Procesando...' : 'Cancelar citas y bloquear'}
        </button>
      </div>
    </div>
  );
}
