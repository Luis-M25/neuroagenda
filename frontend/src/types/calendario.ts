export interface EventoCalendario {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    citaId: string;
    estado: import('./cita').EstadoCita;
    especialista: string;
    especialistaId: string;
    especialidad: string;
    paciente: string;
    pacienteTelefono?: string;
    motivo: string;
    lugar: string;
  };
}
