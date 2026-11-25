import { apiClient, getAccessToken, refreshSession } from './client';
import type { DashboardData } from '@/types/api';
import type {
  AsistenciaPacienteReporte,
  AsistenciasFiltros,
  CitasPorEspecialistaReporte,
  PacienteConHc,
  RegistroHcFiltros,
  RegistroHcReporte,
  ReporteNoAsistidos,
  ReportePaginado,
  ResumenHcPaciente,
  TipoCsvReporte,
} from '@/types/reportes';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function buildQuery(params?: object): string {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  return query.toString();
}

function getFilename(disposition: string | null, fallback: string): string {
  if (!disposition) return fallback;
  const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8?.[1]) return decodeURIComponent(utf8[1]);
  const regular = disposition.match(/filename="?([^"]+)"?/i);
  return regular?.[1] || fallback;
}

interface DownloadedFile {
  filename: string;
  headers: Headers;
}

async function fetchAuthenticatedFile(path: string, fallbackFilename: string): Promise<DownloadedFile> {
  const request = () => {
    const token = getAccessToken();
    return fetch(`${API_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });
  };

  let response = await request();
  if (response.status === 401 && await refreshSession()) {
    response = await request();
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || 'No se pudo descargar el archivo');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const filename = getFilename(response.headers.get('Content-Disposition'), fallbackFilename);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
  return { filename, headers: response.headers };
}

export const reportesApi = {
  getDashboard: (params?: Record<string, string>) => {
    const query = buildQuery(params);
    return apiClient<DashboardData>(`/reportes/dashboard${query ? `?${query}` : ''}`);
  },

  getNoAsistidos: (params?: Record<string, string>) => {
    const query = buildQuery(params);
    return apiClient<ReporteNoAsistidos[]>(`/reportes/no-asistidos${query ? `?${query}` : ''}`);
  },

  getCitasPorEspecialista: (params?: Record<string, string>) => {
    const query = buildQuery(params);
    return apiClient<CitasPorEspecialistaReporte[]>(
      `/reportes/citas-por-especialista${query ? `?${query}` : ''}`,
    );
  },

  getAsistenciasPorPaciente: (params: AsistenciasFiltros = {}) => {
    const query = buildQuery(params);
    return apiClient<ReportePaginado<AsistenciaPacienteReporte>>(
      `/reportes/asistencias-por-paciente${query ? `?${query}` : ''}`,
    );
  },

  getRegistroHistoriasClinicas: (params: RegistroHcFiltros = {}) => {
    const query = buildQuery(params);
    return apiClient<ReportePaginado<RegistroHcReporte>>(
      `/reportes/historias-clinicas${query ? `?${query}` : ''}`,
    );
  },

  buscarPacientesConHc: (q: string, limit = 15) => {
    const query = buildQuery({ q, limit });
    return apiClient<PacienteConHc[]>(`/reportes/historias-clinicas/pacientes?${query}`);
  },

  getResumenHcPaciente: (pacienteId: string) =>
    apiClient<ResumenHcPaciente>(
      `/reportes/historias-clinicas/paciente/${encodeURIComponent(pacienteId)}/resumen`,
    ),

  descargarHcPacienteZip: async (pacienteId: string, identificacion: string) => {
    const result = await fetchAuthenticatedFile(
      `/reportes/historias-clinicas/paciente/${encodeURIComponent(pacienteId)}/zip`,
      `HC_${identificacion}_${new Date().toISOString().split('T')[0]}.zip`,
    );
    return {
      incluidas: Number(result.headers.get('X-HC-Incluidas') || 0),
      excluidas: Number(result.headers.get('X-HC-Excluidas') || 0),
      noDisponibles: Number(result.headers.get('X-HC-No-Disponibles') || 0),
    };
  },

  exportarCsv: async (tipo: TipoCsvReporte, params?: Record<string, unknown>) => {
    const query = buildQuery({ tipo, ...params });
    return fetchAuthenticatedFile(
      `/reportes/exportar-csv?${query}`,
      `${tipo}-${new Date().toISOString().split('T')[0]}.csv`,
    );
  },
};
