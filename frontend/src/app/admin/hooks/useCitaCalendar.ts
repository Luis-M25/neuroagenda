import { useState, useCallback, useEffect } from 'react';
import { citasApi, feriadosApi, especialistasApi } from '@/lib/api-client';
import { toast } from 'sonner';
import type { ESTADOS_CITA } from '@/lib/utils';

export interface DayStatus {
  label: string;
  color: string;
  clickable: boolean;
  title: string;
}

interface UseCitaCalendarProps {
  wizardEspecialistaId: string;
  calMonth: number;
  calYear: number;
  citasDelMes: any[];
  feriados: any[];
  bloqueos: any[];
  horarioSemanal: any[];
}

export function useCitaCalendar({
  wizardEspecialistaId,
  calMonth,
  calYear,
  citasDelMes,
  feriados,
  bloqueos,
  horarioSemanal,
}: UseCitaCalendarProps) {
  const [citasDelMesState, setCitasDelMesState] = useState(citasDelMes);
  const [feriadosState, setFeriadosState] = useState(feriados);
  const [bloqueosState, setBloqueosState] = useState(bloqueos);

  useEffect(() => {
    setCitasDelMesState(citasDelMes);
  }, [citasDelMes]);

  useEffect(() => {
    setFeriadosState(feriados);
  }, [feriados]);

  useEffect(() => {
    setBloqueosState(bloqueos);
  }, [bloqueos]);

  const loadCitasDelMes = useCallback(async (especialistaId: string, month: number, year: number) => {
    const inicio = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const fin = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    try {
      const res = await citasApi.getAll({ fechaInicio: inicio, fechaFin: fin, especialistaId });
      return res;
    } catch {
      return [];
    }
  }, []);

  const loadFeriados = useCallback(async () => {
    try {
      const res = await feriadosApi.getAll();
      const bloqueos = await especialistasApi.getAllBloqueos().catch(() => []);
      return { feriados: res, bloqueos };
    } catch {
      return { feriados: [], bloqueos: [] };
    }
  }, []);

  const getDayStatus = useCallback((day: number, esPasante?: boolean): DayStatus => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(calYear, calMonth, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj < today) return { label: 'Pasado', color: 'bg-gray-100 text-gray-300 line-through', clickable: false, title: 'Fecha ya pasada' };

    const diaSemana = dateObj.getDay();
    const trabaja = horarioSemanal.some((h: any) => h.diaSemana === diaSemana && h.activo === true);
    if (!trabaja) return { label: 'No laboral', color: 'bg-gray-50 text-gray-300 line-through', clickable: false, title: 'El especialista no trabaja este día' };

    const esFeriado = feriadosState.find((f: any) => {
      const fd = new Date(f.fecha);
      return fd.getFullYear() === calYear && fd.getMonth() === calMonth && fd.getDate() === day && f.activo;
    });
    if (esFeriado) return { label: 'Feriado', color: 'bg-orange-100 text-orange-700 border border-orange-300', clickable: false, title: `Feriado: ${esFeriado.nombre}` };

    const espId = wizardEspecialistaId;
    const diaBloqueado = espId ? bloqueosState.filter((b: any) => {
      const inicio = new Date(b.fechaInicio);
      const fin = b.fechaFin ? new Date(b.fechaFin) : new Date(8640000000000000);
      return dateObj >= inicio && dateObj <= fin && b.especialistas?.some((e: any) => e.especialistaId === espId || e.especialista?.id === espId);
    }) : [];
    if (diaBloqueado.length > 0) return { label: 'Bloqueado', color: 'bg-purple-100 text-purple-700 border border-purple-300', clickable: false, title: `Bloqueado: ${diaBloqueado[0].nombre}` };

    const citasDia = citasDelMesState.filter((c: any) => {
      const fechaStr = typeof c.fecha === 'string' ? c.fecha.slice(0, 10) : c.fecha.toISOString().slice(0, 10);
      const [fy, fm, fd] = fechaStr.split('-').map(Number);
      return fm === calMonth + 1 && fd === day && !['CANCELADA'].includes(c.estado);
    });

    // Calcular capacidad maxima del dia segun el horario del especialista
    const horariosDia = horarioSemanal.filter((h: any) => h.diaSemana === diaSemana && h.activo === true);
    let capacidadTotal = 0;
    for (const h of horariosDia) {
      const duracion = h.duracionMinutos || 60;
      const [hIni, mIni] = h.horaInicio.split(':').map(Number);
      const [hFin, mFin] = h.horaFin.split(':').map(Number);
      const totalMinutos = (hFin * 60 + mFin) - (hIni * 60 + mIni);
      capacidadTotal += Math.floor(totalMinutos / duracion);
    }

    const numCitas = citasDia.length;

    if (numCitas > 0) {
      // Si la cantidad de citas es >= a la capacidad calculada: dia lleno (rojo)
      const diaLleno = capacidadTotal > 0 && numCitas >= capacidadTotal;
      if (diaLleno) {
        return {
          label: 'Lleno',
          color: 'bg-red-100 text-red-700 border border-red-400 cursor-not-allowed',
          clickable: false,
          title: `Dia completo: ${numCitas}/${capacidadTotal} cita(s) agendadas`,
        };
      }
      return {
        label: `${numCitas} cita${numCitas > 1 ? 's' : ''}`,
        color: 'bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200 cursor-pointer',
        clickable: true,
        title: `${numCitas} cita(s) agendada(s). Quedan ${capacidadTotal - numCitas} slot(s). Click para ver horarios disponibles`,
      };
    }

    return { label: 'Disponible', color: 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200 cursor-pointer', clickable: true, title: 'Horarios disponibles' };
  }, [calYear, calMonth, feriadosState, bloqueosState, horarioSemanal, wizardEspecialistaId, citasDelMesState]);

  return {
    loadCitasDelMes,
    loadFeriados,
    getDayStatus,
  };
}