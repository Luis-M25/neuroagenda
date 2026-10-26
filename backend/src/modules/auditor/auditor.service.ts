import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { RevisarHcDto } from './dto/revision.dto';

interface ListarHcFilters {
  especialistaId?: string;
  pacienteId?: string;
  especialidad?: string;
  estadoRevision?: string;
  desde?: string;
  hasta?: string;
  pagina: number;
  limite: number;
}

@Injectable()
export class AuditorService {
  constructor(
    private prisma: PrismaService,
    private auditoriaService: AuditoriaService,
  ) {}

  async listarHc(filters: ListarHcFilters) {
    const where: any = {};

    if (filters.especialistaId) where.especialistaId = filters.especialistaId;
    if (filters.pacienteId) where.pacienteId = filters.pacienteId;
    if (filters.especialidad) {
      where.especialista = { especialidad: { contains: filters.especialidad } };
    }
    if (filters.estadoRevision) {
      if (filters.estadoRevision === 'PENDIENTE') {
        where.AND = [
          { revisiones: { none: {} } },
        ];
      } else {
        where.revisiones = { some: { estado: filters.estadoRevision } };
      }
    }

    const [total, items] = await Promise.all([
      this.prisma.consultaHCE.count({ where }),
      this.prisma.consultaHCE.findMany({
        where,
        include: {
          paciente: {
            select: { id: true, nombres: true, apellidos: true, numeroIdentificacion: true },
          },
          especialista: {
            select: { id: true, nombres: true, apellidos: true, especialidad: true },
          },
          firmas: { select: { id: true, fechaFirma: true, tipo: true } },
          diagnosticos: { select: { id: true, codigoCIE10: true, descripcion: true } },
          _count: { select: { versiones: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (filters.pagina - 1) * filters.limite,
        take: filters.limite,
      }),
    ]);

    const consultaIds = items.map((c) => c.id);
    const revisiones = await this.prisma.auditoriaHCRevision.findMany({
      where: { consultaId: { in: consultaIds } },
      orderBy: { createdAt: 'desc' },
      distinct: ['consultaId'],
    });

    const revisionMap = new Map(revisiones.map((r) => [r.consultaId, r]));

    const itemsConRevision = items.map((item) => ({
      ...item,
      ultimaRevision: revisionMap.get(item.id) || null,
    }));

    return { total, pagina: filters.pagina, limite: filters.limite, items: itemsConRevision };
  }

  async getHcCompleta(consultaId: string) {
    const consulta = await this.prisma.consultaHCE.findUnique({
      where: { id: consultaId },
      include: {
        paciente: {
          select: {
            id: true, nombres: true, apellidos: true, numeroIdentificacion: true,
            genero: true, fechaNacimiento: true, telefono: true, direccion: true,
            grupoSanguineo: true, tipoSeguro: true, alergias: true, enfermedadesPreexistentes: true,
          },
        },
        especialista: {
          select: {
            id: true, nombres: true, apellidos: true, especialidad: true,
            codigoMsp: true, tituloProfesional: true,
          },
        },
        cita: {
          select: { id: true, fecha: true, horaInicio: true, horaFin: true, lugar: true },
        },
        diagnosticos: true,
        prescripciones: true,
        evoluciones: true,
        pedidos: true,
        indicaciones: true,
        examenes: { orderBy: { fecha: 'desc' } },
        signosVitales: { orderBy: { fecha: 'desc' } },
        examenMental: true,
        historiaFamiliar: true,
        firmas: { orderBy: { fechaFirma: 'desc' } },
        versiones: { orderBy: { version: 'desc' }, take: 5 },
      },
    });

    if (!consulta) throw new NotFoundException('Consulta no encontrada');

    const revisiones = await this.prisma.auditoriaHCRevision.findMany({
      where: { consultaId },
      orderBy: { createdAt: 'desc' },
      include: { auditor: { select: { id: true, email: true, nombres: true, apellidos: true } } },
    });

    return { ...consulta, revision: revisiones[0] || null, revisiones };
  }

  async revisarHc(consultaId: string, dto: RevisarHcDto, userId: string) {
    const consulta = await this.prisma.consultaHCE.findUnique({
      where: { id: consultaId },
    });
    if (!consulta) throw new NotFoundException('Consulta no encontrada');

    const revision = await this.prisma.auditoriaHCRevision.create({
      data: {
        consultaId,
        auditorId: userId,
        estado: dto.estado,
        observacion: dto.observacion,
      },
    });

    await this.auditoriaService.registrar({
      usuarioId: userId,
      accion: dto.estado === 'REVISADO' ? 'REVISAR_HC' : 'REVISAR_HC_OBSERVACIONES',
      entidad: 'AuditoriaHCRevision',
      entidadId: revision.id,
      detalle: { consultaId, observacion: dto.observacion },
    });

    return revision;
  }

  async listarEspecialistas() {
    return this.prisma.especialista.findMany({
      select: {
        id: true, nombres: true, apellidos: true, especialidad: true,
        sede: true, codigoMsp: true,
        _count: { select: { consultas: true } },
      },
      orderBy: { apellidos: 'asc' },
    });
  }

  async getEstadisticas() {
    const [totalConsultas, revisiones] = await Promise.all([
      this.prisma.consultaHCE.count(),
      this.prisma.auditoriaHCRevision.groupBy({
        by: ['estado'],
        _count: true,
      }),
    ]);

    const totalRevisadas = revisiones.reduce((acc, r) => acc + r._count, 0);
    const pendientes = totalConsultas - totalRevisadas;

    return {
      totalConsultas,
      revisiones: {
        revisadas: revisiones.find((r) => r.estado === 'REVISADO')?._count || 0,
        conObservaciones: revisiones.find((r) => r.estado === 'REVISADO_CON_OBSERVACIONES')?._count || 0,
        pendientes,
      },
    };
  }
}
