'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle, HelpCircle, XCircle, CheckCircle2, Search, X, Pencil } from 'lucide-react';
import { getSpecialistVisuals } from './specialistColors';

export interface CitaItem {
  id: string;
  paciente: string;
  horaInicio: string;
  horaFin: string;
  especialista: string;
  especialistaId: string;
  especialidad: string;
  estado: string;
}

export type EstadoReagendamiento = 'pendiente' | 'reagendada' | 'cancelada';

export interface CitaConReagendamiento {
  cita: CitaItem;
  estadoReagendamiento: EstadoReagendamiento;
  nuevaFecha?: string;
  nuevaHoraInicio?: string;
  nuevaHoraFin?: string;
}

interface Props {
  citas: CitaConReagendamiento[];
  onToggleCancelar: (citaId: string) => void;
  onRemoverSlot: (citaId: string) => void;
  onSelectCita: (citaId: string) => void;
  onEditEspecialista: (citaId: string, nuevoEspId: string) => void;
  especialistasDisponibles: Array<{ id: string; nombre: string; especialidad: string }>;
  selectedCitaId: string | null;
}

function horaLabel(hora: string): string {
  return hora?.substring(0, 5) || hora;
}

export default function ListaCitasReagendar({
  citas,
  onToggleCancelar,
  onRemoverSlot,
  onSelectCita,
  onEditEspecialista,
  especialistasDisponibles,
  selectedCitaId,
}: Props) {
  const [search, setSearch] = useState('');
  const [filtroHora, setFiltroHora] = useState<'todas' | 'manana' | 'tarde'>('todas');
  const [editandoCitaId, setEditandoCitaId] = useState<string | null>(null);

  const visualMap = useMemo(() => {
    const espList: Array<{ id: string; nombre: string }> = [];
    const seen = new Set<string>();
    for (const c of citas) {
      if (!seen.has(c.cita.especialistaId)) {
        seen.add(c.cita.especialistaId);
        espList.push({ id: c.cita.especialistaId, nombre: c.cita.especialista });
      }
    }
    return getSpecialistVisuals(espList);
  }, [citas]);

  const citasFiltradas = useMemo(() => {
    let list = citas;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.cita.paciente.toLowerCase().includes(q));
    }
    if (filtroHora === 'manana') {
      list = list.filter((c) => {
        const h = parseInt(c.cita.horaInicio.split(':')[0]);
        return h >= 8 && h < 12;
      });
    } else if (filtroHora === 'tarde') {
      list = list.filter((c) => {
        const h = parseInt(c.cita.horaInicio.split(':')[0]);
        return h >= 12 && h < 19;
      });
    }
    return list;
  }, [citas, search, filtroHora]);

  const pendientes = citas.filter((c) => c.estadoReagendamiento === 'pendiente').length;
  const reagendadas = citas.filter((c) => c.estadoReagendamiento === 'reagendada').length;
  const canceladas = citas.filter((c) => c.estadoReagendamiento === 'cancelada').length;

  const getRowColor = (c: CitaConReagendamiento) => {
    if (c.cita.id === selectedCitaId) return 'bg-blue-50 border-blue-400 ring-2 ring-blue-400';
    switch (c.estadoReagendamiento) {
      case 'reagendada': return 'bg-purple-50 border-purple-200';
      case 'cancelada': return 'bg-red-50 border-red-200';
      default: return 'bg-white border-neutral-200';
    }
  };

  const getIcon = (c: CitaConReagendamiento) => {
    switch (c.estadoReagendamiento) {
      case 'reagendada': return <HelpCircle size={15} className="text-purple-600" />;
      case 'cancelada': return <XCircle size={15} className="text-red-600" />;
      default:
        if (c.cita.id === selectedCitaId) return <AlertTriangle size={15} className="text-amber-500" />;
        return <AlertTriangle size={15} className="text-neutral-300" />;
    }
  };

  const primeraSinSlot = citas.find(
    (c) => c.estadoReagendamiento === 'pendiente' && c.cita.id !== selectedCitaId,
  );

  return (
    <div className="border rounded-xl flex flex-col h-full">
      <div className="bg-neutral-50 px-3 py-2 border-b shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
            <Clock size={14} className="text-neutral-500" />Citas del día ({citas.length})
          </p>
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 pr-2 py-1.5 text-xs border border-neutral-200 rounded-lg outline-none focus:ring-1 focus:ring-primary-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
              <X size={12} />
            </button>
          )}
        </div>
        <div className="flex gap-1 mt-1.5">
          {(['todas', 'manana', 'tarde'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltroHora(f)}
              className={cn(
                'flex-1 py-1 rounded-md text-[10px] font-medium transition-all',
                filtroHora === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
              )}
            >
              {f === 'todas' ? 'Todas' : f === 'manana' ? 'Mañana' : 'Tarde'}
            </button>
          ))}
        </div>
        {!selectedCitaId && primeraSinSlot && (
          <p className="text-[10px] text-neutral-400 mt-1.5">
            Haga clic en una cita para seleccionarla, o se asignará en orden a la siguiente pendiente:{' '}
            <span className="font-medium text-neutral-600">{primeraSinSlot.cita.paciente}</span>
          </p>
        )}
        {selectedCitaId && (
          <p className="text-[10px] text-blue-600 mt-1.5">
            Cita seleccionada. Haga clic en un horario del calendario para asignarla.
          </p>
        )}
      </div>

      <div className="overflow-y-auto flex-1 p-1.5 space-y-1">
        {citasFiltradas.map((c) => {
          const isActive = c.cita.id === selectedCitaId;
          const visual = visualMap.get(c.cita.especialistaId) || { color: '#6b7280', badge: '?' };
          const isClickable = c.estadoReagendamiento === 'pendiente' && c.cita.id !== selectedCitaId;
          const isEditing = editandoCitaId === c.cita.id;
          const disponibles = especialistasDisponibles;

          return (
            <div key={c.cita.id}>
              <div
                onClick={() => {
                  if (isClickable) onSelectCita(c.cita.id);
                }}
                className={cn(
                  'flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 border transition-all',
                  getRowColor(c),
                  isClickable && 'cursor-pointer hover:shadow-sm',
                  isEditing && 'rounded-b-none border-b-0',
                )}
              >
                {getIcon(c)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 truncate text-[11px]">{c.cita.paciente}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                    <span>{horaLabel(c.cita.horaInicio)} – {horaLabel(c.cita.horaFin)}</span>
                    <span className="text-neutral-300">·</span>
                    <span
                      className="px-1 py-0.5 rounded text-[9px] font-bold text-white shrink-0"
                      style={{ backgroundColor: visual.color }}
                      title={c.cita.especialista}
                    >
                      {visual.badge}
                    </span>
                    <span className="truncate">{c.cita.especialista}</span>
                  </div>
                </div>

                {c.estadoReagendamiento === 'reagendada' && (
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-medium text-purple-700">
                      {c.nuevaFecha?.substring(5)}
                    </p>
                    <p className="text-[10px] text-purple-600">
                      {horaLabel(c.nuevaHoraInicio || '')}
                    </p>
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditandoCitaId(isEditing ? null : c.cita.id); }}
                        className="text-[9px] text-neutral-500 hover:text-primary-600 px-0.5 rounded"
                        title="Cambiar especialista"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemoverSlot(c.cita.id); }}
                        className="text-[9px] text-red-600 hover:underline"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                )}

                {c.estadoReagendamiento === 'pendiente' && !isActive && (
                  <div className="shrink-0 flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditandoCitaId(isEditing ? null : c.cita.id); }}
                      className="text-[10px] text-neutral-400 hover:text-primary-600 p-0.5 rounded hover:bg-neutral-100"
                      title="Cambiar especialista"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleCancelar(c.cita.id); }}
                      className="text-[10px] text-red-500 hover:text-red-700 hover:bg-red-50 px-1.5 py-0.5 rounded"
                      title="Cancelar esta cita"
                    >
                      <XCircle size={13} />
                    </button>
                  </div>
                )}

                {isActive && (
                  <div className="shrink-0 flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditandoCitaId(isEditing ? null : c.cita.id); }}
                      className="text-[10px] text-neutral-400 hover:text-primary-600 p-0.5 rounded hover:bg-neutral-100"
                      title="Cambiar especialista"
                    >
                      <Pencil size={11} />
                    </button>
                    <span className="text-[9px] text-blue-700 bg-blue-100 px-1 py-0.5 rounded font-medium">
                      Selecc.
                    </span>
                  </div>
                )}

                {c.estadoReagendamiento === 'cancelada' && (
                  <div className="shrink-0 flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditandoCitaId(isEditing ? null : c.cita.id); }}
                      className="text-[10px] text-neutral-400 hover:text-primary-600 p-0.5 rounded hover:bg-neutral-100"
                      title="Cambiar especialista"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleCancelar(c.cita.id); }}
                      className="text-[10px] text-green-600 hover:text-green-700 hover:bg-green-50 px-1.5 py-0.5 rounded"
                      title="Restaurar cita"
                    >
                      <CheckCircle2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="border border-t-0 rounded-b-lg bg-neutral-50 px-2 py-1.5 flex items-center gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
                  <span className="text-neutral-500 text-[10px] shrink-0">Esp:</span>
                  <select
                    value={c.cita.especialistaId}
                    onChange={(e) => {
                      onEditEspecialista(c.cita.id, e.target.value);
                      setEditandoCitaId(null);
                    }}
                    className="flex-1 border border-neutral-200 rounded px-1.5 py-0.5 text-[11px] bg-white"
                  >
                    {disponibles.map((esp) => {
                      const v = visualMap.get(esp.id) || { color: '#6b7280', badge: '?' };
                      return (
                        <option key={esp.id} value={esp.id}>
                          [{v.badge}] {esp.nombre}
                        </option>
                      );
                    })}
                    {disponibles.length === 0 && (
                      <option value={c.cita.especialistaId}>{c.cita.especialista}</option>
                    )}
                  </select>
                  <button
                    onClick={() => setEditandoCitaId(null)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {citasFiltradas.length === 0 && (
          <div className="text-center py-6 text-xs text-neutral-400">
            Sin citas para mostrar
          </div>
        )}
      </div>

      <div className="border-t px-3 py-1.5 bg-neutral-50 shrink-0">
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-neutral-300" /> Pend: {pendientes}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-400" /> Reag: {reagendadas}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400" /> Canc: {canceladas}
            </span>
          </div>
          <span className="text-neutral-500">
            <span className="text-neutral-300">⚠️</span> Pendiente{' '}
            <span className="text-purple-500">❓</span> Reagendada{' '}
            <span className="text-red-500">❌</span> Cancelada
          </span>
        </div>
      </div>
    </div>
  );
}
