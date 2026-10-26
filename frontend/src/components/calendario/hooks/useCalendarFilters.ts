import { useState, useCallback, useMemo } from 'react';
import type { UsuarioConEspecialista, EventoCalendario } from '@/types/api';

export function useCalendarFilters(especialistas: UsuarioConEspecialista[], selectedIds: Set<string>) {
  const [collapsedEspecialistas, setCollapsedEspecialistas] = useState<Set<string>>(new Set());
  const [busySpecialists, setBusySpecialists] = useState<Set<string>>(new Set());

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedEspecialistas((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const filteredEspecialistas = useMemo(
    () => especialistas.filter((e) => selectedIds.has(e.especialista.id)),
    [especialistas, selectedIds]
  );

  const totalEvents = useMemo(
    () => especialistas.reduce((acc, e) => acc + (busySpecialists.has(e.especialista.id) ? 1 : 0), 0),
    [especialistas, busySpecialists]
  );

  return {
    collapsedEspecialistas,
    busySpecialists,
    setBusySpecialists,
    toggleCollapse,
    filteredEspecialistas,
    totalEvents,
  };
}
