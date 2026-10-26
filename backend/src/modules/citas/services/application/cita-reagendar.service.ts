import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma.service';
import { AuditoriaService } from '../../../auditoria/auditoria.service';
import { CitaDomainService } from '../domain/cita-domain.service';
import { ReagendarCitaDto } from '../../dto/actions.dto';
import { normalizeTime } from '../../../../common/utils/time.utils';
import { parseEcDate } from '../../../../common/utils/date-ec.utils';

@Injectable()
export class CitaReagendarService {
  constructor(
    private prisma: PrismaService,
    private auditoriaService: AuditoriaService,
    private domain: CitaDomainService,
  ) {}

  async reagendar(id: string, dto: ReagendarCitaDto, userId: string) {
    const citaOriginal = await this.prisma.cita.findUnique({
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
    if (!citaOriginal) throw new NotFoundException('Cita no encontrada');

    if (!['PENDIENTE', 'CONFIRMADA'].includes(citaOriginal.estado)) {
      throw new BadRequestException('No se puede reagendar esta cita');
    }

    dto.horaInicio = normalizeTime(dto.horaInicio);
    dto.horaFin = normalizeTime(dto.horaFin);

    await this.domain.conflicts.validarConflictos(
      citaOriginal.especialistaId,
      citaOriginal.pacienteId,
      dto.fecha,
      dto.horaInicio,
      dto.horaFin,
    );

    const nuevaCita = await this.prisma.$transaction(async (tx) => {
      const nc = await tx.cita.create({
        data: {
          especialistaId: citaOriginal.especialistaId,
          pacienteId: citaOriginal.pacienteId,
          fecha: parseEcDate(dto.fecha),
          horaInicio: dto.horaInicio,
          horaFin: dto.horaFin,
          duracionMinutos: citaOriginal.duracionMinutos,
          especialidad: citaOriginal.especialidad,
          lugar: citaOriginal.lugar,
          motivo: citaOriginal.motivo,
          notaAdmin: citaOriginal.notaAdmin,
          estado: 'PENDIENTE',
          notasModificacion: dto.notasModificacion || 'Cita reagendada',
          modificadaPorId: userId,
          fechaModificacion: new Date(),
          citaOrigenId: id,
        },
        include: {
          paciente: { select: { nombres: true, apellidos: true, telefono: true } },
          especialista: { select: { nombres: true, apellidos: true, especialidad: true } },
        },
      });

      await tx.cita.update({
        where: { id },
        data: {
          estado: 'REAGENDADA',
          citaReagendadaId: nc.id,
          notasModificacion: dto.notasModificacion || 'Cita reagendada',
          modificadaPorId: userId,
          fechaModificacion: new Date(),
        },
      });

      return nc;
    });

    await this.auditoriaService.registrar({
      usuarioId: userId,
      accion: 'REAGENDAR_CITA',
      entidad: 'Cita',
      entidadId: id,
      detalle: { nuevaFecha: dto.fecha, nuevaHoraInicio: dto.horaInicio, nuevaHoraFin: dto.horaFin },
    });

    return {
      citaOriginal: { id, estado: 'REAGENDADA' },
      nuevaCita,
    };
  }
}
