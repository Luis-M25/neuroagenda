import { Module, OnModuleInit } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { WhatsappController } from './whatsapp/whatsapp.controller';
import { MailService } from './mail/mail.service';
import { NotificacionesGateway } from './websocket/notificaciones.gateway';
import { ReminderScheduler } from './scheduler/reminder.scheduler';
import { NotificationDispatcher } from './dispatcher/notification-dispatcher.service';
import { WhatsAppChannel } from './channels/whatsapp.channel';
import { EmailChannel } from './channels/email.channel';
import { WebSocketChannel } from './channels/websocket.channel';
import { NotificacionesService } from './notificaciones.service';
import { NotificacionesController } from './notificaciones.controller';
import { HceCierreScheduler } from './scheduler/hce-cierre.scheduler';
import { CitaVencidaScheduler } from './scheduler/cita-vencida.scheduler';
import { ProtocoloCriticoScheduler } from './scheduler/protocolo-critico.scheduler';

@Module({
  imports: [
    HttpModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET!,
    }),
  ],
  controllers: [WhatsappController, NotificacionesController],
  providers: [
    WhatsappService,
    MailService,
    NotificacionesGateway,
    ReminderScheduler,
    NotificationDispatcher,
    WhatsAppChannel,
    EmailChannel,
    WebSocketChannel,
    NotificacionesService,
    HceCierreScheduler,
    CitaVencidaScheduler,
    ProtocoloCriticoScheduler,
  ],
  exports: [
    WhatsappService,
    MailService,
    NotificacionesGateway,
    NotificationDispatcher,
    NotificacionesService,
  ],
})
export class NotificacionesModule implements OnModuleInit {
  constructor(
    private dispatcher: NotificationDispatcher,
    private whatsappChannel: WhatsAppChannel,
    private emailChannel: EmailChannel,
    private websocketChannel: WebSocketChannel,
  ) {}

  onModuleInit() {
    this.dispatcher.registerChannel(this.whatsappChannel);
    this.dispatcher.registerChannel(this.emailChannel);
    this.dispatcher.registerChannel(this.websocketChannel);
  }
}
