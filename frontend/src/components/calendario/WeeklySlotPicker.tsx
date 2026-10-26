'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

export interface SlotCell {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  estado: 'disponible' | 'ocupado' | 'no_laboral' | 'feriado' | 'seleccionado';
  ocupadoPor?: string;
}

export interface SelectedSlot {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
}

interface WeeklySlotPickerProps {
  dates: Date[];
  slotsPorFecha: Record<string, SlotCell[]>;
  selectedSlots: SelectedSlot[];
  onSlotClick: (slot: SelectedSlot) => void;
  onSlotRemove: (slot: SelectedSlot) => void;
  readOnly?: boolean;
  workingDays: number[];
  highlightSlots?: Array<{ fecha: string; horaInicio: string }>;
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function WeeklySlotPicker({
  dates,
  slotsPorFecha,
  selectedSlots,
  onSlotClick,
  onSlotRemove,
  readOnly,
  workingDays,
  highlightSlots,
}: WeeklySlotPickerProps) {
  const todayStr = fmtDate(new Date());
  const highlightSet = highlightSlots && highlightSlots.length > 0
    ? new Set(highlightSlots.map((h) => `${h.fecha}::${h.horaInicio}`))
    : new Set<string>();

  const hours = useMemo(() => {
    const all = new Set<string>();
    for (const dk of Object.keys(slotsPorFecha)) {
      for (const s of slotsPorFecha[dk]) {
        all.add(s.horaInicio);
      }
    }
    const sorted = Array.from(all).sort();
    return sorted.length > 0 ? sorted : ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];
  }, [slotsPorFecha]);

  const isSelected = (fecha: string, hora: string) =>
    selectedSlots.some((s) => s.fecha === fecha && s.horaInicio === hora);

  return (
    <div className="overflow-auto rounded-lg border border-neutral-200">
      <table className="w-full border-collapse min-w-[600px]">
        <thead>
          <tr className="sticky top-0 z-10 bg-white">
            <th className="border-b border-neutral-200 p-2 w-14 text-[11px] text-neutral-400 font-medium" />
            {dates.map((d, i) => {
              const dk = fmtDate(d);
              const isToday = dk === todayStr;
              return (
                <th
                  key={i}
                  className={cn(
                    'border-b border-neutral-200 p-2 text-xs font-semibold',
                    isToday ? 'text-primary-600 bg-primary-50/70' : 'text-neutral-700',
                  )}
                >
                  <div>{DAY_NAMES[i]}</div>
                  <div className="text-[10px] font-normal text-neutral-400">{d.getDate()}/{d.getMonth() + 1}</div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {hours.map((hour) => (
            <tr key={hour}>
              <td className="border-b border-neutral-100 p-1 text-[11px] text-neutral-400 font-medium align-middle sticky left-0 bg-white">
                {hour}
              </td>
              {dates.map((d, di) => {
                const dk = fmtDate(d);
                const daySlots = slotsPorFecha[dk] || [];
                const hourSlot = daySlots.find((s) => s.horaInicio === hour);
                const selected = hourSlot && isSelected(dk, hour);
                const isWorking = workingDays.includes(d.getDay());
                const highlighted = highlightSet.has(`${dk}::${hour}`);

                if (selected) {
                  return (
                    <td key={di} className="border-b border-neutral-100 p-0.5 align-middle">
                      <button
                        disabled={readOnly}
                        onClick={() => onSlotRemove({ fecha: dk, horaInicio: hour, horaFin: hourSlot.horaFin, duracionMinutos: hourSlot.duracionMinutos })}
                        className="w-full h-8 rounded bg-blue-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-blue-600 transition-colors"
                      >
                        ✓ {hour}
                      </button>
                    </td>
                  );
                }

                if (!isWorking) {
                  return (
                    <td key={di} className="border-b border-neutral-100 p-0.5 align-middle">
                      <div className={cn('h-8 rounded bg-neutral-100/60', highlighted && 'ring-2 ring-orange-400')} />
                    </td>
                  );
                }

                if (!hourSlot || hourSlot.estado === 'no_laboral') {
                  return (
                    <td key={di} className="border-b border-neutral-100 p-0.5 align-middle">
                      <div className={cn('h-8 rounded bg-neutral-100/40', highlighted && 'ring-2 ring-orange-400')} />
                    </td>
                  );
                }

                if (hourSlot.estado === 'feriado') {
                  return (
                    <td key={di} className="border-b border-neutral-100 p-0.5 align-middle">
                      <div className={cn('h-8 rounded bg-purple-100 flex items-center justify-center', highlighted && 'ring-2 ring-orange-400')}>
                        <span className="text-[10px] text-purple-500 font-medium">Feriado</span>
                      </div>
                    </td>
                  );
                }

                if (hourSlot.estado === 'ocupado') {
                  const nameParts = (hourSlot.ocupadoPor || '').trim().split(/\s+/);
                  const badge = nameParts.length >= 2
                    ? (nameParts[0]?.charAt(0) || '') + (nameParts[nameParts.length - 1]?.charAt(0) || '')
                    : (nameParts[0]?.charAt(0) || '');
                  return (
                    <td key={di} className="border-b border-neutral-100 p-0.5 align-middle">
                      <div className={cn('h-8 rounded bg-red-100 flex items-center justify-center gap-1 px-1', highlighted && 'ring-2 ring-orange-400')} title={hourSlot.ocupadoPor}>
                        {badge && (
                          <span className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold text-white shrink-0 bg-red-500">
                            {badge.toUpperCase()}
                          </span>
                        )}
                        <span className="text-[11px] text-red-500 font-medium">{hour}</span>
                      </div>
                    </td>
                  );
                }

                if (hourSlot.estado === 'seleccionado') {
                  return (
                    <td key={di} className="border-b border-neutral-100 p-0.5 align-middle">
                      <div className={cn('h-8 rounded bg-blue-100 border-2 border-blue-400 flex items-center justify-center', highlighted && 'ring-2 ring-orange-400')} title={hourSlot.ocupadoPor}>
                        <span className="text-[11px] text-blue-600 font-bold">{hour}</span>
                      </div>
                    </td>
                  );
                }

                return (
                  <td key={di} className="border-b border-neutral-100 p-0.5 align-middle">
                    <button
                      disabled={readOnly}
                      onClick={() => onSlotClick({ fecha: dk, horaInicio: hour, horaFin: hourSlot.horaFin, duracionMinutos: hourSlot.duracionMinutos })}
                      className={cn('w-full h-8 rounded bg-green-50 border border-green-200 text-[11px] text-green-700 font-medium hover:bg-green-100 transition-colors', highlighted && 'ring-2 ring-orange-400')}
                    >
                      {hour}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function getWeekDates(offset: number): Date[] {
  const now = new Date();
  now.setDate(now.getDate() + offset * 7);
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
}

export function autoFillSlots(
  totalCitas: number,
  preferencia: 'manana' | 'tarde' | 'mixto',
  allWeeksSlots: Record<string, SlotCell[]>,
  duracionMinutos: number,
): SelectedSlot[] {
  const morningRange = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
  const afternoonRange = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

  const sortedDates = Object.keys(allWeeksSlots).sort();

  const morningSlots: { fecha: string; slot: SlotCell }[] = [];
  const afternoonSlots: { fecha: string; slot: SlotCell }[] = [];

  for (const fecha of sortedDates) {
    const slots = allWeeksSlots[fecha] || [];
    for (const slot of slots) {
      if (slot.estado !== 'disponible') continue;
      if (morningRange.includes(slot.horaInicio)) {
        morningSlots.push({ fecha, slot });
      } else if (afternoonRange.includes(slot.horaInicio)) {
        afternoonSlots.push({ fecha, slot });
      }
    }
  }

  const usedDates = new Set<string>();
  const result: SelectedSlot[] = [];

  function pickFrom(list: { fecha: string; slot: SlotCell }[], max: number) {
    for (const item of list) {
      if (result.length >= max) break;
      if (usedDates.has(item.fecha)) continue;
      usedDates.add(item.fecha);
      result.push({
        fecha: item.fecha,
        horaInicio: item.slot.horaInicio,
        horaFin: item.slot.horaFin,
        duracionMinutos,
      });
    }
  }

  if (preferencia === 'manana') {
    pickFrom(morningSlots, totalCitas);
  } else if (preferencia === 'tarde') {
    pickFrom(afternoonSlots, totalCitas);
  } else {
    const half = Math.ceil(totalCitas / 2);
    pickFrom(morningSlots, half);
    pickFrom(afternoonSlots, totalCitas);
  }

  return result;
}
