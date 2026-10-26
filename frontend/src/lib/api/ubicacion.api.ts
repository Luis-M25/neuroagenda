import { apiClient } from './client';
import type { Provincia, Canton } from '@/types/api';

export const ubicacionApi = {
  getProvincias: () => apiClient<Provincia[]>('/ubicacion/provincias'),
  getCantones: (codigo: string) => apiClient<Canton[]>(`/ubicacion/cantones/${codigo}`),
};
