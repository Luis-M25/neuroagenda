import { useState, useCallback } from 'react';
import { horariosApi } from '@/lib/api-client';
import { toast } from 'sonner';

export function useCitaSlots() {
  const [selectedDaySlots, setSelectedDaySlots] = useState<any[]>([]);
  const [selectedDayStatus, setSelectedDayStatus] = useState('');
  const [loadingDay, setLoadingDay] = useState(false);
  const [slotsPorFecha, setSlotsPorFecha] = useState<Record<string, any[]>>({});
  const [slotSearch, setSlotSearch] = useState('');

  const loadDaySlots = useCallback(async (fecha: string, especialistaId: string, pacienteId?: string, tienePasantes?: boolean, pasanteCedula?: string) => {
    if (!especialistaId) return;
    setLoadingDay(true);
    try {
      const res = await horariosApi.getDisponibles(especialistaId, fecha, pacienteId, tienePasantes, pasanteCedula);
      setSelectedDaySlots(res);
      if (res.length === 0) {
        setSelectedDayStatus('No hay horarios disponibles');
      } else {
        setSelectedDayStatus('');
      }
      return res;
    } catch {
      setSelectedDaySlots([]);
      setSelectedDayStatus('Error al cargar horarios');
    } finally {
      setLoadingDay(false);
    }
  }, []);

  const loadSlotsForRecurrencia = useCallback(async (fecha: string, especialistaId: string, pacienteId?: string, tienePasantes?: boolean, pasanteCedula?: string) => {
    if (slotsPorFecha[fecha]) return slotsPorFecha[fecha];
    try {
      const res = await horariosApi.getDisponibles(especialistaId, fecha, pacienteId, tienePasantes, pasanteCedula);
      setSlotsPorFecha((prev) => ({ ...prev, [fecha]: res }));
      return res;
    } catch {
      setSlotsPorFecha((prev) => ({ ...prev, [fecha]: [] }));
      return [];
    }
  }, [slotsPorFecha]);

  const clearSlotsCache = useCallback(() => {
    setSlotsPorFecha({});
  }, []);

  return {
    selectedDaySlots,
    setSelectedDaySlots,
    selectedDayStatus,
    setSelectedDayStatus,
    loadingDay,
    setLoadingDay,
    slotsPorFecha,
    setSlotsPorFecha,
    slotSearch,
    setSlotSearch,
    loadDaySlots,
    loadSlotsForRecurrencia,
    clearSlotsCache,
  };
}