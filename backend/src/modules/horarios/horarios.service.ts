import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateHorarioDto, BatchHorariosDto } from './dto/create-horario.dto';
import { timeToMinutes, normalizeTime } from '../../common/utils/time.utils';

@Injectable()
export class HorariosService {
  constructor(
    private prisma: PrismaService,
    private auditoriaService: AuditoriaService,
  ) {}

  async create(dto: CreateHorarioDto, usuarioId: string) {
    const especialista = await this.prisma.especialista.findUnique({
      where: { id: dto.especialistaId },
    });
    if (!especialista) throw new NotFoundException('Especialista no encontrado');

    dto.horaInicio = normalizeTime(dto.horaInicio);
    dto.horaFin = normalizeTime(dto.horaFin);

    const existingHorarios = await this.prisma.horarioEspecialista.findMany({
      where: {
        especialistaId: dto.especialistaId,
        diaSemana: dto.diaSemana,
        activo: true,
      },
    });

    const dtoStart = timeToMinutes(dto.horaInicio);
    const dtoEnd = timeToMinutes(dto.horaFin);
    const conflicting = existingHorarios.find((h) => {
      const hStart = timeToMinutes(h.horaInicio);
      const hEnd = timeToMinutes(h.horaFin);
      return hStart < dtoEnd && hEnd > dtoStart;
    });

    if (conflicting) {
      throw new ConflictException('El horario se superpone con otro existente');
    }

    const horario = await this.prisma.horarioEspecialista.create({ data: dto });

    await this.auditoriaService.registrar({
      usuarioId,
      accion: 'CREAR_HORARIO',
      entidad: 'HorarioEspecialista',
      entidadId: horario.id,
      detalle: { especialistaId: dto.especialistaId, diaSemana: dto.diaSemana, horaInicio: dto.horaInicio, horaFin: dto.horaFin },
    });

    return horario;
  }

  async createBatch(dto: BatchHorariosDto, usuarioId: string) {
    const results = [];
    for (const h of dto.horarios) {
      const horario = await this.create({
        ...h,
        especialistaId: dto.especialistaId,
      }, usuarioId);
      results.push(horario);
    }
    return results;
  }

  async findByEspecialista(especialistaId: string, soloActivos = true) {
    return this.prisma.horarioEspecialista.findMany({
      where: {
        especialistaId,
        ...(soloActivos ? { activo: true } : {}),
      },
      orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
    });
  }

  async update(id: string, dto: Partial<CreateHorarioDto>, usuarioId: string) {
    const horario = await this.prisma.horarioEspecialista.findUnique({ where: { id } });
    if (!horario) throw new NotFoundException('Horario no encontrado');

    const data: any = {};
    if (dto.horaInicio) data.horaInicio = normalizeTime(dto.horaInicio);
    if (dto.horaFin) data.horaFin = normalizeTime(dto.horaFin);
    if (dto.duracionMinutos) data.duracionMinutos = dto.duracionMinutos;
    if (dto.observaciones !== undefined) data.observaciones = dto.observaciones;
    if (dto.diaSemana !== undefined) data.diaSemana = dto.diaSemana;

    const horarioActualizado = await this.prisma.horarioEspecialista.update({
      where: { id },
      data,
    });

    await this.auditoriaService.registrar({
      usuarioId,
      accion: 'ACTUALIZAR_HORARIO',
      entidad: 'HorarioEspecialista',
      entidadId: id,
      detalle: dto,
    });

    return horarioActualizado;
  }

  async toggleActive(id: string, usuarioId: string) {
    const horario = await this.prisma.horarioEspecialista.findUnique({ where: { id } });
    if (!horario) throw new NotFoundException('Horario no encontrado');

    const updated = await this.prisma.horarioEspecialista.update({
      where: { id },
      data: { activo: !horario.activo },
    });

    await this.auditoriaService.registrar({
      usuarioId,
      accion: horario.activo ? 'DESACTIVAR_HORARIO' : 'ACTIVAR_HORARIO',
      entidad: 'HorarioEspecialista',
      entidadId: id,
    });

    return updated;
  }

  async remove(id: string, usuarioId: string) {
    await this.prisma.horarioEspecialista.delete({ where: { id } });

    await this.auditoriaService.registrar({
      usuarioId,
      accion: 'ELIMINAR_HORARIO',
      entidad: 'HorarioEspecialista',
      entidadId: id,
    });

    return { message: 'Horario eliminado' };
  }

  async getAvailableSlots(especialistaId: string, fechaStr: string, pacienteId?: string, tienePasantes?: boolean, pasanteCedula?: string) {
    const [y, m, d] = fechaStr.split('-').map(Number);
    const year = y, month = m - 1, day = d;
    const fecha = new Date(year, month, day);
    const diaSemana = fecha.getDay();
    const feriado = await this.prisma.feriado.findUnique({
      where: { fecha: new Date(fechaStr) },
    });
    if (feriado?.activo) return [];

    // Check BloqueoGrupal
    const bloqueos = await this.prisma.bloqueoGrupal.findMany({
      where: {
        fechaInicio: { lte: fecha },
        AND: [{ OR: [{ fechaFin: { gte: fecha } }, { fechaFin: null }] }],
        especialistas: { some: { especialistaId } },
      },
    });
    if (bloqueos.length > 0) return [];

    // Check suspension temporal individual con fechas
    const esp = await this.prisma.especialista.findUnique({ where: { id: especialistaId } });
    if (esp?.estado === 'SUSPENDIDO_TEMPORAL' && esp.fechaInicioSuspension) {
      const fin = esp.fechaFinSuspension || new Date(8640000000000000);
      if (fecha >= esp.fechaInicioSuspension && fecha <= fin) return [];
    }

    const horarios = await this.prisma.horarioEspecialista.findMany({
      where: {
        especialistaId,
        diaSemana,
        activo: true,
      },
      orderBy: { horaInicio: 'asc' },
    });

    // Citas propias del especialista (sin pasante)
    const citasDelDia = await this.prisma.cita.findMany({
      where: {
        especialistaId,
        atendidaPorId: null,
        fecha: {
          gte: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()),
          lt: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1),
        },
        NOT: { estado: 'CANCELADA', slotLiberado: true },
      },
      select: { horaInicio: true, horaFin: true },
    });

    // Buscar citas del pasante si viene cédula
    let citasDelPasante: { start: number; end: number }[] = [];
    if (pasanteCedula) {
      const pasante = await this.prisma.pasante.findFirst({
        where: { especialistaId, numeroIdentificacion: pasanteCedula.trim(), activo: true },
      });
      if (pasante) {
        const citasPasante = await this.prisma.cita.findMany({
          where: {
            atendidaPorId: pasante.id,
            fecha: {
              gte: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()),
              lt: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1),
            },
            NOT: { estado: 'CANCELADA', slotLiberado: true },
          },
          select: { horaInicio: true, horaFin: true },
        });
        citasDelPasante = citasPasante.map((c) => ({
          start: timeToMinutes(c.horaInicio),
          end: timeToMinutes(c.horaFin),
        }));
      }
    }

    const citasPaciente = pacienteId ? await this.prisma.cita.findMany({
      where: {
        pacienteId,
        fecha: {
          gte: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()),
          lt: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1),
        },
        NOT: { estado: 'CANCELADA', slotLiberado: true },
      },
      select: { horaInicio: true, horaFin: true },
    }) : [];

    const citasOcupadas = citasDelDia.map((c) => ({
      start: timeToMinutes(c.horaInicio),
      end: timeToMinutes(c.horaFin),
    }));

    const citasDelPaciente = citasPaciente.map((c) => ({
      start: timeToMinutes(c.horaInicio),
      end: timeToMinutes(c.horaFin),
    }));

    type SlotStatus = 'DISPONIBLE' | 'OCUPADO_ESPECIALISTA' | 'OCUPADO_PACIENTE' | 'OCUPADO_PASANTE';
    const slots: { horaInicio: string; horaFin: string; duracionMinutos: number; estado: SlotStatus }[] = [];

    for (const horario of horarios) {
      const startMinutes = timeToMinutes(horario.horaInicio);
      const endMinutes = timeToMinutes(horario.horaFin);

      for (let m = startMinutes; m + Math.min(horario.duracionMinutos || 30, 30) <= endMinutes; m += Math.min(horario.duracionMinutos || 30, 30)) {
        const slotDuration = Math.min(horario.duracionMinutos || 30, 30);
        const slotStart = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
        const slotEnd = `${String(Math.floor((m + slotDuration) / 60)).padStart(2, '0')}:${String((m + slotDuration) % 60).padStart(2, '0')}`;
        const slotStartMin = m;
        const slotEndMin = m + slotDuration;

        // Si viene cédula de pasante, filtrar solo por ese pasante, no por especialista
        if (pasanteCedula) {
          const pasanteConflict = citasDelPasante.some(
            (c) => c.start < slotEndMin && c.end > slotStartMin,
          );
          if (pasanteConflict) {
            slots.push({ horaInicio: slotStart, horaFin: slotEnd, duracionMinutos: slotDuration, estado: 'OCUPADO_PASANTE' });
            continue;
          }
        } else {
          // Siempre verificar citas propias del especialista
          const isOccupied = citasOcupadas.some(
            (c) => c.start < slotEndMin && c.end > slotStartMin,
          );
          if (isOccupied) {
            slots.push({ horaInicio: slotStart, horaFin: slotEnd, duracionMinutos: slotDuration, estado: 'OCUPADO_ESPECIALISTA' });
            continue;
          }
        }

        const pacienteConflict = citasDelPaciente.some(
          (c) => c.start < slotEndMin && c.end > slotStartMin,
        );
        if (pacienteConflict) {
          slots.push({ horaInicio: slotStart, horaFin: slotEnd, duracionMinutos: slotDuration, estado: 'OCUPADO_PACIENTE' });
          continue;
        }

        slots.push({ horaInicio: slotStart, horaFin: slotEnd, duracionMinutos: slotDuration, estado: 'DISPONIBLE' });
      }
    }

    return slots;
  }
}
