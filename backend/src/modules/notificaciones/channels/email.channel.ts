import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import {
  INotificationChannel,
  INotificacionParams,
  CitaConfirmacionData,
  InasistenciaData,
  RecordatorioData,
} from '../interfaces/notification-channel.interface';

@Injectable()
export class EmailChannel implements INotificationChannel {
  readonly name = 'email';
  private readonly logger = new Logger(EmailChannel.name);

  constructor(private mailService: MailService) {}

  async enviarConfirmacionCita(_contact: string, _data: CitaConfirmacionData) {
    return { skipped: true, reason: 'Email no tiene template de confirmacion de cita' };
  }

  async notificarInasistencia(contact: string, data: InasistenciaData) {
    return this.mailService.notificarAdminInasistencia({
      to: contact,
      paciente: data.paciente,
      especialidad: data.especialidad,
      contador: data.contador,
      severidad: data.severidad,
      pacienteId: '',
    });
  }

  async enviarRecordatorio(contact: string, data: RecordatorioData) {
    return this.mailService.notificarEspecialista5min({
      to: contact,
      pacienteNombre: data.pacienteNombre,
      hora: data.hora,
      lugar: data.lugar,
    });
  }

  async enviar(params: INotificacionParams): Promise<void> {
    this.logger.log(`Enviando email a usuario ${params.usuarioId}: ${params.titulo}`);
  }
}
