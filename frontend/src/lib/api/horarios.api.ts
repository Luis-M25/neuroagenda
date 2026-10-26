import { apiClient } from './client';
import type { Horario, Feriado, Consultorio, Sede, Slot } from '@/types/api';

interface Especialidad {
  id: string;
  nombre: string;
  activo: boolean;
}

export const horariosApi = {
  getByEspecialista: (especialistaId: string, todos?: boolean) =>
    apiClient<Horario[]>(`/horarios?especialistaId=${especialistaId}${todos ? '&todos=true' : ''}`),
  getDisponibles: (especialistaId: string, fecha: string, pacienteId?: string, tienePasantes?: boolean, pasanteCedula?: string) =>
    apiClient<Slot[]>(`/horarios/disponibles?especialistaId=${especialistaId}&fecha=${fecha}${pacienteId ? `&pacienteId=${pacienteId}` : ''}${tienePasantes ? '&tienePasantes=true' : ''}${pasanteCedula ? `&pasanteCedula=${pasanteCedula}` : ''}`),
  create: (data: Partial<Horario>) =>
    apiClient<Horario>('/horarios', { method: 'POST', body: JSON.stringify(data) }),
  createBatch: (data: Partial<Horario>[]) =>
    apiClient<Horario[]>('/horarios/batch', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Horario>) =>
    apiClient<Horario>(`/horarios/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  toggleActive: (id: string) =>
    apiClient<Horario>(`/horarios/${id}/toggle`, { method: 'PATCH' }),
  remove: (id: string) =>
    apiClient<void>(`/horarios/${id}`, { method: 'DELETE' }),
};

export const feriadosApi = {
  getAll: () => apiClient<Feriado[]>('/feriados'),
  create: (data: { fecha: string; nombre: string }) =>
    apiClient<Feriado>('/feriados', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Feriado>) =>
    apiClient<Feriado>(`/feriados/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) =>
    apiClient<void>(`/feriados/${id}`, { method: 'DELETE' }),
};

export const consultoriosApi = {
  getAll: (activo?: boolean) => {
    const query = activo !== undefined ? `?activo=${activo}` : '';
    return apiClient<Consultorio[]>(`/consultorios${query}`);
  },
  getById: (id: string) => apiClient<Consultorio>(`/consultorios/${id}`),
  create: (data: Partial<Consultorio>) =>
    apiClient<Consultorio>('/consultorios', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Consultorio>) =>
    apiClient<Consultorio>(`/consultorios/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) =>
    apiClient<void>(`/consultorios/${id}`, { method: 'DELETE' }),
};

export const sedesApi = {
  getAll: (activo?: boolean) => {
    const query = activo !== undefined ? `?activo=${activo}` : '';
    return apiClient<Sede[]>(`/sedes${query}`);
  },
  getById: (id: string) => apiClient<Sede>(`/sedes/${id}`),
  create: (data: Partial<Sede>) =>
    apiClient<Sede>('/sedes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Sede>) =>
    apiClient<Sede>(`/sedes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) =>
    apiClient<void>(`/sedes/${id}`, { method: 'DELETE' }),
};

export const especialidadesApi = {
  getAll: (activo?: boolean) => {
    const query = activo !== undefined ? `?activo=${activo}` : '';
    return apiClient<Especialidad[]>(`/especialidades${query}`);
  },
  getById: (id: string) => apiClient<Especialidad>(`/especialidades/${id}`),
  create: (data: Partial<Especialidad>) =>
    apiClient<Especialidad>('/especialidades', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Especialidad>) =>
    apiClient<Especialidad>(`/especialidades/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) =>
    apiClient<void>(`/especialidades/${id}`, { method: 'DELETE' }),
};
