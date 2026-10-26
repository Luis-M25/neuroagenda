'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { calendarioApi, especialistasApi, citasApi } from '@/lib/api-client';
import { getUser } from '@/lib/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  X, ChevronLeft, ChevronRight, CalendarDays, Clock, User, Stethoscope, MapPin,
  Save, Pencil, Phone, CreditCard, FileText, CalendarClock, ShieldAlert,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import type {
  EstadoCita, EventoCalendario, Cita, CitaFallback, EditFormCita,
  UpdateCitaPayload, UpdateEstadoPayload, UsuarioConEspecialista,
} from '@/types/api';
import {
  HOURS, DAY_NAMES, STATUS_COLORS, STATUS_LABELS,
  hashColor, initials, fmtDate, getClampInfo, extractHour,
  formatDateEs, inputDateStr, isCita,
  type TabKey,
} from './calendar-utils';

import CalendarHeader from './CalendarHeader';
import CalendarSidebar from './CalendarSidebar';
import CalendarGrid from './CalendarGrid';
import AppointmentDetailModal from './AppointmentDetailModal';
const ReagendarDiaModal = dynamic(() => import('./ReagendarDiaModal'), { ssr: false });
const BloquearDiaModal = dynamic(() => import('./BloquearDiaModal'), { ssr: false });
const CancelarCitaModal = dynamic(() => import('./CancelarCitaModal'), { ssr: false });

export default function WeeklyCalendar() {
  const user = getUser();
  const userRole: string = user?.rol || '';
  const [especialistas, setEspecialistas] = useState<UsuarioConEspecialista[]>([]);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rawEvents, setRawEvents] = useState<EventoCalendario[]>([]);
  const [loading, setLoading] = useState(true);
  const [bloqueados, setBloqueados] = useState<Set<string>>(new Set());
  const [weekOffset, setWeekOffset] = useState(0);
  const [expanded, setExpanded] = useState<{ day: string; hour: string } | null>(null);
  const [detailModal, setDetailModal] = useState<Cita | CitaFallback | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [reagendarDia, setReagendarDia] = useState<{ fecha: string; especialistaId: string } | null>(null);
  const [bloquearDia, setBloquearDia] = useState<string | null>(null);
  const [cancelacionCitaId, setCancelacionCitaId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('estado');
  const [editForm, setEditForm] = useState<EditFormCita>({
    especialistaId: '', especialidad: '', fecha: '', horaInicio: '', horaFin: '', lugar: '', motivo: '', notasModificacion: '',
  });
  const [saving, setSaving] = useState(false);
  const modalUpdatedAtRef = useRef<string | null>(null);
  const detailModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!detailModal) return;
    const el = detailModalRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    el.addEventListener('keydown', trap);
    return () => el.removeEventListener('keydown', trap);
  }, [detailModal]);

  const dates = useMemo(() => {
    const now = new Date();
    now.setDate(now.getDate() + weekOffset * 7);
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const mon = new Date(now);
    mon.setDate(now.getDate() + diff);
    mon.setHours(0, 0, 0, 0);
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      return d;
    });
  }, [weekOffset]);
  const startStr = useMemo(() => fmtDate(dates[0]), [dates]);
  const endStr = useMemo(() => {
    const e = new Date(dates[4]);
    e.setDate(e.getDate() + 1);
    return fmtDate(e);
  }, [dates]);
  const todayStr = fmtDate(new Date());
  const weekLabel = useMemo(() => {
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${dates[0].toLocaleDateString('es-EC', opts)} – ${dates[4].toLocaleDateString('es-EC', { ...opts, year: 'numeric' })}`;
  }, [dates]);

  useEffect(() => { setWeekOffset(0); }, []);

  useEffect(() => {
    Promise.all([
      especialistasApi.getAll({ activo: true }),
      especialistasApi.getEspecialidades(),
    ]).then(([data, espcs]: [UsuarioConEspecialista[], string[]]) => {
      setEspecialistas(data);
      setEspecialidades(espcs);
      setSelectedIds(new Set(data.map((u) => u.especialista.id)));
    }).catch((e: unknown) => toast.error(e instanceof Error ? e.message : 'Error al cargar especialistas'));
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      calendarioApi.getEventos(startStr, endStr),
      calendarioApi.getDiasBloqueados(startStr, endStr).catch(() => []),
    ]).then(([eventos, diasBloqueados]: [EventoCalendario[], any[]]) => {
      setRawEvents(eventos);
      const dias = Array.isArray(diasBloqueados) ? new Set(diasBloqueados.map((d: any) => d.fecha)) : new Set<string>();
      setBloqueados(dias);
    }).catch((e: unknown) => toast.error(e instanceof Error ? e.message : 'Error al cargar eventos'))
      .finally(() => setLoading(false));
  }, [startStr, endStr]);

  const grouped = useMemo(() => {
    const map: Record<string, Record<string, EventoCalendario[]>> = {};
    for (const d of dates) {
      const key = fmtDate(d);
      map[key] = {};
      for (const h of HOURS) map[key][h] = [];
    }

    const filtered = selectedIds.size === 0 ? [] : rawEvents.filter((e) => {
      const id = e.extendedProps?.especialistaId || '';
      return selectedIds.has(id);
    });

    for (const e of filtered) {
      const day = (e.start || '').slice(0, 10);
      const { slot, clamped, originalTime } = getClampInfo(e.start || '');
      const enriched = clamped ? { ...e, _clamped: true, _horaOriginal: originalTime } : e;
      if (map[day] && map[day][slot]) {
        map[day][slot].push(enriched);
      }
    }
    return map;
  }, [rawEvents, selectedIds, dates]);

  const loadEvents = useCallback(async () => {
    try {
      const data = await calendarioApi.getEventos(startStr, endStr);
      setRawEvents(data || []);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al recargar eventos');
    }
  }, [startStr, endStr]);

  const handleEventClick = useCallback(async (e: EventoCalendario) => {
    const id = e.id || e.extendedProps.citaId;
    setLoadingDetail(true);
    setActiveTab('estado');
    try {
      const full: Cita = await citasApi.getById(id);
      setDetailModal(full);
      setEditForm({
        especialistaId: full.especialistaId || '',
        especialidad: full.especialidad || '',
        fecha: inputDateStr(full.fecha),
        horaInicio: full.horaInicio || '',
        horaFin: full.horaFin || '',
        lugar: full.lugar || '',
        motivo: full.motivo || '',
        notasModificacion: '',
      });
      modalUpdatedAtRef.current = full.updatedAt;
    } catch {
      const fallback: CitaFallback = {
        id: e.id || e.extendedProps.citaId,
        citaId: e.extendedProps.citaId,
        estado: e.extendedProps.estado,
        especialista: e.extendedProps.especialista,
        especialistaId: e.extendedProps.especialistaId,
        especialidad: e.extendedProps.especialidad,
        paciente: e.extendedProps.paciente,
        pacienteTelefono: e.extendedProps.pacienteTelefono,
        motivo: e.extendedProps.motivo,
        lugar: e.extendedProps.lugar,
        horaInicio: extractHour(e.start || ''),
        fecha: (e.start || '').slice(0, 10),
      };
      setDetailModal(fallback);
      setEditForm({
        especialistaId: fallback.especialistaId || '',
        especialidad: fallback.especialidad || '',
        fecha: fallback.fecha || '',
        horaInicio: fallback.horaInicio || '',
        horaFin: '',
        lugar: fallback.lugar || '',
        motivo: fallback.motivo || '',
        notasModificacion: '',
      });
      modalUpdatedAtRef.current = null;
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const handleChangeEstado = async (citaId: string, estado: EstadoCita, motivo?: string) => {
    try {
      const payload: UpdateEstadoPayload = { estado };
      if (motivo) payload.motivoCancelacion = motivo;
      if (estado === 'CANCELADA' && userRole === 'PACIENTE') {
        payload.canceladaPor = 'PACIENTE';
      }
      await citasApi.updateEstado(citaId, payload);
      toast.success(`Cita ${STATUS_LABELS[estado]?.toLowerCase() || estado}`);
      setDetailModal(null);
      await loadEvents();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al cambiar estado');
    }
  };

  const handleSaveCita = async () => {
    if (!detailModal?.id) return;
    if (!isCita(detailModal)) {
      toast.error('No se puede guardar: datos de cita incompletos');
      return;
    }
    try {
      setSaving(true);
      const payload: UpdateCitaPayload = {};
      if (editForm.especialistaId !== detailModal.especialistaId && editForm.especialistaId) payload.especialistaId = editForm.especialistaId;
      if (editForm.especialidad !== detailModal.especialidad) payload.especialidad = editForm.especialidad;
      if (editForm.fecha !== inputDateStr(detailModal.fecha)) payload.fecha = editForm.fecha;
      if (editForm.horaInicio !== detailModal.horaInicio) payload.horaInicio = editForm.horaInicio;
      if (editForm.horaFin !== detailModal.horaFin) payload.horaFin = editForm.horaFin;
      if (editForm.lugar !== detailModal.lugar) payload.lugar = editForm.lugar;
      if (editForm.motivo !== detailModal.motivo) payload.motivo = editForm.motivo;
      if (editForm.notasModificacion?.trim()) payload.notasModificacion = editForm.notasModificacion.trim();

      if (Object.keys(payload).length === 0) {
        toast.info('No hay cambios para guardar');
        setSaving(false);
        return;
      }

      if (modalUpdatedAtRef.current) {
        const fresh = await citasApi.getById(detailModal.id);
        if (fresh.updatedAt !== modalUpdatedAtRef.current) {
          const sobrescribir = window.confirm(
            'Esta cita fue modificada por otro usuario desde que la abriste. ¿Sobrescribir igualmente?'
          );
          if (!sobrescribir) { setSaving(false); return; }
        }
        modalUpdatedAtRef.current = fresh.updatedAt;
      }

      await citasApi.update(detailModal.id, payload);
      toast.success('Cita actualizada');
      setDetailModal(null);
      await loadEvents();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const toggleSpec = (id: string) => setSelectedIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () => setSelectedIds((prev) => {
    if (prev.size === especialistas.length) return new Set();
    return new Set(especialistas.map((u) => u.especialista.id));
  });

  const maxVisible = 2;

  const canEditCita = userRole === 'ADMISION_PRINCIPAL' || userRole === 'ADMISION';

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <CalendarHeader
          weekLabel={weekLabel}
          onToday={() => setWeekOffset(0)}
          onPrevWeek={() => setWeekOffset((o) => o - 1)}
          onNextWeek={() => setWeekOffset((o) => o + 1)}
        />

        <CalendarGrid
          data={{ dates, grouped, loading, todayStr, bloqueados }}
          state={{ expanded, selectedIds }}
          actions={{
            onEventClick: handleEventClick,
            onExpandChange: setExpanded,
            onReagendarDia: (fecha: string) => setReagendarDia({ fecha, especialistaId: selectedIds.size === 1 ? Array.from(selectedIds)[0] : '' }),
            onBloquearDia: setBloquearDia,
          }}
          userRole={userRole}
        />
      </div>

      <CalendarSidebar
        especialistas={especialistas}
        selectedIds={selectedIds}
        onToggleSpec={toggleSpec}
        onToggleAll={toggleAll}
      />

      <AppointmentDetailModal
        detailModal={detailModal}
        loadingDetail={loadingDetail}
        activeTab={activeTab}
        editForm={editForm}
        saving={saving}
        canEditCita={canEditCita}
        userRole={userRole}
        especialistas={especialistas}
        especialidades={especialidades}
        detailModalRef={detailModalRef}
        onClose={() => setDetailModal(null)}
        onTabChange={(tab) => setActiveTab(tab)}
        onEditFormChange={setEditForm}
        onSave={handleSaveCita}
        onChangeEstado={(citaId, estado) => handleChangeEstado(citaId, estado)}
        onCancelCita={(citaId) => setCancelacionCitaId(citaId)}
      />

      {cancelacionCitaId && (
        <CancelarCitaModal
          citaId={cancelacionCitaId}
          onClose={() => setCancelacionCitaId(null)}
          onConfirm={async (motivo) => {
            await handleChangeEstado(cancelacionCitaId, 'CANCELADA', motivo);
            setCancelacionCitaId(null);
          }}
        />
      )}

      {reagendarDia && (
        <ReagendarDiaModal
          fecha={reagendarDia.fecha}
          especialistaId={reagendarDia.especialistaId || undefined}
          especialistas={especialistas}
          onClose={() => setReagendarDia(null)}
          onComplete={() => { setReagendarDia(null); loadEvents(); }}
        />
      )}

      {bloquearDia && (
        <BloquearDiaModal
          fecha={bloquearDia}
          especialistas={especialistas}
          onClose={() => setBloquearDia(null)}
          onComplete={() => { setBloquearDia(null); loadEvents(); }}
          onReagendar={() => { setBloquearDia(null); setReagendarDia({ fecha: bloquearDia, especialistaId: selectedIds.size === 1 ? Array.from(selectedIds)[0] : '' }); }}
        />
      )}
    </div>
  );
}
