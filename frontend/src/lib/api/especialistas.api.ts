import { apiClient } from './client';
import type { Especialista, BloqueoGrupal, UsuarioConEspecialista } from '@/types/api';

export const especialistasApi = {
  getAll: (params?: { activo?: boolean; especialidad?: string }) => {
    const query = new URLSearchParams();
    if (params?.activo !== undefined) query.set('activo', String(params.activo));
    if (params?.especialidad) query.set('especialidad', params.especialidad);
    const qs = query.toString();
    return apiClient<UsuarioConEspecialista[]>(`/especialistas${qs ? '?' + qs : ''}`);
  },
  getById: (id: string) => apiClient<Especialista>(`/especialistas/${id}`),
  findByIdentificacion: (numero: string) => apiClient<Especialista>(`/especialistas/identificacion/${numero}`),
  getEspecialidades: () => apiClient<string[]>('/especialistas/especialidades'),
  create: (data: Partial<Especialista>) =>
    apiClient<Especialista>('/especialistas', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Especialista>) =>
    apiClient<Especialista>(`/especialistas/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateEstado: (id: string, data: Partial<Especialista>) =>
    apiClient<Especialista>(`/especialistas/${id}/estado`, { method: 'PATCH', body: JSON.stringify(data) }),
  createBloqueoGrupal: (data: Partial<BloqueoGrupal>) =>
    apiClient<BloqueoGrupal>('/especialistas/bloqueo-grupal', { method: 'POST', body: JSON.stringify(data) }),
  updateBloqueoGrupal: (id: string, data: Partial<BloqueoGrupal>) =>
    apiClient<BloqueoGrupal>(`/especialistas/bloqueo-grupal/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBloqueoGrupal: (id: string) =>
    apiClient<void>(`/especialistas/bloqueo-grupal/${id}`, { method: 'DELETE' }),
  getAllBloqueos: () =>
    apiClient<BloqueoGrupal[]>('/especialistas/bloqueo-grupal'),
  revealPassword: (usuarioId: string, password: string, motivo?: string) =>
    apiClient<{ ok: boolean }>(`/usuarios/${usuarioId}/reveal`, {
      method: 'POST',
      body: JSON.stringify({ password, motivo }),
    }),
};

export const pasantesApi = {
  getByEspecialista: (especialistaId: string) => apiClient<any[]>(`/pasantes/especialista/${especialistaId}`),
  create: (especialistaId: string, data: any) => apiClient<any>(`/pasantes/especialista/${especialistaId}`, { method: 'POST', body: data }),
  update: (id: string, data: any) => apiClient<any>(`/pasantes/${id}`, { method: 'PATCH', body: data }),
  remove: (id: string) => apiClient<any>(`/pasantes/${id}`, { method: 'DELETE' }),
};
