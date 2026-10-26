import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CitaDomainService } from './services/domain/cita-domain.service';
import { CitaCreateService } from './services/application/cita-create.service';
import { CitaUpdateService } from './services/application/cita-update.service';
import { CitaEstadosService } from './services/application/cita-estados.service';
import { CitaReagendarService } from './services/application/cita-reagendar.service';
import { CreateCitaDto } from './dto/create-cita.dto';
import { UpdateCitaDto } from './dto/update-cita.dto';
import { UpdateCitaEstadoDto, ReagendarCitaDto, ReagendarMasivoDto } from './dto/actions.dto';
import { parseEcDate, ecStartOfDay } from '../../common/utils/date-ec.utils';
import { CitaFiltersDto } from './dto/queries.dto';

@Injectable()
export class CitasService {
  constructor(
    private prisma: PrismaService,
    readonly domain: CitaDomainService,
    private createService: CitaCreateService,
    private updateService: CitaUpdateService,
    private estadosService: CitaEstadosService,
    private reagendarService: CitaReagendarService,
  ) {}

  async create(dto: CreateCitaDto, creadoPorId: string) {
    return this.createService.create(dto, creadoPorId);
  }

  async findAll(filters: CitaFiltersDto) {
    const where: any = {};

    if (filters.userRol === 'ESPECIALISTA') {
      const esp = await this.prisma.especialista.findUnique({
        where: { usuarioId: filters.userId },
      });
      if (esp) where.especialistaId = esp.id;
    }

    if (filters.especialistaId) where.especialistaId = filters.especialistaId;
    if (filters.pacienteId) where.pacienteId = filters.pacienteId;
    if (filters.estado) where.estado = filters.estado;
    if (filters.especialidad) {
      where.especialidad = { contains: filters.especialidad };
    }
    if (filters.fechaInicio || filters.fechaFin) {
      where.fecha = {};
      if (filters.fechaInicio) {
        where.fecha.gte = parseEcDate(filters.fechaInicio);
      }
      if (filters.fechaFin) {
        const [yf, mf, df] = filters.fechaFin.split('-').map(Number);
        where.fecha.lt = ecStartOfDay(yf, mf, df + 1);
      }
    }
    if (filters.searchPaciente) {
      where.paciente = {
        OR: [
          { nombres: { contains: filters.searchPaciente } },
          { apellidos: { contains: filters.searchPaciente } },
          { numeroIdentificacion: { contains: filters.searchPaciente } },
        ],
      };
    }

    return this.prisma.cita.findMany({
      where,
      select: {
        id: true, especialistaId: true, pacienteId: true,
        fecha: true, horaInicio: true, horaFin: true, duracionMinutos: true,
        especialidad: true, lugar: true, motivo: true, notaAdmin: true,
        notaEspecialista: true, estado: true,
        esRecurrente: true, recurrenciaDiaSemana: true, recurrenciaDiasSemana: true,
        recurrenciaCantidad: true, recurrenciaFechaFin: true,
        citaOrigenId: true, citaReagendadaId: true,
        notasModificacion: true, fechaModificacion: true,
        whatsappEnviado: true, whatsappConfirmado: true,
        canceladaPor: true, motivoCancelacion: true, fechaCancelacion: true,
        atendidaPorId: true,
        createdAt: true, updatedAt: true,
        paciente: {
          select: { id: true, nombres: true, apellidos: true, numeroIdentificacion: true, telefono: true },
        },
        especialista: {
          select: { id: true, nombres: true, apellidos: true, especialidad: true, sede: true, consultorioPredeterminado: true },
        },
        citasDerivadas: {
          select: { id: true, fecha: true, horaInicio: true, estado: true },
          orderBy: { fecha: 'asc' },
        },
      },
      orderBy: [{ fecha: 'desc' }, { horaInicio: 'desc' }],
    });
  }

  async findOne(id: string) {
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
    return cita;
  }

  async update(id: string, dto: UpdateCitaDto, userId: string) {
    return this.updateService.update(id, dto, userId);
  }

  async updateEstado(id: string, dto: UpdateCitaEstadoDto, userId: string, userRol: string) {
    return this.estadosService.updateEstado(id, dto, userId, userRol);
  }

  async reagendar(id: string, dto: ReagendarCitaDto, userId: string) {
    return this.reagendarService.reagendar(id, dto, userId);
  }

  async reagendarMasivo(dto: ReagendarMasivoDto, userId: string) {
    const results = [];
    for (const cita of dto.citas) {
      try {
        const result = await this.reagendarService.reagendar(cita.id, {
          fecha: cita.fecha,
          horaInicio: cita.horaInicio,
          horaFin: cita.horaFin,
          notasModificacion: dto.notasModificacion,
        }, userId);
        results.push({ id: cita.id, success: true, data: result });
      } catch (e: any) {
        results.push({ id: cita.id, success: false, error: e.message });
      }
    }
    return results;
  }

  async liberarHorario(id: string, userId: string) {
    return this.estadosService.liberarHorario(id, userId);
  }

  async getCitasDelDia(fecha?: Date) {
    return this.domain.slots.getCitasDelDia(fecha);
  }
}
