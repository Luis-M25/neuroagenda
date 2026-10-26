'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Search, CheckSquare, Square, X } from 'lucide-react';
import { getSpecialistVisuals } from './specialistColors';

export interface EspecialistaConCitas {
  id: string;
  nombre: string;
  especialidad: string;
  citas: number;
  numeroIdentificacion?: string;
}

interface Props {
  especialidades: string[];
  especialistas: EspecialistaConCitas[];
  selectedEspecialidades: Set<string>;
  selectedEspIds: Set<string>;
  onToggleEspecialidad: (name: string) => void;
  onToggleEsp: (id: string) => void;
  onMarcarTodos: () => void;
  onDesmarcarTodos: () => void;
}

export default function FiltrosEspecialidadEspecialista({
  especialidades,
  especialistas,
  selectedEspecialidades,
  selectedEspIds,
  onToggleEspecialidad,
  onToggleEsp,
  onMarcarTodos,
  onDesmarcarTodos,
}: Props) {
  const [searchEspecialidad, setSearchEspecialidad] = useState('');
  const [searchEsp, setSearchEsp] = useState('');

  const especialidadesFiltradas = useMemo(() => {
    if (!searchEspecialidad) return especialidades;
    const q = searchEspecialidad.toLowerCase();
    return especialidades.filter((e) => e.toLowerCase().includes(q));
  }, [especialidades, searchEspecialidad]);

  const especialistasFiltrados = useMemo(() => {
    let list = especialistas;
    if (selectedEspecialidades.size > 0) {
      list = list.filter((e) => selectedEspecialidades.has(e.especialidad));
    }
    if (searchEsp) {
      const q = searchEsp.toLowerCase();
      list = list.filter(
        (e) =>
          e.nombre.toLowerCase().includes(q) ||
          (e.numeroIdentificacion && e.numeroIdentificacion.includes(q)),
      );
    }
    return list;
  }, [especialistas, selectedEspecialidades, searchEsp]);

  const todosEspMarcados =
    especialistasFiltrados.length > 0 &&
    especialistasFiltrados.every((e) => selectedEspIds.has(e.id));

  const visualMap = useMemo(() => getSpecialistVisuals(especialistas), [especialistas]);

  const mostrarBusquedaEspecialidad = especialidades.length > 1;
  const mostrarBusquedaEsp = especialistas.length > 1;

  return (
    <div className="space-y-4">
      {mostrarBusquedaEspecialidad && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold text-neutral-600">Especialidades</p>
            {selectedEspecialidades.size > 0 && (
              <button
                onClick={() => {
                  for (const e of especialidades) selectedEspecialidades.delete(e);
                  onDesmarcarTodos();
                }}
                className="text-[10px] text-neutral-400 hover:text-neutral-600 inline-flex items-center gap-0.5"
              >
                <X size={10} /> Limpiar
              </button>
            )}
          </div>
          <div className="relative mb-2">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar especialidad..."
              value={searchEspecialidad}
              onChange={(e) => setSearchEspecialidad(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 text-xs border border-neutral-200 rounded-lg outline-none focus:ring-1 focus:ring-primary-400"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {especialidadesFiltradas.map((esp) => {
              const checked = selectedEspecialidades.has(esp);
              return (
                <button
                  key={esp}
                  onClick={() => onToggleEspecialidad(esp)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-all',
                    checked
                      ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                      : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50',
                  )}
                >
                  {checked ? <CheckSquare size={12} /> : <Square size={12} />}
                  {esp}
                </button>
              );
            })}
            {especialidadesFiltradas.length === 0 && (
              <p className="text-xs text-neutral-400 py-1">Sin resultados</p>
            )}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold text-neutral-600">Especialistas</p>
          <div className="flex items-center gap-1">
            <button
              onClick={onMarcarTodos}
              className="text-[10px] text-primary-600 hover:text-primary-800 inline-flex items-center gap-0.5"
            >
              <CheckSquare size={11} /> Marcar todos
            </button>
            <span className="text-neutral-300">|</span>
            <button
              onClick={onDesmarcarTodos}
              className="text-[10px] text-neutral-400 hover:text-neutral-600 inline-flex items-center gap-0.5"
            >
              <Square size={11} /> Desmarcar
            </button>
          </div>
        </div>
        {mostrarBusquedaEsp && (
          <div className="relative mb-2">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o cédula..."
              value={searchEsp}
              onChange={(e) => setSearchEsp(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 text-xs border border-neutral-200 rounded-lg outline-none focus:ring-1 focus:ring-primary-400"
            />
          </div>
        )}
        <div className="border rounded-xl overflow-hidden max-h-56 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 text-left sticky top-0">
                <th className="px-3 py-2 text-xs font-semibold text-neutral-600 w-8">
                  <button onClick={todosEspMarcados ? onDesmarcarTodos : onMarcarTodos} className="hover:text-primary-600">
                    {todosEspMarcados ? <CheckSquare size={14} /> : <Square size={14} />}
                  </button>
                </th>
                <th className="px-3 py-2 text-xs font-semibold text-neutral-600">Especialista</th>
                <th className="px-3 py-2 text-xs font-semibold text-neutral-600">Especialidad</th>
                <th className="px-3 py-2 text-xs font-semibold text-neutral-600 text-right">Citas</th>
              </tr>
            </thead>
            <tbody>
              {especialistasFiltrados.map((e) => {
                const checked = selectedEspIds.has(e.id);
                const visual = visualMap.get(e.id) || { color: '#6b7280', badge: '?' };
                return (
                  <tr key={e.id} className={cn('border-t', e.citas === 0 ? 'opacity-40' : 'hover:bg-neutral-50')}>
                    <td className="px-3 py-2">
                      <button onClick={() => onToggleEsp(e.id)}>
                        {checked ? (
                          <CheckSquare size={16} className="text-primary-600" />
                        ) : (
                          <Square size={16} className="text-neutral-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                          style={{ backgroundColor: visual.color }}
                        >
                          {visual.badge}
                        </span>
                        <span className="font-medium text-neutral-900 text-xs">{e.nombre}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-neutral-600 text-xs">{e.especialidad}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium',
                        e.citas > 0 ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-gray-400',
                      )}>
                        {e.citas}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {especialistasFiltrados.length === 0 && (
                <tr className="border-t">
                  <td colSpan={4} className="px-3 py-4 text-center text-xs text-neutral-400">
                    No se encontraron especialistas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
