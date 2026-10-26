import { apiClient } from './client';
import type { Cita, EventoCalendario, UpdateEstadoPayload } from '@/types/api';

export const citasApi = {
  getAll: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params);
    return apiClient<Cita[]>(`/citas?${query.toString()}`);
  },
  getById: (id: string) => apiClient<Cita>(`/citas/${id}`),
  getHoy: () => apiClient<Cita[]>('/citas/hoy'),
  create: (data: Partial<Cita>) =>
    apiClient<Cita>('/citas', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Cita>) =>
    apiClient<Cita>(`/citas/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateEstado: (id: string, data: UpdateEstadoPayload) =>
    apiClient<Cita>(`/citas/${id}/estado`, { method: 'PATCH', body: JSON.stringify(data) }),
  reagendar: (id: string, data: { fecha: string; horaInicio: string; horaFin: string; notasModificacion?: string }) =>
    apiClient<Cita>(`/citas/${id}/reagendar`, { method: 'POST', body: JSON.stringify(data) }),
  reagendarMasivo: (data: { citas: { id: string; fecha: string; horaInicio: string; horaFin: string }[]; notasModificacion?: string }) =>
    apiClient<{ id: string; success: boolean; error?: string }[]>('/citas/reagendar/masivo', { method: 'POST', body: JSON.stringify(data) }),
  liberarHorario: (id: string) =>
    apiClient<Cita>(`/citas/${id}/liberar-horario`, { method: 'PATCH' }),
};

export const calendarioApi = {
  getEventos: (fechaInicio: string, fechaFin: string, especialistaId?: string) => {
    const query = new URLSearchParams({ fechaInicio, fechaFin });
    if (especialistaId) query.set('especialistaId', especialistaId);
    return apiClient<EventoCalendario[]>(`/calendario/eventos?${query.toString()}`);
  },
  bloquearDia: (data: { fecha: string; motivo: string; cancelarCitas?: boolean }) =>
    apiClient<any>('/calendario/bloquear-dia', { method: 'POST', body: JSON.stringify(data) }),
  actualizarBloqueo: (id: string, data: { motivo?: string; activo?: boolean }) =>
    apiClient<any>(`/calendario/bloquear-dia/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  eliminarBloqueo: (id: string) =>
    apiClient<any>(`/calendario/bloquear-dia/${id}`, { method: 'DELETE' }),
  getDiasBloqueados: (fechaInicio?: string, fechaFin?: string) => {
    const query = new URLSearchParams();
    if (fechaInicio) query.set('fechaInicio', fechaInicio);
    if (fechaFin) query.set('fechaFin', fechaFin);
    return apiClient<any[]>(`/calendario/dias-bloqueados?${query.toString()}`);
  },
  getTodasFechasBloqueadas: () =>
    apiClient<{ diasBloqueados: any[]; feriados: any[] }>('/calendario/dias-bloqueados/todas'),
};
