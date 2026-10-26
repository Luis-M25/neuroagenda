'use client';

import React from 'react';
import { cn, ESTADOS_CITA } from '@/lib/utils';
import { X } from 'lucide-react';

interface AppointmentFiltersProps {
  filtroFechaInicio: string;
  filtroFechaFin: string;
  filtroEspecialidad: string;
  filtroEspecialista: string;
  filtroEstado: string;
  filtroPaciente: string;
  especialidades: string[];
  especialistas: any[];
  onFechaInicioChange: (v: string) => void;
  onFechaFinChange: (v: string) => void;
  onEspecialidadChange: (v: string) => void;
  onEspecialistaChange: (v: string) => void;
  onEstadoChange: (v: string) => void;
  onPacienteChange: (v: string) => void;
  onFiltrar: () => void;
  onLimpiar: () => void;
}

export default function AppointmentFilters({
  filtroFechaInicio, filtroFechaFin, filtroEspecialidad, filtroEspecialista,
  filtroEstado, filtroPaciente, especialidades, especialistas,
  onFechaInicioChange, onFechaFinChange, onEspecialidadChange,
  onEspecialistaChange, onEstadoChange, onPacienteChange, onFiltrar, onLimpiar,
}: AppointmentFiltersProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Referencia de estados:</span>
        {ESTADOS_CITA.map((e) => (
          <span key={e.value} className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', 
            e.value === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
            e.value === 'CONFIRMADA' ? 'bg-blue-100 text-blue-800' :
            e.value === 'EN_ESPERA' ? 'bg-orange-100 text-orange-800' :
            e.value === 'EN_ATENCION' ? 'bg-purple-100 text-purple-800' :
            e.value === 'ATENDIDA' ? 'bg-green-100 text-green-800' :
            e.value === 'CANCELADA' ? 'bg-red-100 text-red-800' :
            e.value === 'REAGENDADA' ? 'bg-purple-100 text-purple-800' :
            e.value === 'NO_ASISTIO' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          )}>
            {e.label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        <input type="date" value={filtroFechaInicio} onChange={(e) => onFechaInicioChange(e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm" placeholder="Inicio" />
        <input type="date" value={filtroFechaFin} onChange={(e) => onFechaFinChange(e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm" placeholder="Fin" />
        <select value={filtroEspecialidad} onChange={(e) => onEspecialidadChange(e.target.value)} disabled={!!filtroEspecialista} className={cn('border rounded-lg px-2 py-1.5 text-sm', !!filtroEspecialista && 'bg-gray-50 text-gray-400')}>
          <option value="">Todas las especialidades</option>
          {especialidades.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={filtroEspecialista} onChange={(e) => onEspecialistaChange(e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm">
          <option value="">Todos los especialistas</option>
          {especialistas.map((e) => <option key={e.especialista?.id} value={e.especialista?.id}>{e.especialista?.nombres} {e.especialista?.apellidos}</option>)}
        </select>
        <select value={filtroEstado} onChange={(e) => onEstadoChange(e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm">
          <option value="">Todos los estados</option>
          {ESTADOS_CITA.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        <div className="flex gap-1">
          <input type="text" value={filtroPaciente} onChange={(e) => onPacienteChange(e.target.value)} placeholder="Buscar paciente..." className="flex-1 border rounded-lg px-2 py-1.5 text-sm min-w-0" />
          <button onClick={onFiltrar} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 shrink-0">Filtrar</button>
          <button onClick={onLimpiar} title="Limpiar filtros" className="px-2 py-1.5 border rounded-lg text-xs text-gray-500 hover:bg-gray-100 shrink-0"><X size={14} /></button>
        </div>
      </div>
    </div>
  );
}
