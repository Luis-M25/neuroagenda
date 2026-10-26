import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma.service';
import { hasOverlap } from '../../../../common/utils/time.utils';
import { parseEcDate } from '../../../../common/utils/date-ec.utils';
import { CreateCitaDto } from '../../dto/create-cita.dto';

const MAX_RECURRENCE_OCCURRENCES = 52;

@Injectable()
export class CitaRecurrenceService {
  constructor(private prisma: PrismaService) {}

  async generarCitasRecurrentes(citaOrigen: any, dto: CreateCitaDto, diasSemana: number[]) {
    const citasData: any[] = [];

    if (dto.recurrenciaDetalle && dto.recurrenciaDetalle.length > 0) {
      for (const item of dto.recurrenciaDetalle) {
        const fechaObj = parseEcDate(item.fecha);
        const conflicto = await this.prisma.cita.findFirst({
          where: {
            AND: [
              {
                OR: [
                  { especialistaId: dto.especialistaId, fecha: fechaObj, horaInicio: item.horaInicio },
                  { pacienteId: dto.pacienteId, fecha: fechaObj, horaInicio: item.horaInicio },
                ],
              },
              { NOT: { estado: 'CANCELADA', slotLiberado: true } },
            ],
          },
        });
        if (conflicto) {
          throw new ConflictException(`Conflicto de horario en ${item.fecha} a las ${item.horaInicio}`);
        }
        citasData.push({
          especialistaId: dto.especialistaId,
          pacienteId: dto.pacienteId,
          fecha: fechaObj,
          horaInicio: item.horaInicio,
          horaFin: item.horaFin,
          duracionMinutos: dto.duracionMinutos,
          especialidad: dto.especialidad,
          lugar: dto.lugar,
          motivo: dto.motivo || '',
          notaAdmin: dto.notaAdmin,
          esRecurrente: true,
          recurrenciaDiaSemana: dto.recurrenciaDiaSemana,
          recurrenciaDiasSemana: diasSemana ? JSON.stringify(diasSemana) : null,
          recurrenciaCantidad: dto.recurrenciaCantidad || null,
          citaOrigenId: citaOrigen.id,
        });
      }
    } else {
      const fechaInicio = parseEcDate(dto.fecha);
      const cantidadSolicitada = dto.recurrenciaCantidad || 0;
      const restantes = cantidadSolicitada > 0
        ? Math.min(cantidadSolicitada - 1, MAX_RECURRENCE_OCCURRENCES - 1)
        : MAX_RECURRENCE_OCCURRENCES;
      if (cantidadSolicitada > MAX_RECURRENCE_OCCURRENCES) {
        throw new BadRequestException(
          `La cantidad máxima de citas recurrentes es ${MAX_RECURRENCE_OCCURRENCES}`,
        );
      }
      const currentDate = new Date(fechaInicio);
      let generadas = 0;

      while (true) {
        if (generadas >= restantes) break;

        if (diasSemana.includes(currentDate.getDay())) {
          if (currentDate.getTime() !== fechaInicio.getTime()) {
            const dow = currentDate.getDay();
            const horarioDia = dto.recurrenciaHorarios?.[String(dow)];
            const horaInicio = horarioDia?.horaInicio || dto.horaInicio;
            const horaFin = horarioDia?.horaFin || dto.horaFin;
            const fechaStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
            const citasExistentes = await this.prisma.cita.findMany({
              where: {
                AND: [
                  {
                    OR: [
                      { especialistaId: dto.especialistaId },
                      { pacienteId: dto.pacienteId },
                    ],
                  },
                  { fecha: new Date(currentDate) },
                  { NOT: { estado: 'CANCELADA', slotLiberado: true } },
                ],
              },
              select: { horaInicio: true, horaFin: true },
            });
            const conflicto = citasExistentes.find(c =>
              hasOverlap(c.horaInicio, c.horaFin, horaInicio, horaFin),
            );

            if (conflicto) {
              throw new ConflictException(`Conflicto de horario en ${fechaStr} a las ${horaInicio}`);
            }

            citasData.push({
              especialistaId: dto.especialistaId,
              pacienteId: dto.pacienteId,
              fecha: new Date(currentDate),
              horaInicio,
              horaFin,
              duracionMinutos: dto.duracionMinutos,
              especialidad: dto.especialidad,
              lugar: dto.lugar,
              motivo: dto.motivo || '',
              notaAdmin: dto.notaAdmin,
              esRecurrente: true,
              recurrenciaDiaSemana: dto.recurrenciaDiaSemana,
              recurrenciaDiasSemana: JSON.stringify(diasSemana),
              recurrenciaCantidad: dto.recurrenciaCantidad || null,
              citaOrigenId: citaOrigen.id,
            });
            generadas++;
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    if (citasData.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        for (const citaData of citasData) {
          await tx.cita.create({ data: citaData });
        }
      });
    }
  }
}
