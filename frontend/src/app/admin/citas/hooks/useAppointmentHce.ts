'use client';

import { useState, useCallback } from 'react';
import { hceApi } from '@/lib/api-client';

export function useAppointmentHce() {
  const [detailTab, setDetailTab] = useState<'cita' | 'hce'>('cita');
  const [hceData, setHceData] = useState<any>(null);
  const [hceLoading, setHceLoading] = useState(false);
  const [expandedHce, setExpandedHce] = useState<Set<string>>(new Set());

  const loadHceData = useCallback(async (cita: any) => {
    setHceLoading(true);
    setHceData(null);
    try {
      const pacId = cita.pacienteId || cita.paciente?.id;
      if (!pacId) return;
      const historial = await hceApi.getHistorialPaciente(pacId);
      setHceData(historial);
    } catch { }
    finally { setHceLoading(false); }
  }, []);

  return {
    detailTab,
    setDetailTab,
    hceData,
    hceLoading,
    expandedHce,
    setExpandedHce,
    loadHceData,
  };
}
