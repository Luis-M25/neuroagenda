import { apiClient } from './client';

export const auditorApi = {
  listarHc: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params);
    return apiClient<any>(`/auditor/hce?${query.toString()}`);
  },
  getHcCompleta: (consultaId: string) => apiClient<any>(`/auditor/hce/${consultaId}`),
  revisarHc: (consultaId: string, data: { estado: string; observacion?: string }) =>
    apiClient<any>(`/auditor/hce/${consultaId}/revisar`, { method: 'POST', body: JSON.stringify(data) }),
  listarEspecialistas: () => apiClient<any[]>('/auditor/especialistas'),
  getEstadisticas: () => apiClient<any>('/auditor/estadisticas'),
};
