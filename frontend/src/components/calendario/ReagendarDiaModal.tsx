'use client';

import { useState, useEffect, useCallback } from 'react';
import { citasApi } from '@/lib/api-client';
import { X, CalendarClock } from 'lucide-react';
import OpcionesIniciales from './anulacion/OpcionesIniciales';
import CancelarTodasCitas from './anulacion/CancelarTodasCitas';
import ReagendarCitasHoy from './anulacion/ReagendarCitasHoy';
import ReagendamientoAuto from './anulacion/ReagendamientoAuto';

interface CitaDia {
  id: string;
  paciente: string;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  especialidad: string;
  estado: string;
  especialistaId: string;
  especialista: string;
}

interface Props {
  fecha: string;
  especialistaId?: string;
  especialistas?: any[];
  onClose: () => void;
  onComplete: () => void;
}

type Opcion = 'reagendar' | 'cancelar' | 'auto' | null;

function fechaLabel(fecha: string): string {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ReagendarDiaModal({
  fecha,
  especialistaId,
  especialistas = [],
  onClose,
  onComplete,
}: Props) {
  const [allCitas, setAllCitas] = useState<CitaDia[]>([]);
  const [loading, setLoading] = useState(true);
  const [opcion, setOpcion] = useState<Opcion>(null);

  const loadCitas = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { fechaInicio: fecha, fechaFin: fecha };
      const data = await citasApi.getAll(params);
      const activas = data
        .filter(
          (c: any) =>
            !['CANCELADA', 'REAGENDADA', 'ATENDIDA', 'NO_ASISTIO', 'EN_ATENCION'].includes(
              c.estado,
            ),
        )
        .map((c: any) => ({
          id: c.id,
          paciente: `${c.paciente?.nombres || ''} ${c.paciente?.apellidos || ''}`,
          horaInicio: c.horaInicio,
          horaFin: c.horaFin,
          duracionMinutos: c.duracionMinutos,
          especialidad: c.especialidad,
          estado: c.estado,
          especialistaId: c.especialistaId,
          especialista: `${c.especialista?.nombres || ''} ${c.especialista?.apellidos || ''}`,
        }));
      setAllCitas(activas);
    } catch {
      setAllCitas([]);
    } finally {
      setLoading(false);
    }
  }, [fecha]);

  useEffect(() => {
    loadCitas();
  }, [loadCitas]);

  if (!especialistas || especialistas.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
        <div
          className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-neutral-600 text-sm">No hay especialistas disponibles</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b bg-neutral-50 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
              <CalendarClock size={18} className="text-primary-600" />
              {opcion === 'reagendar'
                ? 'Reagendar citas de hoy'
                : opcion === 'cancelar'
                  ? 'Cancelar todas las citas del día'
                  : opcion === 'auto'
                    ? 'Reagendamiento automático'
                    : 'Reagendar / Anular día'}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">{fechaLabel(fecha)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
            </div>
          ) : !opcion ? (
            <OpcionesIniciales
              selectedOption={opcion}
              onSelect={setOpcion}
              citasCount={allCitas.length}
            />
          ) : opcion === 'cancelar' ? (
            <CancelarTodasCitas
              fecha={fecha}
              allCitas={allCitas}
              onBack={() => setOpcion(null)}
              onComplete={onComplete}
            />
          ) : opcion === 'reagendar' ? (
            <ReagendarCitasHoy
              fecha={fecha}
              allCitas={allCitas}
              especialistas={especialistas}
              onBack={() => setOpcion(null)}
              onComplete={onComplete}
            />
          ) : opcion === 'auto' ? (
            <ReagendamientoAuto
              fecha={fecha}
              allCitas={allCitas}
              onBack={() => setOpcion(null)}
              onComplete={onComplete}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
