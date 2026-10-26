export type {
  ApiResponse,
  Pagination,
  Option,
  SelectItem,
} from './common';

export type {
  LoginRequest,
  LoginResponse,
  AuthProfile,
  User,
} from './auth';

export type {
  Admin,
  Portero,
} from './admin';

export type {
  Paciente,
  InasistenciaPaciente,
  ReporteInasistencia,
} from './paciente';

export type {
  Especialista,
  BloqueoGrupal,
  UsuarioConEspecialista,
} from './especialista';

export type {
  EstadoCita,
  CitaModificacion,
  CitaResumen,
  CitaDerivada,
  Cita,
  CitaFallback,
  EditFormCita,
  UpdateCitaPayload,
  UpdateEstadoPayload,
  CitasResponse,
  CitasDashboardData,
  DashboardData,
} from './cita';

export type {
  EventoCalendario,
} from './calendario';

export type {
  Provincia,
  Canton,
  Parroquia,
  Horario,
  Feriado,
  Consultorio,
  Sede,
  Slot,
} from './ubicacion';

export type {
  Consulta,
  FormConfig,
  Template,
  Diagnostico,
  Prescripcion,
} from './historia-clinica';
