'use client';

import { useState, useEffect, useMemo } from 'react';
import { cn, getEstadoCitaColor } from '@/lib/utils';
import { citasApi, horariosApi } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Zap, AlertTriangle, CheckCircle2, ArrowLeft, HelpCircle, XCircle, ArrowRight, Clock, Pencil,
} from 'lucide-react';
import BarraProgreso from './BarraProgreso';
import DialogoResumen from './DialogoResumen';
import { WeeklySlotPicker, getWeekDates, type SlotCell } from '@/components/calendario/WeeklySlotPicker';
import type { CitaItem, CitaConReagendamiento, EstadoReagendamiento } from './ListaCitasReagendar';

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

interface Props {
  fecha: string;
  allCitas: CitaDia[];
  onBack: () => void;
  onComplete: () => void;
}

interface Slot {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  estado: 'DISPONIBLE' | 'OCUPADO' | 'NO_LABORAL' | 'FERIADO';
}

function addDays(fecha: string, dias: number): string {
  const [y, m, d] = fecha.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + dias);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getDayOfWeek(fecha: string): number {
  return new Date(`${fecha}T12:00:00`).getDay();
}

function fmtDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function horaLabel(hora: string): string {
  return hora?.substring(0, 5) || hora;
}

function fechaLabel(fecha: string): string {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function ReagendamientoAuto({ fecha, allCitas, onBack, onComplete }: Props) {
  const [step, setStep] = useState<'config' | 'procesando' | 'resultados' | 'resumen'>('config');
  const [mismoDia, setMismoDia] = useState(true);
  const [mismaHora, setMismaHora] = useState(true);
  const [progreso, setProgreso] = useState({ actual: 0, total: 0 });
  const [citasResultado, setCitasResultado] = useState<CitaConReagendamiento[]>([]);
  const [procesando, setProcesando] = useState(false);

  const [citaEditandoId, setCitaEditandoId] = useState<string | null>(null);
  const [slotsEdicion, setSlotsEdicion] = useState<Record<string, SlotCell[]>>({});
  const [weekOffsetEdicion, setWeekOffsetEdicion] = useState(0);
  const [loadingEdicion, setLoadingEdicion] = useState(false);

  const citasOrdenadas = useMemo(() => {
    return [...allCitas].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }, [allCitas]);

  const loadSlotsForEdicion = async (citaId: string, espId: string, weekOff: number) => {
    setLoadingEdicion(true);
    const dates = getWeekDates(weekOff);
    const newSlots: Record<string, SlotCell[]> = {};
    for (const d of dates) {
      const dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      try {
        const slots = await horariosApi.getDisponibles(espId, dk);
        newSlots[dk] = (slots || []).map((s: any) => ({
          fecha: dk,
          horaInicio: s.horaInicio,
          horaFin: s.horaFin,
          duracionMinutos: s.duracionMinutos,
          estado: s.estado === 'DISPONIBLE' ? 'disponible' as const
            : s.estado?.startsWith('OCUPADO') ? 'ocupado' as const
            : s.estado === 'FERIADO' ? 'feriado' as const
            : 'no_laboral' as const,
        }));
      } catch { newSlots[dk] = []; }
    }
    setSlotsEdicion(newSlots);
    setLoadingEdicion(false);
  };

  const handleAbrirEdicion = (c: CitaConReagendamiento) => {
    if (citaEditandoId === c.cita.id) {
      setCitaEditandoId(null);
      setSlotsEdicion({});
      return;
    }
    setCitaEditandoId(c.cita.id);
    const fechaRef = c.nuevaFecha || fecha;
    const refDate = new Date(fechaRef + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((refDate.getTime() - today.getTime()) / 86400000);
    const off = Math.floor(diffDays / 7);
    setWeekOffsetEdicion(off);
    loadSlotsForEdicion(c.cita.id, c.cita.especialistaId, off);
  };

  const handleNavSemana = (citaId: string, espId: string, dir: number) => {
    const off = weekOffsetEdicion + dir;
    setWeekOffsetEdicion(off);
    loadSlotsForEdicion(citaId, espId, off);
  };

  const handleSlotClickEdicion = (citaId: string, slot: { fecha: string; horaInicio: string; horaFin: string }) => {
    setCitasResultado((prev) =>
      prev.map((c) =>
        c.cita.id === citaId
          ? {
              ...c,
              estadoReagendamiento: 'reagendada',
              nuevaFecha: slot.fecha,
              nuevaHoraInicio: slot.horaInicio,
              nuevaHoraFin: slot.horaFin,
            }
          : c,
      ),
    );
    setCitaEditandoId(null);
    setSlotsEdicion({});
  };

  const findSlot = async (espId: string, duracionMinutos: number, horaOriginal: string, fechaOriginal: string): Promise<{ fecha: string; horaInicio: string; horaFin: string } | null> => {
    const diaSemanaOriginal = getDayOfWeek(fechaOriginal);
    const maxDias = 90;

    if (mismoDia) {
      let offset = 0;
      while (offset < maxDias) {
        offset += 7;
        const candidate = addDays(fechaOriginal, offset);
        try {
          const slots = await horariosApi.getDisponibles(espId, candidate);
          const filtered = (slots as Slot[]).filter((s) => s.estado === 'DISPONIBLE');
          if (filtered.length === 0) continue;

          if (mismaHora) {
            const exact = filtered.find((s) => s.horaInicio === horaOriginal);
            if (exact) return { fecha: candidate, horaInicio: exact.horaInicio, horaFin: exact.horaFin };
          } else {
            const s = filtered[0];
            return { fecha: candidate, horaInicio: s.horaInicio, horaFin: s.horaFin };
          }
        } catch { continue; }
      }
    } else {
      for (let i = 1; i <= maxDias; i++) {
        const candidate = addDays(fecha, i);
        const day = new Date(`${candidate}T12:00:00`).getDay();
        if (day === 0 || day === 6) continue;
        try {
          const slots = await horariosApi.getDisponibles(espId, candidate);
          const filtered = (slots as Slot[]).filter((s) => s.estado === 'DISPONIBLE');
          if (filtered.length === 0) continue;

          if (mismaHora) {
            const exact = filtered.find((s) => s.horaInicio === horaOriginal);
            if (exact) return { fecha: candidate, horaInicio: exact.horaInicio, horaFin: exact.horaFin };
          } else {
            const s = filtered[0];
            return { fecha: candidate, horaInicio: s.horaInicio, horaFin: s.horaFin };
          }
        } catch { continue; }
      }
    }
    return null;
  };

  const handleIniciar = async () => {
    if (allCitas.length === 0) {
      toast.error('No hay citas para reagendar');
      return;
    }
    setStep('procesando');
    setProgreso({ actual: 0, total: citasOrdenadas.length });

    const resultados: CitaConReagendamiento[] = [];

    for (let i = 0; i < citasOrdenadas.length; i++) {
      const cita = citasOrdenadas[i];
      const slot = await findSlot(cita.especialistaId, cita.duracionMinutos, cita.horaInicio, fecha);

      const citaItem: CitaItem = {
        id: cita.id,
        paciente: cita.paciente,
        horaInicio: cita.horaInicio,
        horaFin: cita.horaFin,
        especialista: cita.especialista,
        especialistaId: cita.especialistaId,
        especialidad: cita.especialidad,
        estado: cita.estado,
      };

      if (slot) {
        resultados.push({
          cita: citaItem,
          estadoReagendamiento: 'reagendada',
          nuevaFecha: slot.fecha,
          nuevaHoraInicio: slot.horaInicio,
          nuevaHoraFin: slot.horaFin,
        });
      } else {
        resultados.push({
          cita: citaItem,
          estadoReagendamiento: 'pendiente',
        });
      }

      setProgreso({ actual: i + 1, total: citasOrdenadas.length });

      if (i < citasOrdenadas.length - 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    setCitasResultado(resultados);
    setStep('resultados');

    const encontradas = resultados.filter((r) => r.estadoReagendamiento === 'reagendada').length;
    if (encontradas === 0) {
      toast.error('No se encontraron horarios disponibles para ninguna cita');
    } else if (encontradas < resultados.length) {
      toast.warning(`${encontradas} de ${resultados.length} citas encontraron horario disponible`);
    } else {
      toast.success(`¡Todas las ${encontradas} citas tienen horario disponible!`);
    }
  };

  const handleToggleCancelar = (citaId: string) => {
    setCitasResultado((prev) =>
      prev.map((c) => {
        if (c.cita.id !== citaId) return c;
        if (c.estadoReagendamiento === 'cancelada') {
          return { ...c, estadoReagendamiento: 'pendiente' as EstadoReagendamiento };
        }
        return {
          ...c,
          estadoReagendamiento: 'cancelada' as EstadoReagendamiento,
          nuevaFecha: undefined,
          nuevaHoraInicio: undefined,
          nuevaHoraFin: undefined,
        };
      }),
    );
  };

  const handleConfirmar = () => setStep('resumen');

  const handleAplicar = async () => {
    setProcesando(true);
    try {
      const reagendar = citasResultado.filter((c) => c.estadoReagendamiento === 'reagendada' && c.nuevaFecha);
      const cancelar = citasResultado.filter((c) => c.estadoReagendamiento === 'cancelada');

      await Promise.all([
        ...reagendar.map((p) =>
          citasApi.update(p.cita.id, {
            fecha: p.nuevaFecha,
            horaInicio: p.nuevaHoraInicio,
            horaFin: p.nuevaHoraFin,
            notasModificacion: `Reagendada desde ${fecha}`,
          }).catch((e: any) => toast.error(`Error en ${p.cita.paciente}: ${e.message}`)),
        ),
        ...cancelar.map((c) =>
          citasApi.updateEstado(c.cita.id, {
            estado: 'CANCELADA',
            motivoCancelacion: 'Día no laborable',
            canceladaPor: 'ADMIN',
          }).catch((e) => console.error('Error cancelando cita:', e)),
        ),
      ]);

      toast.success(`${reagendar.length} reagendadas, ${cancelar.length} canceladas`);
      onComplete();
    } catch (e: any) {
      toast.error(e.message || 'Error al aplicar cambios');
    } finally {
      setProcesando(false);
    }
  };

  const handleCancelarPendientes = () => {
    setCitasResultado((prev) =>
      prev.map((c) =>
        c.estadoReagendamiento === 'pendiente'
          ? { ...c, estadoReagendamiento: 'cancelada' as EstadoReagendamiento }
          : c,
      ),
    );
    setStep('resultados');
  };

  const handleRegresar = () => setStep('resultados');

  const reagendadasFinal = citasResultado.filter((c) => c.estadoReagendamiento === 'reagendada' && c.nuevaFecha);
  const canceladasFinal = citasResultado.filter((c) => c.estadoReagendamiento === 'cancelada');
  const pendientesFinal = citasResultado.filter((c) => c.estadoReagendamiento === 'pendiente');

  return (
    <div className="space-y-4">
      {step === 'config' && (
        <>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3">
            <Zap size={20} className="text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-green-800">Reagendamiento automático</p>
              <p className="text-xs text-green-600 mt-0.5">
                El sistema buscará automáticamente el siguiente día disponible para cada cita.
              </p>
            </div>
          </div>

          <div className="bg-neutral-50 rounded-xl p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-neutral-700 mb-2">Opciones de búsqueda</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mismoDia}
                    onChange={(e) => setMismoDia(e.target.checked)}
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">Mismo día de la semana</span>
                  <span className="text-xs text-neutral-400">(lunes → próximo lunes)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mismaHora}
                    onChange={(e) => setMismaHora(e.target.checked)}
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">Misma hora</span>
                  <span className="text-xs text-neutral-400">(conserva el horario original)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-neutral-50 rounded-xl p-3 text-center">
            <p className="text-sm text-neutral-600">
              <span className="font-semibold text-neutral-800">{allCitas.length}</span> citas serán procesadas
            </p>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Volver
            </button>
            <button
              onClick={handleIniciar}
              disabled={allCitas.length === 0}
              className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <Zap size={16} /> Iniciar búsqueda automática
            </button>
          </div>
        </>
      )}

      {step === 'procesando' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
            <Zap size={20} className="text-blue-600 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="text-sm font-bold text-blue-800">Buscando horarios disponibles...</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Procesando {citasOrdenadas.length} citas. Esto puede tomar unos segundos.
              </p>
            </div>
          </div>
          <BarraProgreso actual={progreso.actual} total={progreso.total} />
          <div className="max-h-48 overflow-y-auto border rounded-xl divide-y">
            {citasOrdenadas.slice(0, progreso.actual).map((c) => (
              <div key={c.id} className="px-3 py-1.5 flex items-center gap-2 text-xs">
                <Clock size={12} className="text-neutral-400 shrink-0" />
                <span className="font-medium text-neutral-700 truncate">{c.paciente}</span>
                <span className="text-neutral-400 ml-auto shrink-0">
                  {horaLabel(c.horaInicio)}
                </span>
                <CheckCircle2 size={12} className="text-green-500 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'resultados' && (
        <>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              {reagendadasFinal.length} de {citasResultado.length} citas encontraron horario.
            </p>
          </div>

          <div className="border rounded-xl overflow-hidden">
            <div className={cn('divide-y', !citaEditandoId && 'max-h-64 overflow-y-auto')}>
              {citasResultado.map((c) => (
                <div key={c.cita.id}>
                  <div className={cn(
                    'px-3 py-2 flex items-center gap-2 text-xs',
                    c.estadoReagendamiento === 'reagendada' ? 'bg-purple-50/30' :
                    c.estadoReagendamiento === 'cancelada' ? 'bg-red-50/30 opacity-50' : 'bg-amber-50/30',
                    citaEditandoId === c.cita.id && 'border-b-0 bg-blue-50/50',
                  )}>
                    <span className="font-medium text-neutral-800 min-w-[100px] truncate">{c.cita.paciente}</span>
                    <span className="text-neutral-400">{fechaLabel(fecha)}</span>
                    <span className="text-neutral-400">{c.cita.horaInicio}</span>
                    {c.estadoReagendamiento === 'reagendada' && c.nuevaFecha ? (
                      <>
                        <ArrowRight size={12} className="text-purple-400 shrink-0" />
                        <span className="font-medium text-purple-700">
                          {new Date(c.nuevaFecha + 'T12:00:00').toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-purple-600">{c.nuevaHoraInicio}</span>
                      </>
                    ) : c.estadoReagendamiento === 'cancelada' ? (
                      <>
                        <ArrowRight size={12} className="text-red-400 shrink-0" />
                        <span className="text-red-500 text-[10px]">Cancelada</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight size={12} className="text-amber-400 shrink-0" />
                        <span className="text-amber-500 text-[10px]">Sin horario</span>
                      </>
                    )}
                    <span className="ml-auto shrink-0">{c.cita.especialista?.split(' ').map((n: string) => n[0]).join('')}</span>
                    {(c.estadoReagendamiento === 'reagendada' || c.estadoReagendamiento === 'pendiente') && (
                      <button onClick={() => handleAbrirEdicion(c)}
                        className={cn('p-0.5 rounded shrink-0', citaEditandoId === c.cita.id ? 'bg-blue-200 text-blue-600' : 'hover:bg-neutral-200 text-neutral-400')}
                        title="Editar horario">
                        <Pencil size={12} />
                      </button>
                    )}
                    {(c.estadoReagendamiento === 'reagendada' || c.estadoReagendamiento === 'pendiente') && (
                      <button onClick={() => handleToggleCancelar(c.cita.id)}
                        className="p-0.5 rounded hover:bg-red-100 text-red-400 shrink-0" title="Cancelar">
                        <XCircle size={12} />
                      </button>
                    )}
                    {(c.estadoReagendamiento === 'cancelada') && (
                      <button onClick={() => handleToggleCancelar(c.cita.id)}
                        className="p-0.5 rounded hover:bg-green-100 text-green-500 shrink-0" title="Restaurar">
                        <CheckCircle2 size={12} />
                      </button>
                    )}
                  </div>
                  {citaEditandoId === c.cita.id && (
                    <div className="bg-white border-t border-blue-200 p-3 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="text-neutral-500">
                          <span className="text-neutral-400">Antes: </span>
                          <span className="font-medium text-neutral-700">{fechaLabel(fecha)} {c.cita.horaInicio}</span>
                          {c.nuevaFecha && (
                            <>
                              <ArrowRight size={12} className="inline mx-1 text-blue-400" />
                              <span className="text-blue-600 font-medium">{fechaLabel(c.nuevaFecha)} {c.nuevaHoraInicio}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-400">{c.cita.especialista}</span>
                          <button onClick={() => { setCitaEditandoId(null); setSlotsEdicion({}); }}
                            className="text-red-400 hover:text-red-600 text-[10px]">Cerrar</button>
                        </div>
                      </div>
                      {loadingEdicion ? (
                        <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full" /></div>
                      ) : (
                        <>
                          <WeeklySlotPicker
                            dates={getWeekDates(weekOffsetEdicion)}
                            slotsPorFecha={slotsEdicion}
                            selectedSlots={c.nuevaFecha && c.nuevaHoraInicio ? [{ fecha: c.nuevaFecha, horaInicio: c.nuevaHoraInicio, horaFin: c.nuevaHoraFin || '00:30', duracionMinutos: 30 }] : []}
                            onSlotClick={(slot) => handleSlotClickEdicion(c.cita.id, slot)}
                            onSlotRemove={() => {}}
                            workingDays={[1, 2, 3, 4, 5]}
                            readOnly={false}
                          />
                          <div className="flex items-center justify-between text-xs">
                            <button onClick={() => handleNavSemana(c.cita.id, c.cita.especialistaId, -1)}
                              className="px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-600">
                              {'←'} Semana anterior
                            </button>
                            <span className="text-neutral-400">Haz clic en un horario verde para cambiarlo</span>
                            <button onClick={() => handleNavSemana(c.cita.id, c.cita.especialistaId, 1)}
                              className="px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-600">
                              Semana siguiente {'→'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-[10px] text-neutral-500">
            <span className="inline-flex items-center gap-1">
              <HelpCircle size={10} className="text-purple-500" /> Reagendadas: {reagendadasFinal.length}
            </span>
            <span className="inline-flex items-center gap-1">
              <XCircle size={10} className="text-red-500" /> Canceladas: {canceladasFinal.length}
            </span>
            <span className="inline-flex items-center gap-1">
              <AlertTriangle size={10} className="text-amber-500" /> Sin horario: {pendientesFinal.length}
            </span>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep('config')}
              className="px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Reconfigurar
            </button>
            <button
              onClick={handleConfirmar}
              className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 inline-flex items-center gap-1.5"
            >
              <CheckCircle2 size={16} /> Revisar y confirmar
            </button>
          </div>
        </>
      )}

      {step === 'resumen' && (
        <DialogoResumen
          reagendadas={reagendadasFinal}
          canceladas={canceladasFinal}
          pendientes={pendientesFinal}
          onRegresar={handleRegresar}
          onCancelarPendientes={handleCancelarPendientes}
          onConfirmar={handleAplicar}
          onClose={onComplete}
          procesando={procesando}
        />
      )}
    </div>
  );
}
