import { apiClient } from './client';

export interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  refId?: string;
  refTipo?: string; // "cita" | "consulta" | "paciente"
  leida: boolean;
  createdAt: string;
}

export const notificacionesApi = {
  listar: () => apiClient<Notificacion[]>('/notificaciones'),
  contarNoLeidas: () => apiClient<{ count: number }>('/notificaciones/no-leidas'),
  marcarLeida: (id: string) =>
    apiClient<void>(`/notificaciones/${id}/leida`, { method: 'PATCH' }),
  marcarTodasLeidas: () =>
    apiClient<void>('/notificaciones/leer-todas', { method: 'PATCH' }),
};