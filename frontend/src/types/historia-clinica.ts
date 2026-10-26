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
