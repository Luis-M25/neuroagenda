'use client';

import React from 'react';
import { cn, getEstadoCitaColor, formatDate, ESTADOS_CITA } from '@/lib/utils';
import { ChevronRight, RotateCcw, Eye, XCircle, Ban, UserX } from 'lucide-react';
import { requirePermission } from '@/lib/use-permission';
import AppointmentActions from './AppointmentActions';

interface AppointmentRowProps {
  cita: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onOpenDetail: (c: any) => void;
  onOpenModify: (c: any) => void;
  onOpenCancel: (c: any) => void;
  onReload: () => void;
}

export default function AppointmentRow({
  cita, isExpanded, onToggleExpand, onOpenDetail, onOpenModify, onOpenCancel, onReload,
}: AppointmentRowProps) {
  const derivadas: any[] = cita.citasDerivadas || [];
  const isRecurrente = cita.esRecurrente && derivadas.length > 0;
  const atendidas = derivadas.filter((d: any) => d.estado === 'ATENDIDA').length;
  const canceladas = derivadas.filter((d: any) => d.estado === 'CANCELADA').length;

  const estadoColorMap: Record<string, string> = {
    PENDIENTE: 'border-l-4 border-l-yellow-400',
    CONFIRMADA: 'border-l-4 border-l-blue-400',
    ATENDIENDO: 'border-l-4 border-l-green-400',
    ATENDIDA: 'border-l-4 border-l-neutral-300',
    NO_ASISTIO: 'border-l-4 border-l-red-400',
    CANCELADA: 'border-l-4 border-l-red-600',
    REAGENDADA: 'border-l-4 border-l-purple-400',
  };

  return (
    <React.Fragment>
      <tr
        className={cn('border-b transition-colors', estadoColorMap[cita.estado] || '', cita.estado === 'ATENDIDA' ? 'bg-neutral-50/60' : 'hover:bg-neutral-50')}
        onClick={() => onOpenDetail(cita)}
      >
        <td className="p-3 truncate">
          <div className="flex items-center gap-2 min-w-0">
            {cita.citaOrigenId && <span className="text-[10px] text-purple-500 bg-purple-50 px-1 rounded shrink-0">↳</span>}
            {isRecurrente && (
              <button onClick={(e) => { e.stopPropagation(); onToggleExpand(); }} className="p-0.5 hover:bg-neutral-200 rounded shrink-0">
                <ChevronRight size={14} className={cn('transition-transform text-neutral-400', isExpanded && 'rotate-90')} />
              </button>
            )}
            <span className="font-medium text-neutral-900 truncate" title={`${cita.paciente?.nombres} ${cita.paciente?.apellidos}`}>
              {cita.paciente?.nombres} {cita.paciente?.apellidos}
            </span>
          </div>
        </td>
        <td className="p-3 text-neutral-600 truncate" title={`${cita.especialista?.nombres} ${cita.especialista?.apellidos}`}>
          {cita.especialista?.nombres} {cita.especialista?.apellidos}
        </td>
        <td className="p-3 text-neutral-600 whitespace-nowrap font-mono text-xs">{cita.horaInicio}</td>
        <td className="p-3 text-neutral-600 truncate" title={cita.especialidad}>{cita.especialidad}</td>
        <td className="p-3 whitespace-nowrap">
          {isRecurrente ? (
            <div className="flex items-center gap-1.5">
              <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', getEstadoCitaColor(cita.estado))}>
                {ESTADOS_CITA.find((e) => e.value === cita.estado)?.label || cita.estado}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">{atendidas}/{derivadas.length} sesiones</span>
              {canceladas > 0 && <span className="text-[10px] text-red-500">{canceladas} cancel.</span>}
              {cita.citaReagendadaId && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 flex items-center gap-0.5"><RotateCcw size={9} /> Reagendada</span>}
              {cita.notasModificacion && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 flex items-center gap-0.5"><RotateCcw size={9} /> Modificada</span>}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', getEstadoCitaColor(cita.estado))}>
                {ESTADOS_CITA.find((e) => e.value === cita.estado)?.label || cita.estado}
              </span>
              {cita.citaReagendadaId && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 flex items-center gap-0.5"><RotateCcw size={9} /> Reagendada</span>}
              {cita.notasModificacion && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 flex items-center gap-0.5"><RotateCcw size={9} /> Modificada</span>}
            </div>
          )}
        </td>
        <td className="p-3" onClick={(e) => e.stopPropagation()}>
          <AppointmentActions
            cita={cita}
            isRecurrente={isRecurrente}
            derivadas={derivadas}
            onOpenDetail={onOpenDetail}
            onOpenModify={onOpenModify}
            onOpenCancel={onOpenCancel}
            onReload={onReload}
          />
        </td>
      </tr>
      {isRecurrente && isExpanded && (
        <tr>
          <td colSpan={6} className="p-0 bg-purple-50/30">
            <div className="px-6 py-4 space-y-2">
              <p className="text-xs font-semibold text-purple-700 mb-2">Citas derivadas — acciones individuales</p>
              {derivadas.map((d: any) => (
                <div key={d.id} className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg border text-sm',
                  d.estado === 'ATENDIDA' ? 'bg-green-50 border-green-200' :
                  d.estado === 'CANCELADA' ? 'bg-red-50 border-red-200' :
                  d.estado === 'NO_ASISTIO' ? 'bg-orange-50 border-orange-200' :
                  'bg-white border-gray-200'
                )}>
                  <div className="flex-1 flex items-center gap-4">
                    <span className="font-semibold text-gray-800 min-w-[90px]">{formatDate(d.fecha)}</span>
                    <span className="text-gray-600 min-w-[60px]">{d.horaInicio}</span>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      d.estado === 'ATENDIDA' ? 'bg-green-100 text-green-700' :
                      d.estado === 'CANCELADA' ? 'bg-red-100 text-red-600' :
                      d.estado === 'NO_ASISTIO' ? 'bg-orange-100 text-orange-600' :
                      'bg-purple-100 text-purple-700'
                    )}>
                      {ESTADOS_CITA.find((e) => e.value === d.estado)?.label || d.estado}
                    </span>
                    {d.notasModificacion && <span className="px-1 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 flex items-center gap-0.5"><RotateCcw size={8} /> Modificada</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    {d.estado !== 'CANCELADA' ? (
                      <>
                        <button onClick={() => { if (!requirePermission('editarCita')) return; onOpenModify(d); }} className="p-1.5 text-amber-600 hover:bg-amber-100 rounded" title="Reagendar"><RotateCcw size={14} /></button>
                        <button onClick={() => { if (!requirePermission('cancelarCita')) return; onOpenCancel(d); }} className="p-1.5 text-red-600 hover:bg-red-100 rounded" title="Cancelar"><XCircle size={14} /></button>
                        <button onClick={() => { /* handleNoAsistio */ }} className="p-1.5 text-orange-600 hover:bg-orange-100 rounded" title="No Asistió"><UserX size={14} /></button>
                      </>
                    ) : (
                      !d.slotLiberado && (
                        <button onClick={() => { /* handleLiberarHorario */ }} className="p-1.5 text-green-600 hover:bg-green-100 rounded" title="Liberar horario"><Ban size={14} /></button>
                      )
                    )}
                    <button onClick={() => onOpenDetail(d)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Detalle"><Eye size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}
