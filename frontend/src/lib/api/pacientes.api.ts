import { apiClient } from './client';
import type { Paciente, Consulta, InasistenciaPaciente, ReporteInasistencia } from '@/types/api';

export const pacientesApi = {
  getAll: (params?: { nombre?: string; identificacion?: string; bloqueado?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.nombre) query.set('nombre', params.nombre);
    if (params?.identificacion) query.set('identificacion', params.identificacion);
    if (params?.bloqueado !== undefined) query.set('bloqueado', String(params.bloqueado));
    return apiClient<Paciente[]>(`/pacientes?${query.toString()}`);
  },
  getById: (id: string) => apiClient<Paciente>(`/pacientes/${id}`),
  getHistorial: (id: string) => apiClient<Consulta[]>(`/pacientes/${id}/historial`),
  getInasistencias: (id: string) => apiClient<InasistenciaPaciente[]>(`/pacientes/${id}/inasistencias`),
  getReporteInasistencias: () => apiClient<ReporteInasistencia[]>('/pacientes/reporte-inasistencias'),
  findByIdentificacion: (numero: string) => apiClient<Paciente>(`/pacientes/identificacion/${numero}`),
  create: (data: Partial<Paciente>) =>
    apiClient<Paciente>('/pacientes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Paciente>) =>
    apiClient<Paciente>(`/pacientes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  bloquear: (id: string, motivo: string, especialidad?: string) =>
    apiClient<Paciente>(`/pacientes/${id}/bloquear`, {
      method: 'POST',
      body: JSON.stringify({ motivo, especialidad }),
    }),
  desbloquear: (id: string, especialidad?: string) =>
    apiClient<Paciente>(`/pacientes/${id}/desbloquear`, {
      method: 'POST',
      body: JSON.stringify({ especialidad }),
    }),
  cancelarProtocolo: (id: string, especialidad: string, motivo: string) =>
    apiClient<any>(`/pacientes/${id}/cancelar-protocolo`, {
      method: 'POST',
      body: JSON.stringify({ especialidad, motivo }),
    }),
};
