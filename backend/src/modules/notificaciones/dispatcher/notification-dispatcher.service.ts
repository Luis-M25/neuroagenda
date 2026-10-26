import { Injectable, Logger } from '@nestjs/common';
import {
  INotificationChannel,
  CitaConfirmacionData,
  InasistenciaData,
  RecordatorioData,
} from '../interfaces/notification-channel.interface';

@Injectable()
export class NotificationDispatcher {
  private readonly logger = new Logger(NotificationDispatcher.name);
  private readonly channels: INotificationChannel[] = [];

  registerChannel(channel: INotificationChannel): void {
    this.channels.push(channel);
    this.logger.log(`Channel registered: ${channel.name}`);
  }

  async dispatchConfirmacion(contact: string, data: CitaConfirmacionData): Promise<void> {
    for (const channel of this.channels) {
      try {
        await channel.enviarConfirmacionCita(contact, data);
      } catch (err) {
        this.logger.error(`Channel ${channel.name} failed for confirmacion`, err);
      }
    }
  }

  async dispatchInasistencia(adminContact: string, data: InasistenciaData): Promise<void> {
    for (const channel of this.channels) {
      try {
        await channel.notificarInasistencia(adminContact, data);
      } catch (err) {
        this.logger.error(`Channel ${channel.name} failed for inasistencia`, err);
      }
    }
  }

  async dispatchRecordatorio(contact: string, data: RecordatorioData): Promise<void> {
    for (const channel of this.channels) {
      try {
        await channel.enviarRecordatorio(contact, data);
      } catch (err) {
        this.logger.error(`Channel ${channel.name} failed for recordatorio`, err);
      }
    }
  }
}
