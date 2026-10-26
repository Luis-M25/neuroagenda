'use client';

import { cn } from '@/lib/utils';
import { CalendarClock, Ban, Zap, ArrowLeft } from 'lucide-react';

type Opcion = 'reagendar' | 'cancelar' | 'auto' | null;

interface Props {
  selectedOption: Opcion;
  onSelect: (option: Opcion) => void;
  citasCount: number;
}

export default function OpcionesIniciales({ selectedOption, onSelect, citasCount }: Props) {
  if (citasCount === 0) {
    return (
      <div className="text-center py-8 text-neutral-500 bg-neutral-50 rounded-xl">
        <CalendarClock className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
        <p className="text-sm font-medium">No hay citas activas para este día</p>
        <p className="text-xs text-neutral-400 mt-1">
          Todas las citas de esta fecha ya están canceladas, reagendadas o atendidas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
        <CalendarClock size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">
            {citasCount} cita(s) activa(s) en este día
          </p>
          <p className="text-xs text-blue-600 mt-0.5">
            Seleccione una opción para gestionar las citas de este día.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={() => onSelect('reagendar')}
          className={cn(
            'p-4 rounded-xl border text-left transition-all hover:shadow-sm',
            selectedOption === 'reagendar'
              ? 'bg-primary-50 border-primary-300 ring-1 ring-primary-300'
              : 'bg-white border-neutral-200 hover:bg-neutral-50',
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              selectedOption === 'reagendar' ? 'bg-primary-100' : 'bg-neutral-100',
            )}>
              <CalendarClock size={20} className={selectedOption === 'reagendar' ? 'text-primary-600' : 'text-neutral-400'} />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900">Reagendar citas de hoy</p>
              <p className="text-xs text-neutral-500">
                Filtre por especialidad y especialista, asigne nuevas fechas y horarios en el calendario semanal.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px]">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
              <span className="w-2 h-2 rounded-sm bg-neutral-300" /> Pendiente
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
              <span className="w-2 h-2 rounded-sm bg-purple-400" /> Reagendada
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 text-red-700">
              <span className="w-2 h-2 rounded-sm bg-red-400" /> Cancelada
            </span>
          </div>
        </button>

        <button
          onClick={() => onSelect('cancelar')}
          className={cn(
            'p-4 rounded-xl border text-left transition-all hover:shadow-sm',
            selectedOption === 'cancelar'
              ? 'bg-red-50 border-red-300 ring-1 ring-red-300'
              : 'bg-white border-neutral-200 hover:bg-neutral-50',
          )}
        >
          <div className="flex items-center gap-3 mb-1">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              selectedOption === 'cancelar' ? 'bg-red-100' : 'bg-neutral-100',
            )}>
              <Ban size={20} className={selectedOption === 'cancelar' ? 'text-red-600' : 'text-neutral-400'} />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900">Cancelar todas las citas del día</p>
              <p className="text-xs text-neutral-500">
                Cancela todas las citas activas de este día de forma masiva. Esta acción es irreversible.
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onSelect('auto')}
          className={cn(
            'p-4 rounded-xl border text-left transition-all hover:shadow-sm',
            selectedOption === 'auto'
              ? 'bg-green-50 border-green-300 ring-1 ring-green-300'
              : 'bg-white border-neutral-200 hover:bg-neutral-50',
          )}
        >
          <div className="flex items-center gap-3 mb-1">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              selectedOption === 'auto' ? 'bg-green-100' : 'bg-neutral-100',
            )}>
              <Zap size={20} className={selectedOption === 'auto' ? 'text-green-600' : 'text-neutral-400'} />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900">Reagendamiento automático</p>
              <p className="text-xs text-neutral-500">
                El sistema busca automáticamente el siguiente día hábil disponible para cada cita. Configure el orden y las preferencias de búsqueda.
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
