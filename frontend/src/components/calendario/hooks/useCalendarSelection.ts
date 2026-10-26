import { useState, useCallback } from 'react';
import type { UsuarioConEspecialista } from '@/types/api';

export function useCalendarSelection(especialistas: UsuarioConEspecialista[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const initAll = useCallback(() => {
    setSelectedIds(new Set(especialistas.map((u) => u.especialista.id)));
  }, [especialistas]);

  const toggleSpec = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === especialistas.length) return new Set();
      return new Set(especialistas.map((u) => u.especialista.id));
    });
  }, [especialistas]);

  return { selectedIds, toggleSpec, toggleAll, initAll };
}
