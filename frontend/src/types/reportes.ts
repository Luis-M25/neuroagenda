export interface ReportePaginado<T> {
  total: number;
  page: number;
  limit: number;
  items: T[];
}

export interface PacienteReporte {
  id: string;
  nombres: string;
  apellidos: string;
  numeroIdentificacion: string;
}

export interface EspecialistaReporte {
  id?: string;
  nombres: string;
  apellidos: string;
  especialidad: string;
}

export interface AsistenciaPacienteReporte {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  especialidad: string;
  lugar: string;
  paciente: PacienteReporte;
  especialista: EspecialistaReporte;
}

export interface RegistroHcReporte {
  id: string;
  numeroConsulta: number | null;
  createdAt: string;
  firmada: boolean;
  firmadaEn: string | null;
  archivoPdfUrl: string | null;
  fechaAtencion: string;
  horaAtencion: string | null;
  estadoFirma: 'FIRMADA' | 'PENDIENTE';
  pdfDisponible: boolean;
  paciente: PacienteReporte;
  especialista: EspecialistaReporte;
}

export interface PacienteConHc extends PacienteReporte {
  totalHc: number;
  firmadas: number;
  pendientes: number;
}

export interface ResumenHcPaciente {
  paciente: PacienteReporte;
  totalHc: number;
  firmadas: number;
  pendientes: number;
  pdfNoDisponible: number;
  primeraFecha: string | null;
  ultimaFecha: string | null;
}

export interface ReporteNoAsistidos {
  paciente: PacienteReporte & { telefono?: string };
  especialidad: string;
  total: number;
  contador: number;
  ultimaInasistencia: string | null;
  citas: Array<{
    fecha: string;
    hora: string;
    especialista: string;
  }>;
}

export interface CitasPorEspecialistaReporte {
  especialistaId: string;
  especialista: string;
  especialidad: string;
  total: number;
  pendientes: number;
  confirmadas: number;
  atendidas: number;
  canceladas: number;
  noAsistieron: number;
}

export interface AsistenciasFiltros {
  pacienteId?: string;
  q?: string;
  estado?: string;
  fechaInicio?: string;
  fechaFin?: string;
  page?: number;
  limit?: number;
}

export interface RegistroHcFiltros {
  pacienteId?: string;
  q?: string;
  especialidad?: string;
  estadoFirma?: 'FIRMADA' | 'PENDIENTE';
  fechaInicio?: string;
  fechaFin?: string;
  page?: number;
  limit?: number;
}

export type TipoCsvReporte =
  | 'no-asistidos'
  | 'citas-por-especialista'
  | 'dashboard'
  | 'asistencias-por-paciente'
  | 'registro-hc';
