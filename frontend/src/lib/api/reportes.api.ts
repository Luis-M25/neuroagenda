import { apiClient, getAccessToken } from './client';
import type { DashboardData } from '@/types/api';
import type {
  ReportePaginado,
  AsistenciaPacienteReporte,
  AsistenciasFiltros,
  RegistroHcReporte,
  RegistroHcFiltros,
  PacienteConHc,
  ResumenHcPaciente,
  ReporteNoAsistidos,
} from '@/types/reportes';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface CitasPorEspecialista {
  especialistaId: string;
  especialista: string;
  especialidad: string;
  total: number;
  pendientes: number;
  confirmadas: number;
  atendidas: number;
  canceladas: number;
  noAsistieron: number;
  // legacy compat
  totalCitas?: number;
  noAsistio?: number;
}

function toQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    )
  );
  return q.toString();
}

export const reportesApi = {
  getDashboard: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params);
    return apiClient<DashboardData>(`/reportes/dashboard?${query.toString()}`);
  },
  getNoAsistidos: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params);
    return apiClient<ReporteNoAsistidos[]>(`/reportes/no-asistidos?${query.toString()}`);
  },
  getCitasPorEspecialista: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params);
    return apiClient<CitasPorEspecialista[]>(`/reportes/citas-por-especialista?${query.toString()}`);
  },
  getAsistenciasPorPaciente: (params?: Partial<AsistenciasFiltros>) => {
    return apiClient<ReportePaginado<AsistenciaPacienteReporte>>(
      `/reportes/asistencias-por-paciente?${toQuery(params)}`
    );
  },
  getRegistroHc: (params?: Partial<RegistroHcFiltros>) => {
    return apiClient<ReportePaginado<RegistroHcReporte>>(
      `/reportes/registro-hc?${toQuery(params)}`
    );
  },
  getRegistroHistoriasClinicas: (params?: Partial<RegistroHcFiltros>) => {
    return apiClient<ReportePaginado<RegistroHcReporte>>(
      `/reportes/registro-hc?${toQuery(params)}`
    );
  },
  buscarPacientesConHc: (q: string) => {
    return apiClient<PacienteConHc[]>(`/reportes/pacientes-con-hc?q=${encodeURIComponent(q)}`);
  },
  getResumenHcPaciente: (pacienteId: string) => {
    return apiClient<ResumenHcPaciente>(`/reportes/resumen-hc-paciente/${pacienteId}`);
  },
  descargarHcPacienteZip: async (pacienteId: string, numeroIdentificacion: string) => {
    const token = getAccessToken();
    const res = await fetch(`${API_URL}/reportes/descargar-hc-paciente/${pacienteId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Error al descargar HC');
    // Si la respuesta es JSON (ej. error o resumen), parsearlo
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return res.json() as Promise<{ incluidas: number; excluidas: number; noDisponibles: number }>;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hc-${numeroIdentificacion}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { incluidas: 0, excluidas: 0, noDisponibles: 0 };
  },
  exportarCsv: async (tipo: string, params?: Record<string, string>) => {
    const query = new URLSearchParams({ tipo, ...params });
    const token = getAccessToken();
    const res = await fetch(`${API_URL}/reportes/exportar-csv?${query.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Error al exportar CSV');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tipo}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
