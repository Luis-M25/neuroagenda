import { apiClient, getAccessToken } from './client';
import type { DashboardData, ReporteInasistencia } from '@/types/api';
import type { ReportePaginado, AsistenciaPacienteReporte, AsistenciasFiltros, RegistroHcReporte, RegistroHcFiltros } from '@/types/reportes';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface CitasPorEspecialista {
  especialistaId: string;
  especialista: string;
  totalCitas: number;
  atendidas: number;
  noAsistio: number;
}

export const reportesApi = {
  getDashboard: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params);
    return apiClient<DashboardData>(`/reportes/dashboard?${query.toString()}`);
  },
  getNoAsistidos: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params);
    return apiClient<ReporteInasistencia[]>(`/reportes/no-asistidos?${query.toString()}`);
  },
  getCitasPorEspecialista: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params);
    return apiClient<CitasPorEspecialista[]>(`/reportes/citas-por-especialista?${query.toString()}`);
  },
  getAsistenciasPorPaciente: (params?: Partial<AsistenciasFiltros>) => {
    const query = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params ?? {})
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => [k, String(v)])
      )
    );
    return apiClient<ReportePaginado<AsistenciaPacienteReporte>>(`/reportes/asistencias-por-paciente?${query.toString()}`);
  },
  getRegistroHc: (params?: Partial<RegistroHcFiltros>) => {
    const query = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params ?? {})
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => [k, String(v)])
      )
    );
    return apiClient<ReportePaginado<RegistroHcReporte>>(`/reportes/registro-hc?${query.toString()}`);
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
