import { Injectable, Logger } from '@nestjs/common';
import { NotificacionesGateway } from '../websocket/notificaciones.gateway';
import {
  INotificationChannel,
  INotificacionParams,
  CitaConfirmacionData,
  InasistenciaData,
  RecordatorioData,
} from '../interfaces/notification-channel.interface';

@Injectable()
export class WebSocketChannel implements INotificationChannel {
  readonly name = 'websocket';
  private readonly logger = new Logger(WebSocketChannel.name);

  constructor(private gateway: NotificacionesGateway) {}

  async enviarConfirmacionCita(_contact: string, data: CitaConfirmacionData) {
    this.gateway.emitToAdmision('notificacion:cita-confirmada', data);
    return { dispatched: true };
  }

  async notificarInasistencia(_contact: string, data: InasistenciaData) {
    this.gateway.alertarInasistencia({
      paciente: data.paciente,
      especialidad: data.especialidad,
      contador: data.contador,
      severidad: data.severidad,
      timestamp: new Date(),
    });
    return { dispatched: true };
  }

  async enviarRecordatorio(_contact: string, data: RecordatorioData) {
    this.gateway.emitToAdmision('notificacion:recordatorio', data);
    return { dispatched: true };
  }

  async enviar(params: INotificacionParams): Promise<void> {
    this.logger.log(`Enviando WebSocket a usuario ${params.usuarioId}: ${params.titulo}`);
  }
}
