import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../common/prisma.service';
import { NotificacionesService, TIPO_NOTIFICACION } from '../notificaciones.service';

/**
 * Cada 15 minutos: detecta citas del día de hoy que ya pasaron su hora de fin
 * y su estado sigue sin resolverse (no ATENDIDA, no CANCELADA, no NO_ASISTIO).
 * Notifica al especialista y a admisión.
 */
@Injectable()
export class CitaVencidaScheduler {
  private readonly logger = new Logger(CitaVencidaScheduler.name);

  constructor(
    private prisma: PrismaService,
    private notificaciones: NotificacionesService,
  ) {}

  @Cron('*/15 * * * *')
  async verificarCitasVencidas() {
    const now = new Date();
    const hoyInicio = new Date(now.toDateString());
    const hoyFin = new Date(hoyInicio.getTime() + 86400000);
    const horaActual = now.toTimeString().slice(0, 5);

    const citas = await this.prisma.cita.findMany({
      where: {
        fecha: { gte: hoyInicio, lt: hoyFin },
        horaFin: { lt: horaActual },
        estado: { in: ['PENDIENTE', 'CONFIRMADA', 'EN_ESPERA'] },
      },
      include: {
        paciente: { select: { nombres: true, apellidos: true } },
        especialista: { include: { usuario: { select: { id: true } } } },
      },
    });

    for (const cita of citas) {
      const pacienteNombre = `${cita.paciente.nombres} ${cita.paciente.apellidos}`;
      const mensaje = `La cita de ${pacienteNombre} (${cita.horaInicio} - ${cita.horaFin}) pasó su hora y sigue en estado ${cita.estado}.`;

      // Notificar al especialista
      const especialistaUsuarioId = cita.especialista?.usuario?.id;
      if (especialistaUsuarioId) {
        const yaEsp = await this.notificaciones.existeReciente({
          usuarioId: especialistaUsuarioId,
          tipo: TIPO_NOTIFICACION.CITA_VENCIDA,
          refId: cita.id,
          desdeHoras: 24,
        });
        if (!yaEsp) {
          await this.notificaciones.crear({
            usuarioId: especialistaUsuarioId,
            tipo: TIPO_NOTIFICACION.CITA_VENCIDA,
            titulo: 'Cita sin atender',
            mensaje,
            refId: cita.id,
            refTipo: 'cita',
          });
        }
      }

      // Notificar a admisión
      const admins = await this.prisma.usuario.findMany({
        where: { rol: { in: ['ADMISION_PRINCIPAL', 'ADMISION'] }, activo: true },
        select: { id: true },
      });
      for (const admin of admins) {
        const yaAdmin = await this.notificaciones.existeReciente({
          usuarioId: admin.id,
          tipo: TIPO_NOTIFICACION.CITA_VENCIDA,
          refId: cita.id,
          desdeHoras: 24,
        });
        if (yaAdmin) continue;
        await this.notificaciones.crear({
          usuarioId: admin.id,
          tipo: TIPO_NOTIFICACION.CITA_VENCIDA,
          titulo: 'Cita sin atender',
          mensaje,
          refId: cita.id,
          refTipo: 'cita',
        });
      }
      this.logger.log(`Notificacion CITA_VENCIDA procesada para cita ${cita.id}`);
    }
  }
}
