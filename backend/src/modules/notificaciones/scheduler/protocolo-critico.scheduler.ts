import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../common/prisma.service';
import { NotificacionesService, TIPO_NOTIFICACION } from '../notificaciones.service';

/**
 * Cada hora: detecta pacientes con 2+ inasistencias en una especialidad y
 * notifica SOLO a admisión, preguntando si desea cancelar el protocolo de
 * citas de ese paciente.
 */
@Injectable()
export class ProtocoloCriticoScheduler {
  private readonly logger = new Logger(ProtocoloCriticoScheduler.name);

  constructor(
    private prisma: PrismaService,
    private notificaciones: NotificacionesService,
  ) {}

  @Cron('0 * * * *')
  async verificarProtocolosCriticos() {
    const inasistencias = await this.prisma.inasistenciaPorEspecialidad.findMany({
      where: { contador: { gte: 2 } },
      include: {
        paciente: { select: { id: true, nombres: true, apellidos: true, numeroIdentificacion: true } },
      },
    });

    const admins = await this.prisma.usuario.findMany({
      where: { rol: { in: ['ADMISION_PRINCIPAL', 'ADMISION'] }, activo: true },
      select: { id: true },
    });
    if (admins.length === 0) return;

    for (const ina of inasistencias) {
      const pacienteNombre = `${ina.paciente.nombres} ${ina.paciente.apellidos}`;
      for (const admin of admins) {
        const ya = await this.notificaciones.existeReciente({
          usuarioId: admin.id,
          tipo: TIPO_NOTIFICACION.PROTOCOLO_CRITICO,
          refId: ina.id,
          desdeHoras: 24,
        });
        if (ya) continue;

        await this.notificaciones.crear({
          usuarioId: admin.id,
          tipo: TIPO_NOTIFICACION.PROTOCOLO_CRITICO,
          titulo: 'Paciente con inasistencias repetidas',
          mensaje: `${pacienteNombre} acumula ${ina.contador} inasistencias en ${ina.especialidad}. ¿Desea cancelar el protocolo de citas de este paciente?`,
          refId: ina.paciente.id,
          refTipo: 'paciente',
        });
        this.logger.log(`Notificacion PROTOCOLO_CRITICO para admin ${admin.id}, inasistencia ${ina.id}`);
      }
    }
  }
}
