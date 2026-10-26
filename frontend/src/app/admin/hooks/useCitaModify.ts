import { useState, useCallback } from 'react';
import { citasApi, horariosApi, feriadosApi } from '@/lib/api-client';
import { toast } from 'sonner';

export function useCitaModify() {
  const [showModify, setShowModify] = useState<any>(null);
  const [modifyData, setModifyData] = useState({ fecha: '', horaInicio: '', horaFin: '', notasModificacion: '' });
  const [modifyErrors, setModifyErrors] = useState<Record<string, string>>({});
  const [modCalMonth, setModCalMonth] = useState(new Date().getMonth());
  const [modCalYear, setModCalYear] = useState(new Date().getFullYear());
  const [modCitasMes, setModCitasMes] = useState<any[]>([]);
  const [modSlots, setModSlots] = useState<any[]>([]);
  const [modLoadingSlots, setModLoadingSlots] = useState(false);
  const [modFeriados, setModFeriados] = useState<any[]>([]);
  const [modHorarioSemanal, setModHorarioSemanal] = useState<any[]>([]);

  const openModifyModal = useCallback(async (c: any) => {
    setShowModify(c);
    setModifyErrors({});
    setModifyData({
      fecha: c.fecha?.split('T')[0] || '',
      horaInicio: c.horaInicio,
      horaFin: c.horaFin,
      notasModificacion: c.notasModificacion || '',
    });
    const d = new Date(c.fecha);
    setModCalMonth(d.getMonth());
    setModCalYear(d.getFullYear());
    setModSlots([]);
    const espId = c.especialistaId || c.especialista?.id;
    if (espId) {
      const inicio = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const fin = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const [citas, fer, hor] = await Promise.all([
        citasApi.getAll({ fechaInicio: inicio, fechaFin: fin, especialistaId: espId }).catch(() => []),
        feriadosApi.getAll().catch(() => []),
        horariosApi.getByEspecialista(espId, true).catch(() => []),
      ]);
      setModCitasMes(Array.isArray(citas) ? citas : []);
      setModFeriados(Array.isArray(fer) ? fer : []);
      setModHorarioSemanal(Array.isArray(hor) ? hor : []);
    }
  }, []);

  const loadModSlots = useCallback(async (fecha: string, espId: string) => {
    setModLoadingSlots(true);
    try {
      const res = await horariosApi.getDisponibles(espId, fecha);
      setModSlots(res);
    } catch {
      setModSlots([]);
    } finally {
      setModLoadingSlots(false);
    }
  }, []);

  const validateModify = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!modifyData.fecha) errs.fecha = 'La fecha es obligatoria';
    else if (modifyData.fecha < new Date().toISOString().split('T')[0]) errs.fecha = 'La fecha no puede ser pasada';
    if (!modifyData.horaInicio) errs.horaInicio = 'La hora de inicio es obligatoria';
    if (!modifyData.horaFin) errs.horaFin = 'La hora de fin es obligatoria';
    if (modifyData.horaInicio && modifyData.horaFin && modifyData.horaInicio >= modifyData.horaFin) {
      errs.horaFin = 'La hora de fin debe ser mayor a la de inicio';
    }
    setModifyErrors(errs);
    return Object.keys(errs).length === 0;
  }, [modifyData]);

  const handleModify = useCallback(async (onSuccess?: () => void) => {
    if (!showModify) return;
    if (!validateModify()) return;
    try {
      const cambios: string[] = [];
      if (modifyData.fecha !== showModify.fecha?.split('T')[0]) cambios.push('fecha');
      if (modifyData.horaInicio !== showModify.horaInicio || modifyData.horaFin !== showModify.horaFin) cambios.push('horario');
      const nota = modifyData.notasModificacion.trim() || `Cambio de ${cambios.join(' y ')}`;
      const payload: any = {
        fecha: modifyData.fecha,
        horaInicio: modifyData.horaInicio,
        horaFin: modifyData.horaFin,
        notasModificacion: nota,
      };
      await citasApi.update(showModify.id, payload);
      toast.success('Cita modificada');
      setShowModify(null);
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message);
    }
  }, [showModify, modifyData, validateModify]);

  return {
    showModify,
    setShowModify,
    modifyData,
    setModifyData,
    modifyErrors,
    setModifyErrors,
    modCalMonth,
    setModCalMonth,
    modCalYear,
    setModCalYear,
    modCitasMes,
    setModCitasMes,
    modSlots,
    setModSlots,
    modLoadingSlots,
    setModLoadingSlots,
    modFeriados,
    setModFeriados,
    modHorarioSemanal,
    setModHorarioSemanal,
    openModifyModal,
    loadModSlots,
    handleModify,
  };
}