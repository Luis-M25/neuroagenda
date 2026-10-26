export interface Especialista {
  id: string;
  nombres: string;
  apellidos: string;
  identificacion: string;
  especialidad: string;
  activo: boolean;
  estado?: 'HABILITADO' | 'DESHABILITADO' | 'SUSPENDIDO_TEMPORAL';
  usuario?: { email?: string };
  sede?: string;
  consultorioPredeterminado?: string;
  fechaInicioSuspension?: string;
  fechaFinSuspension?: string;
  tienePasantes?: boolean;
  exists?: boolean;
  motivo?: string;
  colorCalendario?: string;
  codigoAlfabetico?: string;
}

export interface BloqueoGrupal {
  id: string;
  nombre: string;
  descripcion?: string;
  especialistaId?: string;
  inicio?: string;
  fin?: string;
  motivo?: string;
  fechaInicio: string;
  fechaFin?: string;
  especialistas: { id: string; nombres: string; apellidos: string }[];
  createdAt?: string;
}

export interface UsuarioConEspecialista {
  id: string;
  email: string;
  rol: string;
  activo: boolean;
  especialista: Especialista;
}
