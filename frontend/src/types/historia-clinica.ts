export interface Consulta {
  id: string;
  pacienteId: string;
  especialistaId: string;
  fecha: string;
  datos: Record<string, any>;
}

export interface FormConfig {
  id: string;
  especialidad: string;
  formName: string;
  campos: Record<string, any>;
}

export interface Template {
  id: string;
  especialidad: string;
  formName: string;
  fieldName: string;
  nombre: string;
  valor: any;
}

export interface Diagnostico {
  id: string;
  consultaId: string;
  codigoCIE10: string;
  descripcion: string;
  tipo: string;
}

export interface Prescripcion {
  id: string;
  consultaId: string;
  medicamento: string;
  dosis: string;
  via?: string;
  frecuencia: string;
  duracion?: string;
}

export interface ResponsableCuidado {
  id: string;
  pacienteId: string;
  nombre: string;
  contacto?: string | null;
  parentesco?: string | null;
  activo: boolean;
  createdAt: string;
}

export interface OcupacionEscolaridad {
  id: string;
  pacienteId: string;
  ocupacionTexto?: string | null;
  ocupacionEtiquetas: string[];
  nivelAcademico?: string | null;
  escolaridadTexto?: string | null;
  escolaridadEtiquetas: string[];
  activo: boolean;
  registradoPorId?: string | null;
  responsables: ResponsableCuidado[];
  createdAt: string;
  updatedAt: string;
}

export interface ActividadFuncional {
  id: string;
  pacienteId: string;
  actividadSignificativa?: string | null;
  medidaIndependencia?: number | null;
  cambiosDesempeno?: string | null;
  actividadesVidaDiaria: string[];
  actividadesInstrumentales: string[];
  motricidadFina?: string | null;
  activo: boolean;
  registradoPorId?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Versión pediátrica: tipos propios (idénticos hoy, independientes para futuros cambios)
export interface OcupacionEscolaridadNino extends Omit<OcupacionEscolaridad, 'responsables'> {
  responsables: ResponsableCuidado[];
}

export interface ActividadFuncionalNino extends ActividadFuncional {}
