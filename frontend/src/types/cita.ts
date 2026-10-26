export type EstadoCita =
  | 'PENDIENTE' | 'CONFIRMADA' | 'EN_ESPERA' | 'EN_ATENCION'
  | 'ATENDIDA' | 'NO_ASISTIO' | 'CANCELADA' | 'REAGENDADA' | 'RESERVADO';

export interface CitaModificacion {
  id: string;
  citaId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  notasModificacion?: string;
  modificadaPor: { email: string };
  createdAt: string;
}

export interface CitaResumen {
  id: string;
  pacienteId?: string;
  especialistaId?: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  duracionMinutos?: number;
  especialidad?: string;
  lugar?: string;
  motivo?: string;
  estado: EstadoCita;
  notasModificacion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CitaDerivada extends CitaResumen {
  paciente: { id: string; nombres: string; apellidos: string };
}

export interface Cita {
  id: string;
  pacienteId: string;
  paciente: Paciente;
  especialistaId: string;
  especialista: Especialista;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  especialidad: string;
  lugar: string;
  motivo: string;
  estado: EstadoCita;
  notasModificacion?: string;
  fechaModificacion?: string;
  modificadaPor?: { email: string };
  modificaciones?: CitaModificacion[];
  canceladaPor?: 'ADMIN' | 'PACIENTE';
  motivoCancelacion?: string;
  fechaCancelacion?: string;
  slotLiberado?: boolean;
  citaOriginal?: CitaResumen;
  citaReagendada?: CitaResumen;
  citasDerivadas?: CitaDerivada[];
  createdAt: string;
  updatedAt: string;
}

export interface CitaFallback {
  id: string;
  citaId: string;
  estado: EstadoCita;
  especialista: string;
  especialistaId: string;
  especialidad: string;
  paciente: string;
  pacienteTelefono?: string;
  motivo: string;
  lugar: string;
  horaInicio: string;
  fecha: string;
}

export interface EditFormCita {
  especialistaId: string;
  especialidad: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  lugar: string;
  motivo: string;
  notasModificacion: string;
}

export interface UpdateCitaPayload {
  fecha?: string;
  horaInicio?: string;
  horaFin?: string;
  especialistaId?: string;
  especialidad?: string;
  lugar?: string;
  motivo?: string;
  notasModificacion?: string;
}

export interface UpdateEstadoPayload {
  estado: EstadoCita;
  notaEspecialista?: string;
  motivoCancelacion?: string;
  canceladaPor?: 'ADMIN' | 'PACIENTE';
}

export interface CitasResponse {
  total: number;
  citas: Cita[];
}

export interface CitasDashboardData {
  total: number;
  pendientes: number;
  confirmadas: number;
  enEspera: number;
  enAtencion: number;
  atendidas: number;
  noAsistio: number;
  canceladas: number;
  proxima?: Cita;
  citas: Cita[];
  anteriores: Cita[];
  enCurso: Cita[];
  proximas: Cita[];
  esHoy: boolean;
}

export interface DashboardData {
  totalCitas: number;
  citasHoy: number;
  pacientesAtendidos: number;
  inasistencias: number;
  citasPorEstado: Record<string, number>;
  proximasCitas: Cita[];
}

import type { Paciente } from './paciente';
import type { Especialista } from './especialista';
