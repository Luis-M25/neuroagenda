export interface Paciente {
  id: string;
  nombres: string;
  apellidos: string;
  identificacion: string;
  numeroIdentificacion?: string;
  email?: string;
  telefono?: string;
  fechaNacimiento?: string;
  bloqueado?: boolean;
  motivoBloqueo?: string;
}

export interface InasistenciaPaciente {
  pacienteId: string;
  cantidad: number;
  especialidad: string;
}

export interface ReporteInasistencia extends InasistenciaPaciente {
  paciente: {
    nombres: string;
    apellidos: string;
    identificacion: string;
    telefono?: string;
  };
}
