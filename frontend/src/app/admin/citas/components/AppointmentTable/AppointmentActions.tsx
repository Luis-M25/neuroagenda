'use client';

import React from 'react';
import { cn, getEstadoCitaColor, formatDate, ESTADOS_CITA } from '@/lib/utils';
import {
  ChevronRight, CalendarDays, Eye, Trash2,
  RotateCcw, XCircle, Ban, UserX,
} from 'lucide-react';
import { requirePermission } from '@/lib/use-permission';
import { citasApi } from '@/lib/api-client';
import { toast } from 'sonner';

interface AppointmentActionsProps {
  cita: any;
  isRecurrente: boolean;
  derivadas: any[];
  onOpenDetail: (c: any) => void;
  onOpenModify: (c: any) => void;
  onOpenCancel: (c: any) => void;
  onReload: () => void;
}

export default function AppointmentActions({
  cita, isRecurrente, derivadas,
  onOpenDetail, onOpenModify, onOpenCancel, onReload,
}: AppointmentActionsProps) {
  const handleNoAsistio = async (c: any) => {
    if (!window.confirm('¿Marcar como No Asistió?')) return;
    try {
      await citasApi.updateEstado(c.id, { estado: 'NO_ASISTIO' });
      toast.success('Cita marcada como no asistió');
      onReload();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleLiberarHorario = async (c: any) => {
    if (!window.confirm('¿Liberar el horario de esta cita cancelada? El horario quedará disponible para nuevas citas.')) return;
    try {
      await citasApi.liberarHorario(c.id);
      toast.success('Horario liberado');
      onReload();
    } catch (e: any) { toast.error(e.message); }
  };

  if (isRecurrente) {
    return (
      <div className="flex items-center gap-0.5">
        <button onClick={() => { /* view recurrent calendar */ }} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg" title="Calendario recurrente"><CalendarDays size={15} /></button>
        <button onClick={() => onOpenDetail(cita)} className="p-1.5 text-neutral-500 hover:bg-neutral-100 rounded-lg" title="Detalle"><Eye size={15} /></button>
        <button
          onClick={() => {
            const n = derivadas.length;
            if (!window.confirm(`¿Cancelar TODAS las ${n} citas de esta recurrencia?`)) return;
            Promise.all(derivadas.map((d: any) => citasApi.updateEstado(d.id, { estado: 'CANCELADA', motivoCancelacion: 'Cancelación masiva', canceladaPor: 'ADMIN' }).catch((e) => console.error('Error cancelando cita:', e))))
              .then(() => { toast.success(`${n} citas canceladas`); onReload(); })
              .catch(() => toast.error('Error al cancelar'));
          }}
          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Cancelar todas"
        ><Trash2 size={15} /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {cita.estado !== 'CANCELADA' ? (
        <>
          <button onClick={() => { if (!requirePermission('editarCita')) return; onOpenModify(cita); }} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg" title="Reagendar cita"><RotateCcw size={15} /></button>
          <button onClick={() => { if (!requirePermission('cancelarCita')) return; onOpenCancel(cita); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Cancelar"><XCircle size={15} /></button>
        </>
      ) : (
        !cita.slotLiberado && (
          <button onClick={() => handleLiberarHorario(cita)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Liberar horario"><Ban size={15} /></button>
        )
      )}
      <button onClick={() => onOpenDetail(cita)} className="p-1.5 text-neutral-500 hover:bg-neutral-100 rounded-lg" title="Ver detalle"><Eye size={15} /></button>
    </div>
  );
}
