'use client';

import { useMemo } from 'react';
import { citasApi } from '@/lib/api-client';
import { useApi } from './useApi';
import { CitasDashboardData, Cita } from '@/types/api';
import { todayStr, addDaysStr } from '@/lib/utils';

/**
 * Custom hook que maneja toda la lógica del dashboard de especialista.
 * Extrae y categoriza las citas por horario/estado.
 *
 * @param selectedDate - Fecha en formato YYYY-MM-DD
 * @returns Estado del dashboard, datos procesados y funciones de navegación
 */
export function useEspecialistaDashboard(selectedDate: string) {
  const { data: citas = [], loading } = useApi(
    () => citasApi.getAll({ fechaInicio: selectedDate, fechaFin: selectedDate }),
    [selectedDate],
  );

  const data = useMemo<CitasDashboardData>(() => {
    if (!citas || citas.length === 0) {
      return {
        total: 0,
        pendientes: 0,
        confirmadas: 0,
        enEspera: 0,
        enAtencion: 0,
        atendidas: 0,
        noAsistio: 0,
        canceladas: 0,
        citas: [],
        anteriores: [],
        enCurso: [],
        proximas: [],
        esHoy: isToday(selectedDate),
      };
    }

    // Calcular si la fecha seleccionada es hoy
    const esHoy = isToday(selectedDate);

    // Calcular si es pasado/futuro
    const hoy = new Date();
    const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const [y, m, d] = selectedDate.split('-').map(Number);
    const fechaSinHora = new Date(y, m - 1, d);
    const esPasado = fechaSinHora.getTime() < hoySinHora.getTime();
    const esFuturo = fechaSinHora.getTime() > hoySinHora.getTime();

    // Hora actual en formato HH:mm
    const horaActual = `${String(hoy.getHours()).padStart(2, '0')}:${String(hoy.getMinutes()).padStart(2, '0')}`;

    // Categorizar citas
    let anteriores: Cita[] = [];
    let enCurso: Cita[] = [];
    let proximas: Cita[] = [];

    if (esPasado) {
      anteriores = citas;
    } else if (esFuturo) {
      proximas = citas;
    } else {
      enCurso = citas.filter((c) => c.estado === 'EN_ATENCION');
      anteriores = citas.filter((c) => c.horaInicio < horaActual && c.estado !== 'EN_ATENCION');
      proximas = citas.filter((c) => c.horaInicio >= horaActual && c.estado !== 'EN_ATENCION');
    }

    return {
      total: citas.length,
      pendientes: citas.filter((c) => c.estado === 'PENDIENTE').length,
      confirmadas: citas.filter((c) => c.estado === 'CONFIRMADA').length,
      enEspera: citas.filter((c) => c.estado === 'EN_ESPERA').length,
      enAtencion: citas.filter((c) => c.estado === 'EN_ATENCION').length,
      atendidas: citas.filter((c) => c.estado === 'ATENDIDA').length,
      noAsistio: citas.filter((c) => c.estado === 'NO_ASISTIO').length,
      canceladas: citas.filter((c) => c.estado === 'CANCELADA').length,
      proxima: citas.find((c) => ['PENDIENTE', 'CONFIRMADA', 'EN_ATENCION'].includes(c.estado)),
      citas: citas.slice(0, 10),
      anteriores,
      enCurso,
      proximas,
      esHoy,
    };
  }, [citas, selectedDate]);

  return {
    data,
    loading,
    // Funciones helper para navegación de fechas
    goToday: () => todayStr(),
    addDays: (dias: number) => addDaysStr(selectedDate, dias),
  };
}

/**
 * Verifica si una fecha (YYYY-MM-DD) es hoy
 */
function isToday(fechaStr: string): boolean {
  const hoy = new Date();
  const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const [y, m, d] = fechaStr.split('-').map(Number);
  const fechaSinHora = new Date(y, m - 1, d);
  return fechaSinHora.getTime() === hoySinHora.getTime();
}
