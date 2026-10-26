'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { EstadoCita } from '@/types/api';
import { STATUS_COLORS, STATUS_LABELS } from './calendar-utils';

interface CalendarHeaderProps {
  weekLabel: string;
  onToday: () => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

export default function CalendarHeader({ weekLabel, onToday, onPrevWeek, onNextWeek }: CalendarHeaderProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-3 mb-3 space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold text-neutral-900">Calendario de Citas</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onToday}
            className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
            aria-label="Ir al día de hoy"
          >
            Hoy
          </button>
          <div className="flex border border-neutral-200 rounded-lg overflow-hidden">
            <button onClick={onPrevWeek} className="p-1.5 hover:bg-neutral-50" aria-label="Semana anterior">
              <ChevronLeft size={16} className="text-neutral-500" />
            </button>
            <div className="w-px bg-neutral-200" />
            <button onClick={onNextWeek} className="p-1.5 hover:bg-neutral-50" aria-label="Siguiente semana">
              <ChevronRight size={16} className="text-neutral-500" />
            </button>
          </div>
          <span className="text-sm font-semibold text-neutral-700">{weekLabel}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
        <span className="text-neutral-400 font-medium mr-1">Estados:</span>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <span key={key} className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: STATUS_COLORS[key as EstadoCita] }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
