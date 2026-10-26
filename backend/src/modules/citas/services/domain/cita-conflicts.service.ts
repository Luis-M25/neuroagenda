import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma.service';
import { hasOverlap } from '../../../../common/utils/time.utils';
import { parseEcDate, ecStartOfDay } from '../../../../common/utils/date-ec.utils';

@Injectable()
export class CitaConflictsService {
  constructor(private prisma: PrismaService) {}

  async validarConflictos(
    especialistaId: string,
    pacienteId: string,
    fecha: string,
    horaInicio: string,
    horaFin: string,
    excludeCitaId?: string,
    tx?: Prisma.TransactionClient,
    atendidaPorId?: string,
  ) {
    const prismaTx = tx || this.prisma;
    const [y, m, d] = fecha.split('-').map(Number);
    const fechaDate = parseEcDate(fecha);

    const bloqueos = await prismaTx.bloqueoGrupal.findMany({
      where: {
        fechaInicio: { lte: fechaDate },
        AND: [
          { OR: [{ fechaFin: { gte: fechaDate } }, { fechaFin: null }] },
        ],
        especialistas: { some: { especialistaId } },
      },
    });
    if (bloqueos.length > 0) {
      throw new BadRequestException(`El especialista tiene un bloqueo activo en esta fecha: ${bloqueos[0].nombre}`);
    }

    const esp = await prismaTx.especialista.findUnique({ where: { id: especialistaId } });
    if (!esp) throw new NotFoundException('Especialista no encontrado');
    if (esp.estado === 'SUSPENDIDO_TEMPORAL' && esp.fechaInicioSuspension) {
      const fe = esp.fechaFinSuspension || new Date(8640000000000000);
      if (fechaDate >= esp.fechaInicioSuspension && fechaDate <= fe) {
        throw new BadRequestException('El especialista esta suspendido temporalmente en esta fecha');
      }
    }

    const whereBase: Prisma.CitaWhereInput = {
      fecha: {
        gte: ecStartOfDay(y, m, d),
        lt: ecStartOfDay(y, m, d + 1),
      },
      NOT: { estado: 'CANCELADA', slotLiberado: true },
      ...(excludeCitaId ? { id: { not: excludeCitaId } } : {}),
    };

    const tienePasantes = esp.tienePasantes === true;

    if (!tienePasantes || !atendidaPorId) {
      const citasEspecialista = await prismaTx.cita.findMany({
        where: { ...whereBase, especialistaId, atendidaPorId: null },
        select: { horaInicio: true, horaFin: true },
      });
      const conflictoEspecialista = citasEspecialista.find((c) =>
        hasOverlap(c.horaInicio, c.horaFin, horaInicio, horaFin),
      );
      if (conflictoEspecialista) {
        throw new ConflictException('El especialista ya tiene una cita en ese horario');
      }
    }

    if (atendidaPorId) {
      const citasPasante = await prismaTx.cita.findMany({
        where: { ...whereBase, atendidaPorId },
        select: { horaInicio: true, horaFin: true },
      });
      const conflictoPasante = citasPasante.find((c) =>
        hasOverlap(c.horaInicio, c.horaFin, horaInicio, horaFin),
      );
      if (conflictoPasante) {
        throw new ConflictException('El pasante ya tiene una cita asignada en ese horario');
      }
    }

    const citasPaciente = await prismaTx.cita.findMany({
      where: { ...whereBase, pacienteId },
      select: { horaInicio: true, horaFin: true },
    });
    const conflictoPaciente = citasPaciente.find((c) =>
      hasOverlap(c.horaInicio, c.horaFin, horaInicio, horaFin),
    );
    if (conflictoPaciente) {
      throw new ConflictException('El paciente ya tiene una cita en ese horario');
    }
  }
}
