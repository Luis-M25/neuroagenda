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
    const numCitas = citasDia.length;
    if (numCitas > 0) {
      return { label: `${numCitas} cita${numCitas > 1 ? 's' : ''}`, color: 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200 cursor-pointer', clickable: true, title: `${numCitas} cita(s) agendada(s). Click para ver horarios disponibles` };
    }

    return { label: 'Disponible', color: 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200 cursor-pointer', clickable: true, title: 'Horarios disponibles' };
  }, [calYear, calMonth, feriadosState, bloqueosState, horarioSemanal, wizardEspecialistaId, citasDelMesState]);

  return {
    loadCitasDelMes,
    loadFeriados,
    getDayStatus,
  };
}