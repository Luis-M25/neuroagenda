import { apiClient } from './client';

export const usuariosApi = {
  checkIdentificacion: (numero: string) =>
    apiClient<{ existe: boolean; validacion: { valid: boolean; message?: string } }>(
      `/usuarios/check-identificacion/${encodeURIComponent(numero)}`,
    ),
  reveal: (id: string, password: string, motivo?: string) =>
    apiClient<{ ok: boolean; at: string }>(
      `/usuarios/${id}/reveal`,
      { method: 'POST', body: JSON.stringify({ password, motivo }) },
    ),
};
