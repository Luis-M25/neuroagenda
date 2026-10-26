import { useState, useCallback, useEffect, useRef } from 'react';
import { pacientesApi } from '@/lib/api-client';

export function usePacienteSearch() {
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [pacientesResult, setPacientesResult] = useState<any[]>([]);
  const [searchingPaciente, setSearchingPaciente] = useState(false);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const searchPaciente = useCallback(async (q: string) => {
    if (!q.trim()) {
      setPacientesResult([]);
      return;
    }
    setSearchingPaciente(true);
    try {
      if (/^\d+$/.test(q.trim())) {
        const res = await pacientesApi.findByIdentificacion(q.trim());
        setPacientesResult(res ? [res] : []);
      } else {
        const res = await pacientesApi.getAll({ nombre: q.trim() });
        setPacientesResult(Array.isArray(res) ? res : []);
      }
    } catch {
      setPacientesResult([]);
    } finally {
      setSearchingPaciente(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!busquedaPaciente.trim()) {
      setPacientesResult([]);
      return;
    }
    searchTimerRef.current = setTimeout(() => searchPaciente(busquedaPaciente), 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [busquedaPaciente, searchPaciente]);

  const selectPaciente = useCallback((p: any, setWizard: (w: any) => void, setWizardStep: (s: number) => void, setWizardErrors: (e: any) => void) => {
    setWizard((prev: any) => ({
      ...prev,
      pacienteId: p.id,
      pacienteNombre: `${p.nombres} ${p.apellidos}`,
      pacienteIdentificacion: p.numeroIdentificacion,
    }));
    setWizardErrors({});
    setWizardStep(2);
  }, []);

  return {
    busquedaPaciente,
    setBusquedaPaciente,
    pacientesResult,
    setPacientesResult,
    searchingPaciente,
    setSearchingPaciente,
    searchPaciente,
    selectPaciente,
  };
}