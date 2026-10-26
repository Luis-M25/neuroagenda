import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../common/prisma.service';
import { NotificacionesService, TIPO_NOTIFICACION } from '../notificaciones.service';

/**
 * Cada 15 minutos: detecta consultas HCE del día de hoy que ya pasaron su hora
 * (horaFin de la cita) y que tienen datos guardados (motivoConsulta) pero NO
 * están firmadas/cerradas. Notifica SOLO al especialista.
 */
@Injectable()
export class HceCierreScheduler {
  private readonly logger = new Logger(HceCierreScheduler.name);

  constructor(
    private prisma: PrismaService,
    private notificaciones: NotificacionesService,
  ) {}

  @Cron('*/15 * * * *')
  async verificarHceSinCerrar() {
    const now = new Date();
    const hoyInicio = new Date(now.toDateString());
    const hoyFin = new Date(hoyInicio.getTime() + 86400000);
    const horaActual = now.toTimeString().slice(0, 5); // "HH:mm"

    // Citas de hoy cuya hora ya pasó, con su consulta HCE asociada
    const citas = await this.prisma.cita.findMany({
      where: {
        fecha: { gte: hoyInicio, lt: hoyFin },
        horaFin: { lt: horaActual },
        estado: { in: ['EN_ESPERA', 'EN_ATENCION', 'CONFIRMADA', 'PENDIENTE'] },
      },
      include: {
        paciente: { select: { nombres: true, apellidos: true } },
        especialista: { include: { usuario: { select: { id: true } } } },
        consultaHCE: { select: { id: true, firmada: true, motivoConsulta: true } },
      },
    });

    for (const cita of citas) {
      const consulta = cita.consultaHCE;
      // Solo si la HCE está iniciada (tiene motivo) pero NO firmada
      if (!consulta || consulta.firmada || !consulta.motivoConsulta?.trim()) continue;
      const usuarioId = cita.especialista?.usuario?.id;
      if (!usuarioId) continue;

      const yaNotificado = await this.notificaciones.existeReciente({
        usuarioId,
        tipo: TIPO_NOTIFICACION.HCE_PENDIENTE,
        refId: consulta.id,
        desdeHoras: 72,
      });
      if (yaNotificado) continue;

      const pacienteNombre = `${cita.paciente.nombres} ${cita.paciente.apellidos}`;
      await this.notificaciones.crear({
        usuarioId,
        tipo: TIPO_NOTIFICACION.HCE_PENDIENTE,
        titulo: 'HCE sin cerrar',
        mensaje: `La historia clínica de ${pacienteNombre} (cita ${cita.horaInicio}) tiene datos guardados pero no ha sido firmada.`,
        refId: cita.pacienteId,
        refTipo: 'paciente',
      });
      this.logger.log(`Notificacion HCE_PENDIENTE creada para usuario ${usuarioId}, consulta ${consulta.id}`);
    }
  }
}
