import { apiClient } from './client';
import type { Admin, Portero } from '@/types/api';

export interface AuditorUser {
  id: string;
  email: string;
  nombres?: string;
  apellidos?: string;
  numeroIdentificacion?: string;
  activo?: boolean;
  createdAt?: string;
}

export const adminsApi = {
  getAll: () => apiClient<Admin[]>('/admins'),
  getById: (id: string) => apiClient<Admin>(`/admins/${id}`),
  create: (data: Partial<Admin>) =>
    apiClient<Admin>('/admins', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Admin>) =>
    apiClient<Admin>(`/admins/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updatePermisos: (id: string, permisos: string[]) =>
    apiClient<Admin>(`/admins/${id}/permisos`, { method: 'PATCH', body: JSON.stringify({ permisos }) }),
  remove: (id: string) =>
    apiClient<void>(`/admins/${id}`, { method: 'DELETE' }),
  getAllPorteros: () => apiClient<Portero[]>('/admins/porteros'),
  createPortero: (data: Partial<Portero>) =>
    apiClient<Portero>('/admins/porteros', { method: 'POST', body: JSON.stringify(data) }),
  removePortero: (id: string) =>
    apiClient<void>(`/admins/porteros/${id}`, { method: 'DELETE' }),
  getAllAuditores: () => apiClient<AuditorUser[]>('/admins/auditores'),
  createAuditor: (data: { nombres: string; apellidos: string; email: string; password: string; numeroIdentificacion: string }) =>
    apiClient<AuditorUser>('/admins/auditores', { method: 'POST', body: JSON.stringify(data) }),
  removeAuditor: (id: string) =>
    apiClient<void>(`/admins/auditores/${id}`, { method: 'DELETE' }),
  getAllEnfermeros: () => apiClient<AuditorUser[]>('/admins/enfermeros'),
  createEnfermero: (data: { nombres: string; apellidos: string; email: string; password: string; numeroIdentificacion: string }) =>
    apiClient<AuditorUser>('/admins/enfermeros', { method: 'POST', body: JSON.stringify(data) }),
  removeEnfermero: (id: string) =>
    apiClient<void>(`/admins/enfermeros/${id}`, { method: 'DELETE' }),
};

export const auditoriaApi = {
  listar: (params?: {
    usuarioId?: string;
    entidad?: string;
    accion?: string;
    desde?: string;
    hasta?: string;
    pagina?: number;
    limite?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.usuarioId) query.set('usuarioId', params.usuarioId);
    if (params?.entidad) query.set('entidad', params.entidad);
    if (params?.accion) query.set('accion', params.accion);
    if (params?.desde) query.set('desde', params.desde);
    if (params?.hasta) query.set('hasta', params.hasta);
    if (params?.pagina) query.set('pagina', String(params.pagina));
    if (params?.limite) query.set('limite', String(params.limite));
    return apiClient<any>(`/auditoria?${query.toString()}`);
  },
};
