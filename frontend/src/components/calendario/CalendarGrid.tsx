'use client';

import React from 'react';
import { CalendarClock, ShieldAlert, Clock, Ban } from 'lucide-react';
import type { EstadoCita, EventoCalendario } from '@/types/api';
import { cn } from '@/lib/utils';
import { HOURS, DAY_NAMES, STATUS_COLORS, STATUS_LABELS, BLOQUEADO_COLOR, BLOQUEADO_BG, BLOQUEADO_BORDER, fmtDate, hashColor, initials } from './calendar-utils';

interface CalendarGridProps {
  data: {
    dates: Date[];
    grouped: Record<string, Record<string, EventoCalendario[]>>;
    loading: boolean;
    todayStr: string;
    bloqueados: Set<string>;
  };
  state: {
    expanded: { day: string; hour: string } | null;
    selectedIds: Set<string>;
  };
  actions: {
    onEventClick: (event: EventoCalendario) => void;
    onExpandChange: (v: { day: string; hour: string } | null) => void;
    onReagendarDia: (fecha: string) => void;
    onBloquearDia: (fecha: string) => void;
  };
  userRole: string;
}

export default function CalendarGrid({ data, state, actions, userRole }: CalendarGridProps) {
  const { dates, grouped, loading, todayStr, bloqueados } = data;
  const { expanded, selectedIds } = state;
  const maxVisible = 2;

  return (
    <div className="flex-1 bg-white rounded-2xl border border-neutral-100 overflow-auto shadow-sm">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr className="sticky top-0 z-10 bg-neutral-50/80 backdrop-blur-sm">
              <th className="border-b border-neutral-200 p-2 w-14 text-[11px] text-neutral-400 font-medium" />
              {dates.map((d, i) => {
                const dk = fmtDate(d);
                const blocked = bloqueados.has(dk);
                return (
                  <th
                    key={i}
                    className={cn(
                      'border-b p-2 text-sm font-semibold',
                      dk === todayStr && !blocked ? 'text-primary-600 bg-primary-50/60' : '',
                      blocked ? `text-[${BLOQUEADO_COLOR}] bg-[${BLOQUEADO_BG}]` : 'text-neutral-700',
                    )}
                    style={blocked ? { color: BLOQUEADO_COLOR, backgroundColor: BLOQUEADO_BG } : {}}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {blocked && <Ban size={12} className="shrink-0" />}
                      <span>{DAY_NAMES[i]}</span>
                    </div>
                    <div className={cn('text-xs font-normal', blocked ? 'opacity-90' : 'text-neutral-400')}>
                      {d.getDate()}/{d.getMonth() + 1}
                      {blocked && <span className="ml-1 text-[10px] font-medium">(bloqueado)</span>}
                      {userRole !== 'ESPECIALISTA' && userRole !== 'PORTERO' && (
                        <div className="flex items-center gap-0.5 ml-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); actions.onReagendarDia(dk); }}
                            className="text-[10px] text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded px-1 py-0.5 inline-flex items-center gap-0.5"
                            title="Reagendar / Anular día"
                            aria-label={`Reagendar o anular día ${DAY_NAMES[i]}`}
                          >
                            <CalendarClock size={10} />
                            <span className="hidden sm:inline">Reagendar</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); actions.onBloquearDia(dk); }}
                            className="text-[10px] text-red-600 hover:text-red-800 hover:bg-red-50 rounded px-1 py-0.5 inline-flex items-center gap-0.5"
                            title="Bloquear día"
                            aria-label={`Bloquear día ${DAY_NAMES[i]}`}
                          >
                            <ShieldAlert size={10} />
                            <span className="hidden sm:inline">Bloquear</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {selectedIds.size === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-16 text-neutral-400 text-sm">
                  Selecciona al menos un especialista para ver las citas
                </td>
              </tr>
            )}
            {HOURS.map((hour) => (
              <tr key={hour}>
                <td className="border-b border-neutral-100 p-2 text-[11px] text-neutral-400 font-medium align-top sticky left-0 bg-white">
                  {hour}
                </td>
                {dates.map((d, di) => {
                  const dk = fmtDate(d);
                  const blocked = bloqueados.has(dk);
                  const hourCitas = grouped[dk]?.[hour] || [];
                  const isExpanded = expanded?.day === dk && expanded?.hour === hour;
                  const visible = isExpanded ? hourCitas : hourCitas.slice(0, maxVisible);
                  const overflow = hourCitas.length - maxVisible;
                  return (
                    <td
                      key={di}
                      className={cn('border-b border-neutral-100 p-1 align-top', dk === todayStr && !blocked ? 'bg-primary-50/20' : '', blocked ? 'bg-purple-50/40' : '')}
                    >
                      {hourCitas.length === 0 ? (
                        <div style={{ minHeight: '36px' }} />
                      ) : (
                        <div className="space-y-0.5">
                          {visible.map((ev, ei) => {
                            const ep = ev.extendedProps;
                            const st = ep.estado;
                            const espNombre = ep.especialista || '';
                            const espId = ep.especialistaId || '';
                            const color = hashColor(espId);
                            const badge = initials(
                              espNombre.split(' ')[0] || '?',
                              espNombre.split(' ').pop() || '?',
                            );
                            return (
                              <button
                                key={ev.id || ei}
                                onClick={() => actions.onEventClick(ev)}
                                className="w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition-all hover:opacity-80 flex items-center gap-1.5 hover:shadow-sm"
                                style={{
                                  backgroundColor: `${STATUS_COLORS[st]}14`,
                                  borderLeft: `3px solid ${STATUS_COLORS[st]}`,
                                }}
                                aria-label={`Cita de ${ep.paciente || ev.title || 'paciente'} - ${STATUS_LABELS[st]}`}
                              >
                                <span className="truncate flex-1 font-medium text-neutral-800 leading-tight">
                                  {ep.paciente || ev.title || ''}
                                </span>
                                {(ev as any)._clamped && (
                                  <span className="shrink-0" title={`Hora original: ${(ev as any)._horaOriginal}`}>
                                    <Clock size={10} className="text-amber-500" />
                                  </span>
                                )}
                                <span
                                  className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white"
                                  style={{ backgroundColor: color }}
                                  title={espNombre}
                                >
                                  {badge}
                                </span>
                              </button>
                            );
                          })}
                          {overflow > 0 && !isExpanded && (
                            <button
                              onClick={() => actions.onExpandChange({ day: dk, hour })}
                              className="w-full text-center text-[11px] text-primary-600 font-medium hover:text-primary-800 py-0.5"
                              aria-label={`Mostrar ${overflow} citas más`}
                            >
                              ▼ {overflow} más
                            </button>
                          )}
                          {isExpanded && (
                            <button
                              onClick={() => actions.onExpandChange(null)}
                              className="w-full text-center text-[11px] text-primary-400 py-0.5"
                              aria-label="Colapsar citas"
                            >
                              ▲ Colapsar
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
