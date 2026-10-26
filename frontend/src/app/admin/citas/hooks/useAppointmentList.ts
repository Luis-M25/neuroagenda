'use client';

import { useCallback } from 'react';
import { citasApi } from '@/lib/api-client';
import { toast } from 'sonner';

export function useAppointmentList(
  filtroFechaInicio: string,
  filtroFechaFin: string,
  filtroEspecialidad: string,
  filtroEspecialista: string,
  filtroEstado: string,
  filtroPaciente: string,
) {
  const loadCitas = useCallback(() => {
    const params: Record<string, string> = {};
    if (filtroFechaInicio) params.fechaInicio = filtroFechaInicio;
    if (filtroFechaFin) params.fechaFin = filtroFechaFin;
    if (filtroEspecialidad) params.especialidad = filtroEspecialidad;
    if (filtroEspecialista) params.especialistaId = filtroEspecialista;
    if (filtroEstado) params.estado = filtroEstado;
    if (filtroPaciente.trim()) params.searchPaciente = filtroPaciente.trim();
    citasApi.getAll(params)
      .catch((e) => toast.error(e.message));
  }, [filtroFechaInicio, filtroFechaFin, filtroEspecialidad, filtroEspecialista, filtroEstado, filtroPaciente]);

  return { loadCitas };
}
