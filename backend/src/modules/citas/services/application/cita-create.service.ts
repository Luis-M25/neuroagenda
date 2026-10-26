import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma.service';
import { AuditoriaService } from '../../../auditoria/auditoria.service';
import { CitaDomainService } from '../domain/cita-domain.service';
import { CreateCitaDto } from '../../dto/create-cita.dto';
import { normalizeTime, timeToMinutes } from '../../../../common/utils/time.utils';
import { parseEcDate, ecStartOfDay } from '../../../../common/utils/date-ec.utils';

@Injectable()
export class CitaCreateService {
  constructor(
    private prisma: PrismaService,
    private auditoriaService: AuditoriaService,
    private domain: CitaDomainService,
  ) {}

  async create(dto: CreateCitaDto, creadoPorId: string) {
    dto.horaInicio = normalizeTime(dto.horaInicio);
    dto.horaFin = normalizeTime(dto.horaFin);

    const fechaConsulta = parseEcDate(dto.fecha);

    const hoy = ecStartOfDay(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
    if (fechaConsulta < hoy) {
      throw new BadRequestException('No se pueden crear citas en fechas pasadas');
    }

    const [diaBloqueado, feriado] = await Promise.all([
      this.prisma.diaBloqueado.findUnique({ where: { fecha: fechaConsulta } }),
      this.prisma.feriado.findUnique({ where: { fecha: fechaConsulta } }),
    ]);
    if (diaBloqueado?.activo) {
      throw new BadRequestException(`El día ${dto.fecha} está bloqueado: ${diaBloqueado.motivo}`);
    }
    if (feriado?.activo) {
      throw new BadRequestException(`El día ${dto.fecha} es feriado: ${feriado.nombre}`);
    }

    const diasSemana = dto.recurrenciaDiasSemana && dto.recurrenciaDiasSemana.length > 0
      ? dto.recurrenciaDiasSemana
      : dto.recurrenciaDiaSemana !== undefined ? [dto.recurrenciaDiaSemana] : undefined;

    const cita = await this.prisma.$transaction(async (tx) => {
      const especialista = await tx.especialista.findUnique({
        where: { id: dto.especialistaId },
      });
      if (!especialista) throw new NotFoundException('Especialista no encontrado');
      if (especialista.estado === 'DESHABILITADO') {
        throw new BadRequestException('El especialista no esta habilitado');
      }
      if (especialista.estado === 'SUSPENDIDO_TEMPORAL' && especialista.fechaInicioSuspension) {
        const fechaSolicitada = parseEcDate(dto.fecha);
        const fin = especialista.fechaFinSuspension || new Date(8640000000000000);
        if (fechaSolicitada >= especialista.fechaInicioSuspension && fechaSolicitada <= fin) {
          throw new BadRequestException('El especialista esta suspendido temporalmente en esta fecha');
        }
      }

      const paciente = await tx.paciente.findUnique({
        where: { id: dto.pacienteId },
      });
      if (!paciente) throw new NotFoundException('Paciente no encontrado');

      if (paciente.bloqueado) {
        const bloqueadas = paciente.especialidadesBloqueadas
          ? JSON.parse(paciente.especialidadesBloqueadas)
          : [];
        if (bloqueadas.includes(dto.especialidad)) {
          throw new ForbiddenException('El paciente esta bloqueado para esta especialidad');
        }
      }

      const diaSemana = fechaConsulta.getDay();
      const horariosDia = await tx.horarioEspecialista.findMany({
        where: { especialistaId: dto.especialistaId, diaSemana, activo: true },
      });
      if (horariosDia.length === 0) {
        throw new BadRequestException('El especialista no tiene horario para este dia de la semana');
      }
      const dtoStart = timeToMinutes(dto.horaInicio);
      const dtoEnd = timeToMinutes(dto.horaFin);
      const dentroDeHorario = horariosDia.some(h => {
        const hStart = timeToMinutes(h.horaInicio);
        const hEnd = timeToMinutes(h.horaFin);
        return dtoStart >= hStart && dtoEnd <= hEnd;
      });
      if (!dentroDeHorario) {
        throw new BadRequestException('La hora solicitada esta fuera del horario del especialista para este dia');
      }

      let atendidaId = dto.atendidaPorId || null;
      if (!atendidaId && dto.atendidoPorCedula && dto.atendidoPorNombre) {
        if (!/^\d{10}$/.test(dto.atendidoPorCedula.trim())) {
          throw new BadRequestException('La cedula del pasante debe tener 10 digitos');
        }
        let pasante = await tx.pasante.findFirst({
          where: { especialistaId: dto.especialistaId, numeroIdentificacion: dto.atendidoPorCedula.trim() },
        });
        if (!pasante) {
          pasante = await tx.pasante.create({
            data: {
              especialistaId: dto.especialistaId,
              nombres: dto.atendidoPorNombre.trim(),
              apellidos: '',
              tipoIdentificacion: 'CEDULA',
              numeroIdentificacion: dto.atendidoPorCedula.trim(),
            },
          });
        }
        atendidaId = pasante.id;
      }

      await this.domain.conflicts.validarConflictos(
        dto.especialistaId,
        dto.pacienteId,
        dto.fecha,
        dto.horaInicio,
        dto.horaFin,
        undefined,
        tx,
        atendidaId || undefined,
      );

      return tx.cita.create({
        data: {
          especialistaId: dto.especialistaId,
          pacienteId: dto.pacienteId,
          fecha: fechaConsulta,
          horaInicio: dto.horaInicio,
          horaFin: dto.horaFin,
          duracionMinutos: dto.duracionMinutos,
          especialidad: dto.especialidad,
          lugar: dto.lugar,
          motivo: dto.motivo || '',
          tipo: dto.tipo || null,
          protocoloId: dto.protocoloId || null,
          notaAdmin: dto.notaAdmin,
          esRecurrente: dto.esRecurrente || false,
          atendidaPorId: atendidaId || null,
          recurrenciaDiaSemana: dto.recurrenciaDiaSemana,
          recurrenciaFechaFin: dto.recurrenciaFechaFin ? parseEcDate(dto.recurrenciaFechaFin) : null,
          recurrenciaDiasSemana: diasSemana ? JSON.stringify(diasSemana) : null,
          recurrenciaCantidad: dto.recurrenciaCantidad || null,
        },
        include: { paciente: true, especialista: true },
      });
    });

    await this.auditoriaService.registrar({
      usuarioId: creadoPorId,
      accion: 'CREAR_CITA',
      entidad: 'Cita',
      entidadId: cita.id,
      detalle: { pacienteId: dto.pacienteId, especialistaId: dto.especialistaId, fecha: dto.fecha, horaInicio: dto.horaInicio },
    });

    if (dto.esRecurrente) {
      if (dto.recurrenciaDetalle && dto.recurrenciaDetalle.length > 0) {
        await this.domain.recurrence.generarCitasRecurrentes(cita, dto, []);
      } else if (diasSemana && diasSemana.length > 0 && (dto.recurrenciaCantidad || dto.recurrenciaFechaFin)) {
        await this.domain.recurrence.generarCitasRecurrentes(cita, dto, diasSemana);
      }
    }

    return cita;
  }
}
