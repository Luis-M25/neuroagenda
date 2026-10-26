import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../common/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificacionesGateway } from '../websocket/notificaciones.gateway';
import { ConfigService } from '../../../common/config.service';

@Injectable()
export class ReminderScheduler {
  private readonly logger = new Logger(ReminderScheduler.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private notificacionesGateway: NotificacionesGateway,
    private configService: ConfigService,
  ) {}

  @Cron('*/1 * * * *')
  async enviarRecordatorios5Min() {
    const now = new Date();
    const minutesBefore = this.configService.notifications.reminder.minutesBefore;
    const target = new Date(now.getTime() + minutesBefore * 60 * 1000);

    const targetTime = target.toTimeString().slice(0, 5);
    const citas = await this.prisma.cita.findMany({
      where: {
        fecha: {
          gte: new Date(target.toDateString()),
          lt: new Date(new Date(target.toDateString()).getTime() + 86400000),
        },
        horaInicio: targetTime,
        estado: 'CONFIRMADA',
        notificacionEnviada5min: false,
      },
      include: {
        especialista: { include: { usuario: true } },
        paciente: true,
      },
    });

    for (const cita of citas) {
      try {
        if (cita.especialista?.usuario?.email) {
          await this.mailService.notificarEspecialista5min({
            to: cita.especialista.usuario.email,
            pacienteNombre: `${cita.paciente.nombres} ${cita.paciente.apellidos}`,
            hora: cita.horaInicio,
            lugar: cita.lugar,
          });
        }

        this.notificacionesGateway.emitToUser(
          cita.especialista.usuario.id,
          'cita:recordatorio',
          {
            citaId: cita.id,
            paciente: `${cita.paciente.nombres} ${cita.paciente.apellidos}`,
            hora: cita.horaInicio,
            lugar: cita.lugar,
            mensaje: `Tu cita con ${cita.paciente.nombres} es en ${minutesBefore} minutos`,
          },
        );

        await this.prisma.cita.update({
          where: { id: cita.id },
          data: { notificacionEnviada5min: true },
        });

        this.logger.log(`Recordatorio enviado: cita ${cita.id}`);
      } catch (err) {
        this.logger.error(`Error enviando recordatorio cita ${cita.id}`, err);
      }
    }
  }
}
