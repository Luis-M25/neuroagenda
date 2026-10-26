import { Injectable, BadRequestException, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma.service';
import { AuditoriaService } from '../../../auditoria/auditoria.service';
import { NotificationDispatcher } from '../../../notificaciones/dispatcher/notification-dispatcher.service';
import { NotificacionesService, TIPO_NOTIFICACION } from '../../../notificaciones/notificaciones.service';
import { UpdateCitaEstadoDto } from '../../dto/actions.dto';

@Injectable()
export class CitaEstadosService {
  private readonly logger = new Logger(CitaEstadosService.name);

  constructor(
    private prisma: PrismaService,
    private auditoriaService: AuditoriaService,
    private notificationDispatcher: NotificationDispatcher,
    private notificacionesService: NotificacionesService,
  ) {}

  async updateEstado(id: string, dto: UpdateCitaEstadoDto, userId: string, userRol: string) {
    const cita = await this.prisma.cita.findUnique({
      where: { id },
      include: {
        paciente: true,
        especialista: { include: { usuario: true } },
        citaOriginal: true,
        citaReagendada: true,
        modificadaPor: { select: { email: true } },
        modificaciones: {
          orderBy: { createdAt: 'desc' },
          include: { modificadaPor: { select: { email: true } } },
        },
        citasDerivadas: {
          orderBy: { fecha: 'asc' },
          include: {
            paciente: { select: { id: true, nombres: true, apellidos: true } },
          },
        },
      },
    });
    if (!cita) throw new NotFoundException('Cita no encontrada');

    const transicionesValidas: Record<string, string[]> = {
      PENDIENTE: ['CONFIRMADA', 'EN_ESPERA', 'EN_ATENCION', 'CANCELADA', 'NO_ASISTIO', 'REAGENDADA'],
      CONFIRMADA: ['EN_ESPERA', 'EN_ATENCION', 'CANCELADA', 'NO_ASISTIO', 'REAGENDADA'],
      EN_ESPERA: ['EN_ATENCION', 'CANCELADA', 'NO_ASISTIO'],
      EN_ATENCION: ['ATENDIDA', 'CANCELADA'],
      REAGENDADA: ['CONFIRMADA', 'EN_ESPERA', 'CANCELADA', 'NO_ASISTIO', 'REAGENDADA'],
    };

    if (!transicionesValidas[cita.estado]?.includes(dto.estado)) {
      throw new BadRequestException(`No se puede cambiar de ${cita.estado} a ${dto.estado}`);
    }

    if (['EN_ATENCION', 'ATENDIDA'].includes(dto.estado) && userRol !== 'ESPECIALISTA') {
      throw new ForbiddenException('Solo el especialista puede marcar en atencion/atendida');
    }

    if (dto.estado === 'ATENDIDA') {
      const consultaHCE = await this.prisma.consultaHCE.findFirst({
        where: { citaId: id },
      });
      if (!consultaHCE || !consultaHCE.motivoConsulta?.trim()) {
        throw new BadRequestException('No se puede marcar como atendida sin haber llenado la consulta en la HCE');
      }
      if (!consultaHCE.firmada) {
        throw new BadRequestException('No se puede marcar como atendida sin firmar digitalmente la HCE');
      }
    }

    if (userRol === 'PORTERO' && dto.estado !== 'EN_ESPERA') {
      throw new ForbiddenException('El portero solo puede marcar en espera');
    }

    if (dto.estado === 'EN_ESPERA' && userRol === 'PORTERO') {
      if (cita.estado === 'CANCELADA') {
        throw new BadRequestException('No se puede marcar en espera una cita cancelada');
      }
    }

    if (userRol === 'PORTERO' && dto.estado === 'EN_ESPERA' && cita.estado !== 'CONFIRMADA' && cita.estado !== 'PENDIENTE') {
      throw new BadRequestException('Solo se puede marcar en espera citas pendientes o confirmadas');
    }

    if (dto.estado === 'NO_ASISTIO' && !['ADMISION_PRINCIPAL', 'ADMISION'].includes(userRol as any)) {
      throw new ForbiddenException('Solo admision puede marcar no asistio');
    }

    const updateData: any = { estado: dto.estado };
    if (dto.notaEspecialista) updateData.notaEspecialista = dto.notaEspecialista;

    if (dto.estado === 'CANCELADA') {
      let canceladaPor = dto.canceladaPor;
      if (!canceladaPor) {
        canceladaPor = userRol === 'PACIENTE' ? 'PACIENTE' : 'ADMIN';
      }
      updateData.canceladaPor = canceladaPor;
      updateData.motivoCancelacion = dto.motivoCancelacion;
      updateData.fechaCancelacion = new Date();
    }

    const citaActualizada = await this.prisma.cita.update({
      where: { id },
      data: updateData,
      include: {
        paciente: { select: { id: true, nombres: true, apellidos: true, telefono: true } },
        especialista: { select: { id: true, nombres: true, apellidos: true, especialidad: true } },
      },
    });

    await this.auditoriaService.registrar({
      usuarioId: userId,
      accion: `CAMBIO_ESTADO_CITA_${dto.estado}`,
      entidad: 'Cita',
      entidadId: id,
      detalle: { estadoAnterior: cita.estado, nuevoEstado: dto.estado, motivoCancelacion: dto.motivoCancelacion },
    });

    if (dto.estado === 'NO_ASISTIO') {
      await this.registrarInasistencia(cita);
    }

    return citaActualizada;
  }

  async liberarHorario(id: string, userId: string) {
    const cita = await this.prisma.cita.findUnique({
      where: { id },
      include: {
        paciente: true,
        especialista: { include: { usuario: true } },
      },
    });
    if (!cita) throw new NotFoundException('Cita no encontrada');
    if (cita.estado !== 'CANCELADA') {
      throw new BadRequestException('Solo se puede liberar el horario de citas canceladas');
    }
    if (cita.slotLiberado) {
      throw new BadRequestException('El horario ya fue liberado');
    }

    const citaActualizada = await this.prisma.cita.update({
      where: { id },
      data: { slotLiberado: true },
    });

    await this.auditoriaService.registrar({
      usuarioId: userId,
      accion: 'LIBERAR_HORARIO',
      entidad: 'Cita',
      entidadId: id,
      detalle: { slotLiberado: true },
    });

    return citaActualizada;
  }

  private async registrarInasistencia(cita: any) {
    const inasistencia = await this.prisma.inasistenciaPorEspecialidad.upsert({
      where: {
        pacienteId_especialidad: {
          pacienteId: cita.pacienteId,
          especialidad: cita.especialidad,
        },
      },
      update: {
        contador: { increment: 1 },
        ultimaInasistencia: new Date(),
        notificacionEnviada: false,
      },
      create: {
        pacienteId: cita.pacienteId,
        especialidad: cita.especialidad,
        contador: 1,
        ultimaInasistencia: new Date(),
      },
    });

    const severidad = inasistencia.contador === 1 ? 'BAJA'
      : inasistencia.contador <= 3 ? 'MEDIA'
      : inasistencia.contador <= 5 ? 'ALTA'
      : 'CRITICA';

    await this.prisma.inasistenciaPorEspecialidad.update({
      where: { id: inasistencia.id },
      data: { ultimaNotificacionSeveridad: severidad as any },
    });

    try {
      const pacienteNombre = cita.paciente?.nombres && cita.paciente?.apellidos
        ? `${cita.paciente.nombres} ${cita.paciente.apellidos}`
        : 'Paciente';
      await this.notificationDispatcher.dispatchInasistencia('admin@sistema.com', {
        paciente: pacienteNombre,
        especialidad: cita.especialidad,
        contador: inasistencia.contador,
        severidad,
      });

      // Notificación persistente al admin por la inasistencia (NO_ASISTIO marcado)
      await this.notificacionesService.crearParaAdmision({
        tipo: TIPO_NOTIFICACION.INASISTENCIA_CRITICA,
        titulo: 'Cita marcada como no asistió',
        mensaje: `${pacienteNombre} no asistió a su cita de ${cita.especialidad} (${cita.horaInicio}). Inasistencias acumuladas: ${inasistencia.contador}.`,
        refId: cita.pacienteId,
        refTipo: 'paciente',
      });

      // Si llega a 2+ inasistencias, preguntar al admin si cancela el protocolo
      if (inasistencia.contador >= 2) {
        await this.notificacionesService.crearParaAdmision({
          tipo: TIPO_NOTIFICACION.PROTOCOLO_CRITICO,
          titulo: 'Paciente con inasistencias repetidas',
          mensaje: `${pacienteNombre} acumula ${inasistencia.contador} inasistencias en ${cita.especialidad}. ¿Desea cancelar el protocolo de citas de este paciente?`,
          refId: cita.pacienteId,
          refTipo: 'paciente',
        });
      }
    } catch (e) {
      this.logger.error('Error al notificar inasistencia', e);
    }
  }
}
