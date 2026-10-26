import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma.service';
import { AuditoriaService } from '../../../auditoria/auditoria.service';
import { CitaDomainService } from '../domain/cita-domain.service';
import { UpdateCitaDto } from '../../dto/update-cita.dto';
import { normalizeTime } from '../../../../common/utils/time.utils';
import { parseEcDate } from '../../../../common/utils/date-ec.utils';

@Injectable()
export class CitaUpdateService {
  constructor(
    private prisma: PrismaService,
    private auditoriaService: AuditoriaService,
    private domain: CitaDomainService,
  ) {}

  async update(id: string, dto: UpdateCitaDto, userId: string, citaExistente?: any) {
    const cita = citaExistente || await this.prisma.cita.findUnique({
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

    if (!['PENDIENTE', 'CONFIRMADA'].includes(cita.estado)) {
      throw new BadRequestException('Solo se puede modificar citas pendientes o confirmadas');
    }

    const data: any = {
      notasModificacion: dto.notasModificacion,
      modificadaPorId: userId,
      fechaModificacion: new Date(),
    };
    let fechaUsar = cita.fecha;
    if (dto.fecha) {
      fechaUsar = parseEcDate(dto.fecha);
      data.fecha = fechaUsar;
    }
    if (dto.horaInicio) { dto.horaInicio = normalizeTime(dto.horaInicio); data.horaInicio = dto.horaInicio; }
    if (dto.horaFin) { dto.horaFin = normalizeTime(dto.horaFin); data.horaFin = dto.horaFin; }
    if (dto.especialistaId) data.especialistaId = dto.especialistaId;
    if (dto.especialidad) data.especialidad = dto.especialidad;
    if (dto.lugar) data.lugar = dto.lugar;
    if (dto.motivo !== undefined) data.motivo = dto.motivo;

    const origFecha = `${cita.fecha.getFullYear()}-${String(cita.fecha.getMonth() + 1).padStart(2, '0')}-${String(cita.fecha.getDate()).padStart(2, '0')}`;
    const isRescheduled =
      (dto.fecha && dto.fecha !== origFecha) ||
      (dto.horaInicio && dto.horaInicio !== cita.horaInicio) ||
      (dto.horaFin && dto.horaFin !== cita.horaFin) ||
      (dto.especialistaId && dto.especialistaId !== cita.especialistaId);
    if (isRescheduled) {
      data.estado = 'PENDIENTE';
    }

    const especialistaIdUsar = dto.especialistaId || cita.especialistaId;

    const citaEditada = await this.prisma.$transaction(async (tx) => {
      if (dto.especialistaId) {
        const esp = await tx.especialista.findUnique({ where: { id: dto.especialistaId } });
        if (!esp) throw new NotFoundException('Especialista no encontrado');
        if (esp.estado === 'DESHABILITADO') throw new BadRequestException('El especialista no esta habilitado');
      }

      if (dto.especialistaId || dto.fecha || dto.horaInicio || dto.horaFin) {
        await this.domain.conflicts.validarConflictos(
          especialistaIdUsar,
          cita.pacienteId,
          `${fechaUsar.getFullYear()}-${String(fechaUsar.getMonth() + 1).padStart(2, '0')}-${String(fechaUsar.getDate()).padStart(2, '0')}`,
          dto.horaInicio || cita.horaInicio,
          dto.horaFin || cita.horaFin,
          id,
          tx,
        );
      }

      const updated = await tx.cita.update({
        where: { id },
        data,
        include: {
          paciente: { select: { nombres: true, apellidos: true } },
          especialista: { select: { nombres: true, apellidos: true, especialidad: true } },
        },
      });

      await tx.citaModificacion.create({
        data: {
          citaId: id,
          fecha: cita.fecha,
          horaInicio: cita.horaInicio,
          horaFin: cita.horaFin,
          notasModificacion: dto.notasModificacion,
          modificadaPorId: userId,
        },
      });

      return updated;
    });

    await this.auditoriaService.registrar({
      usuarioId: userId,
      accion: 'EDITAR_CITA',
      entidad: 'Cita',
      entidadId: id,
      detalle: {
        campos: Object.keys(data).filter(k => !['notasModificacion', 'modificadaPorId', 'fechaModificacion'].includes(k)),
        notasModificacion: dto.notasModificacion,
      },
    });

    return citaEditada;
  }
}
