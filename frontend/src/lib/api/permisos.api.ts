import { apiClient } from './client';

export interface PermisoSummary {
  id: string;
  clave: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
}

export const permisosApi = {
  listar: () => apiClient<PermisoSummary[]>('/permisos'),
  mios: () => apiClient<{ roles: string[]; permisos: string[] }>('/permisos/me'),
  listarRoles: () => apiClient<any[]>('/permisos/roles'),
  obtenerPermisosRol: (rolId: string) => apiClient<any>(`/permisos/roles/${rolId}`),
  actualizarPermisosRol: (rolId: string, permisoIds: string[]) =>
    apiClient<any>(`/permisos/roles/${rolId}/permisos`, {
      method: 'PUT',
      body: JSON.stringify({ permisoIds }),
    }),
};
