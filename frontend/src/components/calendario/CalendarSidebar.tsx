'use client';

import type { UsuarioConEspecialista } from '@/types/api';
import { cn } from '@/lib/utils';
import { hashColor, initials } from './calendar-utils';

interface CalendarSidebarProps {
  especialistas: UsuarioConEspecialista[];
  selectedIds: Set<string>;
  onToggleSpec: (id: string) => void;
  onToggleAll: () => void;
}

export default function CalendarSidebar({ especialistas, selectedIds, onToggleSpec, onToggleAll }: CalendarSidebarProps) {
  return (
    <div className="w-48 shrink-0 hidden lg:block bg-white rounded-2xl border border-neutral-100 shadow-sm p-3 overflow-y-auto max-h-[calc(100vh-4rem)] scrollbar-thin">
      <h3 className="text-sm font-semibold text-neutral-800 mb-2">Especialistas</h3>
      <button
        onClick={onToggleAll}
        className="text-[11px] text-primary-600 hover:text-primary-800 mb-2"
        aria-label={selectedIds.size === especialistas.length ? 'Quitar todos los especialistas' : 'Seleccionar todos los especialistas'}
      >
        {selectedIds.size === especialistas.length ? 'Quitar todos' : 'Seleccionar todos'}
      </button>
      <div className="space-y-0.5">
        {especialistas.map((u) => {
          const esp = u.especialista;
          const color = hashColor(esp.id);
          const badge = initials(esp.nombres, esp.apellidos);
          const checked = selectedIds.has(esp.id);
          return (
            <label
              key={esp.id}
              className={cn(
                'flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors text-xs',
                checked ? 'bg-neutral-50' : 'hover:bg-neutral-50/50',
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleSpec(esp.id)}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500 shrink-0"
                aria-label={`Filtrar por ${esp.nombres} ${esp.apellidos}`}
              />
              <span
                className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                style={{ backgroundColor: color }}
              >
                {badge}
              </span>
              <span className="truncate text-neutral-600">
                {esp.nombres.split(' ')[0]} {esp.apellidos.split(' ')[0]}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
