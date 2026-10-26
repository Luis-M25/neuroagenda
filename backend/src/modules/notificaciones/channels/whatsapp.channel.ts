import { Injectable, Logger } from '@nestjs/common';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import {
  INotificationChannel,
  INotificacionParams,
  CitaConfirmacionData,
  InasistenciaData,
  RecordatorioData,
} from '../interfaces/notification-channel.interface';

@Injectable()
export class WhatsAppChannel implements INotificationChannel {
  readonly name = 'whatsapp';
  private readonly logger = new Logger(WhatsAppChannel.name);

  constructor(private whatsappService: WhatsappService) {}

  async enviarConfirmacionCita(contact: string, data: CitaConfirmacionData) {
    return this.whatsappService.enviarConfirmacionCita(contact, data);
  }

  async notificarInasistencia(contact: string, data: InasistenciaData) {
    return this.whatsappService.notificarInasistencia(contact, data);
  }

  async enviarRecordatorio(_contact: string, _data: RecordatorioData) {
    return { skipped: true, reason: 'WhatsApp no tiene template de recordatorio' };
  }

  async enviar(params: INotificacionParams): Promise<void> {
    this.logger.log(`Enviando WhatsApp a usuario ${params.usuarioId}: ${params.titulo}`);
  }
}
