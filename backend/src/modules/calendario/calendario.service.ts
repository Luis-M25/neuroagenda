import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { parseEcDate } from '../../common/utils/date-ec.utils';

@Injectable()
export class CalendarioService {
  constructor(
    private prisma: PrismaService,
    private auditoriaService: AuditoriaService,
  ) {}

  async getEventos(fechaInicio: string, fechaFin: string, especialistaId?: string, userId?: string, userRol?: string) {
    const where: any = {
      fecha: {
        gte: parseEcDate(fechaInicio),
        lte: parseEcDate(fechaFin),
      },
      estado: { notIn: ['CANCELADA'] },
    };

    if (userRol === 'ESPECIALISTA') {
      const esp = await this.prisma.especialista.findUnique({ where: { usuarioId: userId } });
      if (esp) where.especialistaId = esp.id;
    }

    if (especialistaId) where.especialistaId = especialistaId;

    const citas = await this.prisma.cita.findMany({
      where,
      include: {
        paciente: { select: { nombres: true, apellidos: true, telefono: true } },
        especialista: { select: { id: true, nombres: true, apellidos: true, especialidad: true, sede: true, consultorioPredeterminado: true } },
      },
      orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }],
    });

    const coloresPorEstado: Record<string, string> = {
      PENDIENTE: '#f59e0b',
      CONFIRMADA: '#3b82f6',
      EN_ESPERA: '#8b5cf6',
      EN_ATENCION: '#10b981',
      ATENDIDA: '#6b7280',
      NO_ASISTIO: '#ef4444',
      CANCELADA: '#dc2626',
      REAGENDADA: '#f97316',
    };

    return citas.map((cita) => ({
      id: cita.id,
      title: `${cita.especialista.nombres.split(' ')[0]} ${cita.especialista.apellidos.split(' ')[0]}`,
      start: `${cita.fecha.toISOString().split('T')[0]}T${cita.horaInicio}:00`,
      end: `${cita.fecha.toISOString().split('T')[0]}T${cita.horaFin}:00`,
      backgroundColor: coloresPorEstado[cita.estado] || '#6b7280',
      borderColor: coloresPorEstado[cita.estado] || '#6b7280',
      extendedProps: {
        citaId: cita.id,
        estado: cita.estado,
        especialista: `${cita.especialista.nombres} ${cita.especialista.apellidos}`,
        especialistaId: cita.especialista.id,
        especialidad: cita.especialista.especialidad,
        paciente: `${cita.paciente.nombres} ${cita.paciente.apellidos}`,
        ...(userRol !== 'PORTERO' ? { pacienteTelefono: cita.paciente.telefono } : {}),
        motivo: cita.motivo,
        lugar: cita.lugar,
      },
    }));
  }

  async bloquearDia(dto: { fecha: string; motivo: string; cancelarCitas?: boolean; reagendarCitas?: boolean }, userId: string) {
    if (!dto.fecha || !dto.motivo) {
      throw new BadRequestException('Fecha y motivo son requeridos');
    }

    const fecha = new Date(dto.fecha);
    fecha.setHours(0, 0, 0, 0);

    const existente = await this.prisma.diaBloqueado.findUnique({ where: { fecha } });
    if (existente?.activo) {
      throw new ConflictException('El día ya está bloqueado');
    }

    if (fecha < new Date(new Date().toDateString())) {
      throw new BadRequestException('No se puede bloquear una fecha pasada');
    }

    const citasDelDia = await this.prisma.cita.findMany({
      where: {
        fecha,
        estado: { notIn: ['CANCELADA', 'ATENDIDA', 'NO_ASISTIO'] },
      },
      include: {
        paciente: { select: { nombres: true, apellidos: true, telefono: true } },
      },
    });

    if (citasDelDia.length > 0) {
      if (dto.cancelarCitas) {
        await Promise.all(
          citasDelDia.map((cita) =>
            this.prisma.cita.update({
              where: { id: cita.id },
              data: {
                estado: 'CANCELADA',
                canceladaPor: 'SISTEMA',
                motivoCancelacion: `Día bloqueado: ${dto.motivo}`,
                fechaCancelacion: new Date(),
                slotLiberado: true,
              },
            }),
          ),
        );
      } else if (!dto.reagendarCitas) {
        return {
          requiereAccion: true,
          citasAfectadas: citasDelDia.map((c) => ({
            id: c.id,
            paciente: `${c.paciente.nombres} ${c.paciente.apellidos}`,
            horaInicio: c.horaInicio,
            estado: c.estado,
          })),
          mensaje: `Hay ${citasDelDia.length} citas activas en esta fecha. Debe cancelarlas o reagendarlas.`,
        };
      }
    }

    const bloqueo = await this.prisma.diaBloqueado.upsert({
      where: { fecha },
      update: { motivo: dto.motivo, activo: true },
      create: { fecha, motivo: dto.motivo },
    });

    await this.auditoriaService.registrar({
      usuarioId: userId,
      accion: 'BLOQUEAR_DIA',
      entidad: 'DiaBloqueado',
      entidadId: bloqueo.id,
      detalle: {
        fecha: dto.fecha,
        motivo: dto.motivo,
        citasAfectadas: citasDelDia.length,
        citasCanceladas: dto.cancelarCitas ? citasDelDia.length : 0,
      },
    });

    return bloqueo;
  }

  async actualizarBloqueo(id: string, dto: { motivo?: string; activo?: boolean }) {
    const bloqueo = await this.prisma.diaBloqueado.findUnique({ where: { id } });
    if (!bloqueo) throw new NotFoundException('Bloqueo no encontrado');

    return this.prisma.diaBloqueado.update({
      where: { id },
      data: dto,
    });
  }

  async eliminarBloqueo(id: string) {
    const bloqueo = await this.prisma.diaBloqueado.findUnique({ where: { id } });
    if (!bloqueo) throw new NotFoundException('Bloqueo no encontrado');

    return this.prisma.diaBloqueado.update({
      where: { id },
      data: { activo: false },
    });
  }

  async getDiasBloqueados(fechaInicio?: string, fechaFin?: string) {
    const where: any = { activo: true };
    if (fechaInicio && fechaFin) {
      where.fecha = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin),
      };
    }
    return this.prisma.diaBloqueado.findMany({ where, orderBy: { fecha: 'asc' } });
  }

  async getTodasFechasBloqueadas() {
    const [diasBloqueados, feriados] = await Promise.all([
      this.prisma.diaBloqueado.findMany({
        where: { activo: true },
        select: { fecha: true, motivo: true, id: true },
        orderBy: { fecha: 'asc' },
      }),
      this.prisma.feriado.findMany({
        where: { activo: true },
        select: { fecha: true, nombre: true, id: true },
        orderBy: { fecha: 'asc' },
      }),
    ]);

    return {
      diasBloqueados: diasBloqueados.map((d) => ({
        ...d,
        fecha: d.fecha.toISOString().split('T')[0],
        tipo: 'BLOQUEO',
      })),
      feriados: feriados.map((f) => ({
        ...f,
        fecha: f.fecha.toISOString().split('T')[0],
        tipo: 'FERIADO',
      })),
    };
  }
}
