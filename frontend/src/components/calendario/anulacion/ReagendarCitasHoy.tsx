'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { cn, getEstadoCitaColor, ESTADOS_CITA } from '@/lib/utils';
import { citasApi, horariosApi } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  ArrowLeft, CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, Clock, Search, User, Stethoscope,
} from 'lucide-react';
import { WeeklySlotPicker, getWeekDates, type SlotCell, type SelectedSlot } from '@/components/calendario/WeeklySlotPicker';
import FiltrosEspecialidadEspecialista, { type EspecialistaConCitas } from './FiltrosEspecialidadEspecialista';
import ListaCitasReagendar, { type CitaItem, type CitaConReagendamiento, type EstadoReagendamiento } from './ListaCitasReagendar';
import DialogoResumen from './DialogoResumen';

interface CitaDia {
  id: string;
  paciente: string;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  especialidad: string;
  estado: string;
  especialistaId: string;
  especialista: string;
}

interface Slot {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  estado: 'DISPONIBLE' | 'OCUPADO' | 'NO_LABORAL' | 'FERIADO';
}

interface Props {
  fecha: string;
  allCitas: CitaDia[];
  especialistas: any[];
  onBack: () => void;
  onComplete: () => void;
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function horaLabel(hora: string): string {
  return hora?.substring(0, 5) || hora;
}

function getEsp(item: any): any {
  return item.especialista || item;
}

export default function ReagendarCitasHoy({ fecha, allCitas, especialistas, onBack, onComplete }: Props) {
  const [selectedEspecialidades, setSelectedEspecialidades] = useState<Set<string>>(new Set());
  const [selectedEspIds, setSelectedEspIds] = useState<Set<string>>(new Set());
  const [selectedSlots, setSelectedSlots] = useState<Record<string, SelectedSlot>>({});
  const [weekOffset, setWeekOffset] = useState(0);
  const [slotsPorFecha, setSlotsPorFecha] = useState<Record<string, SlotCell[]>>({});
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [step, setStep] = useState<'reagendar' | 'resumen'>('reagendar');
  const [procesando, setProcesando] = useState(false);
  const [citasConEstado, setCitasConEstado] = useState<CitaConReagendamiento[]>([]);
  const [selectedCitaId, setSelectedCitaId] = useState<string | null>(null);

  const selectedEspIdsKey = useMemo(() => Array.from(selectedEspIds).sort().join(','), [selectedEspIds]);

  const dates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const weekLabel = useMemo(() => {
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${dates[0].toLocaleDateString('es-EC', opts)} – ${dates[4].toLocaleDateString('es-EC', { ...opts, year: 'numeric' })}`;
  }, [dates]);

  const especialistasConCitas: EspecialistaConCitas[] = useMemo(() => {
    const map = new Map<string, { id: string; nombre: string; especialidad: string; citas: number; numeroIdentificacion?: string }>();
    // Primero incluir TODOS los especialistas (con citas=0)
    for (const item of especialistas) {
      const esp = getEsp(item);
      if (!esp.id) continue;
      map.set(esp.id, {
        id: esp.id,
        nombre: `${esp.nombres || ''} ${esp.apellidos || ''}`.trim(),
        especialidad: esp.especialidad || '-',
        citas: 0,
        numeroIdentificacion: esp.numeroIdentificacion,
      });
    }
    // Contar citas por especialista
    for (const c of allCitas) {
      if (map.has(c.especialistaId)) {
        map.get(c.especialistaId)!.citas += 1;
      }
    }
    return Array.from(map.values()).sort((a, b) => b.citas - a.citas || a.nombre.localeCompare(b.nombre));
  }, [allCitas, especialistas]);

  const especialidades = useMemo(() => {
    const set = new Set<string>();
    for (const e of especialistasConCitas) {
      if (e.especialidad) set.add(e.especialidad);
    }
    return Array.from(set).sort();
  }, [especialistasConCitas]);

  const citasFiltradas = useMemo(() => {
    if (selectedEspIds.size === 0) return allCitas;
    return allCitas.filter((c) => selectedEspIds.has(c.especialistaId));
  }, [allCitas, selectedEspIds]);

  useEffect(() => {
    const nuevo: CitaConReagendamiento[] = citasFiltradas.map((c) => {
      const existing = citasConEstado.find((ce) => ce.cita.id === c.id);
      if (existing) return existing;
      const citaItem: CitaItem = {
        id: c.id,
        paciente: c.paciente,
        horaInicio: c.horaInicio,
        horaFin: c.horaFin,
        especialista: c.especialista,
        especialistaId: c.especialistaId,
        especialidad: c.especialidad,
        estado: c.estado,
      };
      return { cita: citaItem, estadoReagendamiento: 'pendiente' as EstadoReagendamiento };
    });

    const ids = citasFiltradas.map((c) => c.id);
    const cleaned = nuevo.filter((ce) => ids.includes(ce.cita.id));

    const cleanedSlots: Record<string, SelectedSlot> = {};
    for (const id of ids) {
      if (selectedSlots[id]) cleanedSlots[id] = selectedSlots[id];
    }
    setCitasConEstado(cleaned);
    setSelectedSlots(cleanedSlots);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- derivado de citasFiltradas
  }, [citasFiltradas]);

  useEffect(() => {
    if (selectedEspIdsKey) {
      loadSlotsForWeek();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadSlotsForWeek se redefine en el render
  }, [weekOffset, selectedEspIdsKey, selectedCitaId]);

  useEffect(() => {
    if (!selectedCitaId) return;
    const cita = citasConEstado.find(c => c.cita.id === selectedCitaId);
    if (!cita) return;
    const citaDate = new Date(fecha + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((citaDate.getTime() - today.getTime()) / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    setWeekOffset(diffWeeks);
  }, [selectedCitaId, fecha, citasConEstado]);

  const loadSlotsForWeek = async () => {
    const newSlots: Record<string, SlotCell[]> = {};
    const citaSeleccionada = citasConEstado.find(c => c.cita.id === selectedCitaId);
    const targetEspId = citaSeleccionada?.cita.especialistaId || Array.from(selectedEspIds)[0];
    if (!targetEspId) return;

    try {
      const esp = getEsp(especialistas.find((e: any) => getEsp(e).id === targetEspId) || {});
      const diasLaborales = esp?.horarios?.map((h: any) => h.diaSemana) || [1, 2, 3, 4, 5];
      setWorkingDays(diasLaborales.length ? diasLaborales : [1, 2, 3, 4, 5]);

      const espName = especialistasConCitas.find(e => e.id === targetEspId)?.nombre || '';

      for (const d of dates) {
        const dk = fmtDate(d);
        try {
          const slots = await horariosApi.getDisponibles(targetEspId, dk);
          const cells: SlotCell[] = (slots || []).map((s: Slot) => ({
            fecha: s.fecha,
            horaInicio: s.horaInicio,
            horaFin: s.horaFin,
            duracionMinutos: s.duracionMinutos,
            estado:
              s.estado === 'DISPONIBLE' ? 'disponible' as const
              : s.estado?.startsWith('OCUPADO') ? 'ocupado' as const
              : s.estado === 'FERIADO' ? 'feriado' as const
              : 'no_laboral' as const,
            ocupadoPor: s.estado?.startsWith('OCUPADO') ? espName : undefined,
          }));
          newSlots[dk] = cells.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
        } catch {
          newSlots[dk] = [];
        }
      }

      for (const cita of citasConEstado) {
        if (cita.cita.id === selectedCitaId && cita.estadoReagendamiento === 'pendiente') {
          const dk = fecha;
          if (!newSlots[dk]) newSlots[dk] = [];
          // Eliminar cualquier slot existente con la misma horaInicio y reemplazar con seleccionado
          newSlots[dk] = newSlots[dk].filter(s => s.horaInicio !== cita.cita.horaInicio);
          newSlots[dk].push({
            fecha: dk,
            horaInicio: cita.cita.horaInicio,
            horaFin: cita.cita.horaFin,
            duracionMinutos: 30,
            estado: 'seleccionado',
            ocupadoPor: `${cita.cita.paciente} \u00B7 ${cita.cita.especialista}`,
          });
          newSlots[dk].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
        }
      }
    } catch {
      for (const d of dates) {
        const dk = fmtDate(d);
        if (!newSlots[dk]) newSlots[dk] = [];
      }
    }
    setSlotsPorFecha(newSlots);
  };

  const handleToggleEspecialidad = (name: string) => {
    setSelectedEspecialidades((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
        if (next.size === 0) {
          setSelectedEspIds(new Set());
          return next;
        }
        const newEspIds = new Set(selectedEspIds);
        const toRemove = especialistasConCitas
          .filter((e) => e.especialidad === name)
          .map((e) => e.id);
        for (const id of toRemove) newEspIds.delete(id);
        setSelectedEspIds(newEspIds);
      } else {
        next.add(name);
        const newEspIds = new Set(selectedEspIds);
        const toAdd = especialistasConCitas
          .filter((e) => e.especialidad === name && e.citas > 0)
          .map((e) => e.id);
        for (const id of toAdd) newEspIds.add(id);
        setSelectedEspIds(newEspIds);
      }
      return next;
    });
  };

  const handleToggleEsp = (id: string) => {
    setSelectedEspIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMarcarTodos = () => {
    const list = especialistasConCitas;
    setSelectedEspIds(new Set(list.map((e) => e.id)));
  };

  const handleDesmarcarTodos = () => {
    setSelectedEspIds(new Set());
    setSelectedEspecialidades(new Set());
  };

  const handleSlotClick = (slot: SelectedSlot) => {
    setSelectedSlots((prev) => {
      const next = { ...prev };
      const asignadoA = Object.keys(next).find(
        (citaId) =>
          next[citaId].fecha === slot.fecha && next[citaId].horaInicio === slot.horaInicio,
      );
      if (asignadoA) {
        delete next[asignadoA];
        setCitasConEstado((prev2) =>
          prev2.map((c) =>
            c.cita.id === asignadoA
              ? { ...c, estadoReagendamiento: 'pendiente' as EstadoReagendamiento, nuevaFecha: undefined, nuevaHoraInicio: undefined, nuevaHoraFin: undefined }
              : c,
          ),
        );
        if (selectedCitaId === asignadoA) setSelectedCitaId(null);
        return next;
      }

      const citaTarget = selectedCitaId
        ? citasConEstado.find((c) => c.cita.id === selectedCitaId && c.estadoReagendamiento === 'pendiente' && !next[c.cita.id])
        : null;

      const target = citaTarget || citasConEstado.find(
        (c) => c.estadoReagendamiento === 'pendiente' && !next[c.cita.id],
      );

      if (!target) {
        toast.error('Todas las citas ya tienen horario asignado');
        return next;
      }
      next[target.cita.id] = slot;

      setCitasConEstado((prev2) =>
        prev2.map((c) =>
          c.cita.id === target.cita.id
            ? {
                ...c,
                estadoReagendamiento: 'reagendada' as EstadoReagendamiento,
                nuevaFecha: slot.fecha,
                nuevaHoraInicio: slot.horaInicio,
                nuevaHoraFin: slot.horaFin,
              }
            : c,
        ),
      );

      if (selectedCitaId === target.cita.id) setSelectedCitaId(null);

      return next;
    });
  };

  const handleRemoverSlot = (citaId: string) => {
    setSelectedSlots((prev) => {
      const next = { ...prev };
      delete next[citaId];
      return next;
    });
    setCitasConEstado((prev) =>
      prev.map((c) =>
        c.cita.id === citaId
          ? { ...c, estadoReagendamiento: 'pendiente' as EstadoReagendamiento, nuevaFecha: undefined, nuevaHoraInicio: undefined, nuevaHoraFin: undefined }
          : c,
      ),
    );
  };

  const handleToggleCancelar = (citaId: string) => {
    setCitasConEstado((prev) =>
      prev.map((c) => {
        if (c.cita.id !== citaId) return c;
        if (c.estadoReagendamiento === 'cancelada') {
          return { ...c, estadoReagendamiento: 'pendiente' as EstadoReagendamiento };
        }
        const next = { ...c, estadoReagendamiento: 'cancelada' as EstadoReagendamiento, nuevaFecha: undefined, nuevaHoraInicio: undefined, nuevaHoraFin: undefined };
        const newSlots = { ...selectedSlots };
        delete newSlots[citaId];
        setSelectedSlots(newSlots);
        return next;
      }),
    );
  };

  const handleEditEspecialista = useCallback((citaId: string, nuevoEspId: string) => {
    const nuevoEsp = especialistasConCitas.find((e) => e.id === nuevoEspId);
    if (!nuevoEsp) return;

    setCitasConEstado((prev) =>
      prev.map((c) => {
        if (c.cita.id !== citaId) return c;
        return {
          ...c,
          cita: { ...c.cita, especialistaId: nuevoEsp.id, especialista: nuevoEsp.nombre, especialidad: nuevoEsp.especialidad },
          estadoReagendamiento: 'pendiente' as EstadoReagendamiento,
          nuevaFecha: undefined,
          nuevaHoraInicio: undefined,
          nuevaHoraFin: undefined,
        };
      }),
    );
    setSelectedSlots((prev) => {
      const next = { ...prev };
      delete next[citaId];
      return next;
    });
    if (selectedCitaId === citaId) setSelectedCitaId(null);
  }, [especialistasConCitas, selectedCitaId]);

  const highlightedHour = selectedCitaId
    ? (citasConEstado.find((c) => c.cita.id === selectedCitaId)?.cita.horaInicio || null)
    : null;

  const primeraSinSlot = citasConEstado.find(
    (c) => c.estadoReagendamiento === 'pendiente' && !selectedSlots[c.cita.id],
  );

  const handleVerResumen = () => {
    if (selectedEspIds.size === 0) {
      toast.error('Seleccione al menos un especialista');
      return;
    }
    setStep('resumen');
  };

  const handleAplicarCambios = async () => {
    const reagendadas = citasConEstado.filter((c) => c.estadoReagendamiento === 'reagendada' && c.nuevaFecha);
    const canceladas = citasConEstado.filter((c) => c.estadoReagendamiento === 'cancelada');

    if (reagendadas.length === 0 && canceladas.length === 0) {
      toast.error('No hay cambios para aplicar');
      return;
    }

    setProcesando(true);
    try {
      await Promise.all([
        ...reagendadas.map((p) =>
          citasApi
            .update(p.cita.id, {
              fecha: p.nuevaFecha,
              horaInicio: p.nuevaHoraInicio,
              horaFin: p.nuevaHoraFin,
              notasModificacion: `Reagendada desde ${fecha}`,
            })
            .catch((e: any) => toast.error(`Error en ${p.cita.paciente}: ${e.message}`)),
        ),
        ...canceladas.map((c) =>
          citasApi
            .updateEstado(c.cita.id, {
              estado: 'CANCELADA',
              motivoCancelacion: 'Día no laborable',
              canceladaPor: 'ADMIN',
            })
            .catch((e) => console.error('Error cancelando cita:', e)),
        ),
      ]);
      toast.success(`${reagendadas.length} citas reagendadas, ${canceladas.length} canceladas`);
      onComplete();
    } catch (e: any) {
      toast.error(e.message || 'Error al aplicar cambios');
    } finally {
      setProcesando(false);
    }
  };

  const handleCancelarPendientes = () => {
    setCitasConEstado((prev) =>
      prev.map((c) =>
        c.estadoReagendamiento === 'pendiente'
          ? { ...c, estadoReagendamiento: 'cancelada' as EstadoReagendamiento }
          : c,
      ),
    );
    setStep('reagendar');
  };

  const reagendadas = citasConEstado.filter((c) => c.estadoReagendamiento === 'reagendada' && c.nuevaFecha);
  const canceladas = citasConEstado.filter((c) => c.estadoReagendamiento === 'cancelada');
  const pendientes = citasConEstado.filter((c) => c.estadoReagendamiento === 'pendiente');

  return (
    <div className="space-y-4">
      {step === 'reagendar' && (
        <>
          <FiltrosEspecialidadEspecialista
            especialidades={especialidades}
            especialistas={especialistasConCitas}
            selectedEspecialidades={selectedEspecialidades}
            selectedEspIds={selectedEspIds}
            onToggleEspecialidad={handleToggleEspecialidad}
            onToggleEsp={handleToggleEsp}
            onMarcarTodos={handleMarcarTodos}
            onDesmarcarTodos={handleDesmarcarTodos}
          />

          {selectedEspIds.size > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-4 max-h-[500px]">
                <ListaCitasReagendar
                  citas={citasConEstado}
                  onToggleCancelar={handleToggleCancelar}
                  onRemoverSlot={handleRemoverSlot}
                  onSelectCita={setSelectedCitaId}
                  onEditEspecialista={handleEditEspecialista}
                  especialistasDisponibles={especialistasConCitas}
                  selectedCitaId={selectedCitaId}
                />
              </div>

              <div className="lg:col-span-8 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-neutral-700">Calendario semanal</p>
                  <div className="flex items-center gap-1 border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setWeekOffset((o) => Math.max(0, o - 1))}
                      disabled={weekOffset === 0}
                      className="p-1.5 hover:bg-neutral-50 disabled:opacity-30"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="px-2 text-xs font-semibold text-neutral-600 min-w-[120px] text-center">
                      {weekLabel}
                    </span>
                    <button
                      onClick={() => setWeekOffset((o) => o + 1)}
                      className="p-1.5 hover:bg-neutral-50"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-green-50 border border-green-200" /> Disponible
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-red-100" /> Ocupado
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-purple-100" /> Feriado
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-neutral-100/60" /> No laboral
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-blue-500" /> Asignado
                  </span>
                </div>

                {selectedCitaId ? (
                  <WeeklySlotPicker
                    dates={dates}
                    slotsPorFecha={slotsPorFecha}
                    selectedSlots={Object.values(selectedSlots)}
                    onSlotClick={handleSlotClick}
                    onSlotRemove={(slot) => handleSlotClick(slot)}
                    workingDays={workingDays}
                    highlightSlots={highlightedHour && highlightedHour.length > 0 ? [{ fecha, horaInicio: highlightedHour }] : []}
                  />
                ) : (
                  <div className="text-center py-16 text-neutral-400 text-sm border rounded-xl bg-neutral-50">
                    Selecciona una cita de la lista para ver los horarios disponibles
                  </div>
                )}

                <div className="border rounded-xl p-3 bg-neutral-50">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-neutral-500">
                        Asignadas:{' '}
                        <span className="font-bold text-neutral-700">
                          {Object.keys(selectedSlots).length}/{citasConEstado.length}
                        </span>
                      </span>
                      <span className="text-neutral-500">
                        Reagendadas:{' '}
                        <span className="font-bold text-purple-700">{reagendadas.length}</span>
                      </span>
                      <span className="text-neutral-500">
                        Canceladas:{' '}
                        <span className="font-bold text-red-700">{canceladas.length}</span>
                      </span>
                      <span className="text-neutral-500">
                        Pendientes:{' '}
                        <span className="font-bold text-amber-700">{pendientes.length}</span>
                      </span>
                    </div>
                    <div className="w-40">
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${citasConEstado.length > 0 ? (Object.keys(selectedSlots).length / citasConEstado.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedEspIds.size === 0 && (
            <div className="text-center py-6 text-neutral-500 text-sm">
              Seleccione al menos una especialidad o especialista para continuar
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Volver
            </button>
            <button
              onClick={handleVerResumen}
              disabled={selectedEspIds.size === 0}
              className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <CalendarClock size={16} /> Revisar cambios
            </button>
          </div>
        </>
      )}

      {step === 'resumen' && (
        <DialogoResumen
          reagendadas={reagendadas}
          canceladas={canceladas}
          pendientes={pendientes}
          onRegresar={() => setStep('reagendar')}
          onCancelarPendientes={handleCancelarPendientes}
          onConfirmar={handleAplicarCambios}
          onClose={onComplete}
          procesando={procesando}
        />
      )}
    </div>
  );
}
