'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { permisosApi, getAccessToken } from './api-client';
import { getUser } from './auth';

export interface PermisosState {
  roles: string[];
  permisos: string[];
  loading: boolean;
  error: string | null;
}

function readFromUser(): { roles: string[]; permisos: string[] } {
  const u = getUser();
  return {
    roles: Array.isArray(u?.roles) ? u!.roles! : u?.rol ? [u.rol] : [],
    permisos: Array.isArray(u?.permisos) ? u!.permisos! : [],
  };
}

export function usePermisos() {
  const [state, setState] = useState<PermisosState>(() => ({
    ...{ roles: [], permisos: [] },
    ...readFromUser(),
    loading: false,
    error: null,
  }));

  const refresh = useCallback(async () => {
    if (!getAccessToken()) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await permisosApi.mios();
      const user = readFromUser();
      const combinedRoles = Array.from(new Set([...user.roles, ...(data.roles ?? [])]));
      setState({ roles: combinedRoles, permisos: data.permisos ?? [], loading: false, error: null });
    } catch (e: any) {
      setState((prev) => ({ ...prev, loading: false, error: e?.message ?? null }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const can = useCallback(
    (permiso: string) => {
      if (state.roles.includes('ADMIN') || state.roles.includes('ADMISION_PRINCIPAL')) return true;
      const user = getUser();
      if (user?.rol === 'ADMIN' || user?.rol === 'ADMISION_PRINCIPAL') return true;
      if (typeof window !== 'undefined') {
        try {
          const stored = JSON.parse(localStorage.getItem('user') || 'null');
          if (stored?.rol === 'ADMIN' || stored?.rol === 'ADMISION_PRINCIPAL') return true;
          if (Array.isArray(stored?.roles) && stored.roles.some((r: string) => r === 'ADMIN' || r === 'ADMISION_PRINCIPAL')) return true;
        } catch {}
      }
      return state.permisos.includes(permiso);
    },
    [state.roles, state.permisos],
  );

  const hasRole = useCallback(
    (role: string) => state.roles.includes(role),
    [state.roles],
  );

  return useMemo(
    () => ({ ...state, can, hasRole, refresh }),
    [state, can, hasRole, refresh],
  );
}
