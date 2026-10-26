export interface Provincia {
  codigo: string;
  nombre: string;
}

export interface Canton {
  codigo: string;
  nombre: string;
  provinciaCodigo: string;
}

export interface Parroquia {
  codigo: string;
  nombre: string;
  cantonCodigo: string;
}

export interface Slot {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  estado: 'DISPONIBLE' | 'OCUPADO' | 'NO_LABORAL' | 'FERIADO';
  ocupadoPor?: string;
}

export interface Horario {
  id: string;
  especialistaId: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
  consultorioId?: string;
  sedeId?: string;
  consultorio?: Consultorio;
  sede?: Sede;
}

export interface Feriado {
  id: string;
  fecha: string;
  nombre: string;
  activo?: boolean;
}

export interface Consultorio {
  id: string;
  nombre: string;
  sedeId?: string;
  activo: boolean;
  sede?: string | Sede;
}

export interface Sede {
  id: string;
  nombre: string;
  direccion: string;
  activo: boolean;
}
