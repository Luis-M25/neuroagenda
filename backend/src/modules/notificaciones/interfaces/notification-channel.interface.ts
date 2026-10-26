export interface INotificacionParams {
  usuarioId: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  refId?: string;
  refTipo?: string; // "cita" | "consulta" | "paciente"
}

export interface INotificationChannel {
  readonly name: string;
  enviarConfirmacionCita(contact: string, data: CitaConfirmacionData): Promise<unknown>;
  notificarInasistencia(contact: string, data: InasistenciaData): Promise<unknown>;
  enviarRecordatorio(contact: string, data: RecordatorioData): Promise<unknown>;
  enviar(params: INotificacionParams): Promise<void>;
}

export interface CitaConfirmacionData {
  paciente: string;
  especialista: string;
  especialidad: string;
  fecha: string;
  hora: string;
  lugar: string;
}

export interface InasistenciaData {
  paciente: string;
  especialidad: string;
  contador: number;
  severidad: string;
}

export interface RecordatorioData {
  pacienteNombre: string;
  hora: string;
  lugar: string;
}
