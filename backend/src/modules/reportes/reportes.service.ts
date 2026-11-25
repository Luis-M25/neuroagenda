import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as fs from 'fs';
import { PrismaService } from '../../common/prisma.service';
import { ecStartOfDay, parseEcDate } from '../../common/utils/date-ec.utils';
import { HceService } from '../hce/hce.service';
import {
  AsistenciasQueryDto,
  BuscarPacientesHcQueryDto,
  ExportarReporteQueryDto,
  RegistroHcQueryDto,
} from './dto/reportes-query.dto';

const CSV_HEADERS: Record<string, string[]> = {
  'no-asistidos': ['Paciente', 'Identificacion', 'Telefono', 'Especialidad', 'Total Inasistencias', 'Fecha', 'Hora', 'Especialista'],
  'citas-por-especialista': ['Especialista', 'Especialidad', 'Total', 'Pendientes', 'Confirmadas', 'Atendidas', 'Canceladas', 'No Asistieron'],
  dashboard: ['Indicador', 'Valor'],
  'asistencias-por-paciente': ['Paciente', 'Identificacion', 'Fecha', 'Hora Inicio', 'Hora Fin', 'Especialidad', 'Especialista', 'Estado', 'Lugar'],
  'registro-hc': ['Fecha', 'Hora', 'Paciente', 'Identificacion', 'Numero Consulta', 'Especialidad', 'Especialista', 'Estado HC', 'PDF Disponible'],
};

type ConsultaZip = {
  id: string;
  numeroConsulta: number | null;
  createdAt: Date;
  cita: { fecha: Date; horaInicio: string } | null;
  especialista: { especialidad: string; nombres: string; apellidos: string };
};

@Injectable()
export class ReportesService {
  constructor(
    private prisma: PrismaService,
    private hceService: HceService,
  ) {}

  private buildDateRange(fechaInicio?: string, fechaFin?: string) {
    if (!fechaInicio && !fechaFin) return undefined;
    const range: { gte?: Date; lt?: Date } = {};
    if (fechaInicio) range.gte = parseEcDate(fechaInicio);
    if (fechaFin) {
      const [year, month, day] = fechaFin.split('-').map(Number);
      range.lt = ecStartOfDay(year, month, day + 1);
    }
    return range;
  }

  private buildAsistenciasWhere(filters: Pick<AsistenciasQueryDto, 'pacienteId' | 'q' | 'estado' | 'fechaInicio' | 'fechaFin'>): Prisma.CitaWhereInput {
    const where: Prisma.CitaWhereInput = {};
    const dateRange = this.buildDateRange(filters.fechaInicio, filters.fechaFin);
    if (dateRange) where.fecha = dateRange;
    if (filters.pacienteId) where.pacienteId = filters.pacienteId;
    if (filters.estado) where.estado = filters.estado;
    if (filters.q?.trim()) {
      const q = filters.q.trim();
      where.paciente = {
        OR: [
          { nombres: { contains: q } },
          { apellidos: { contains: q } },
          { numeroIdentificacion: { contains: q } },
        ],
      };
    }
    return where;
  }

  private buildRegistroHcWhere(filters: Pick<RegistroHcQueryDto, 'pacienteId' | 'q' | 'especialidad' | 'estadoFirma' | 'fechaInicio' | 'fechaFin'>): Prisma.ConsultaHCEWhereInput {
    const where: Prisma.ConsultaHCEWhereInput = {};
    const dateRange = this.buildDateRange(filters.fechaInicio, filters.fechaFin);
    if (dateRange) {
      where.OR = [
        { cita: { is: { fecha: dateRange } } },
        { citaId: null, createdAt: dateRange },
      ];
    }
    if (filters.pacienteId) where.pacienteId = filters.pacienteId;
    if (filters.estadoFirma) where.firmada = filters.estadoFirma === 'FIRMADA';
    if (filters.especialidad?.trim()) {
      where.especialista = { especialidad: { contains: filters.especialidad.trim() } };
    }
    if (filters.q?.trim()) {
      const q = filters.q.trim();
      where.paciente = {
        OR: [
          { nombres: { contains: q } },
          { apellidos: { contains: q } },
          { numeroIdentificacion: { contains: q } },
        ],
      };
    }
    return where;
  }

  private readonly asistenciaSelect = {
    id: true,
    fecha: true,
    horaInicio: true,
    horaFin: true,
    estado: true,
    especialidad: true,
    lugar: true,
    paciente: {
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        numeroIdentificacion: true,
      },
    },
    especialista: {
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        especialidad: true,
      },
    },
  } satisfies Prisma.CitaSelect;

  private readonly registroHcSelect = {
    id: true,
    numeroConsulta: true,
    createdAt: true,
    firmada: true,
    firmadaEn: true,
    archivoPdfUrl: true,
    paciente: {
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        numeroIdentificacion: true,
      },
    },
    especialista: {
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        especialidad: true,
      },
    },
    cita: {
      select: {
        fecha: true,
        horaInicio: true,
      },
    },
  } satisfies Prisma.ConsultaHCESelect;

  async getAsistencias(filters: AsistenciasQueryDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const where = this.buildAsistenciasWhere(filters);
    const [total, citas] = await Promise.all([
      this.prisma.cita.count({ where }),
      this.prisma.cita.findMany({
        where,
        select: this.asistenciaSelect,
        orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, page, limit, items: citas };
  }

  async getRegistroHistoriasClinicas(filters: RegistroHcQueryDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const where = this.buildRegistroHcWhere(filters);
    const [total, consultas] = await Promise.all([
      this.prisma.consultaHCE.count({ where }),
      this.prisma.consultaHCE.findMany({
        where,
        select: this.registroHcSelect,
        orderBy: [{ cita: { fecha: 'asc' } }, { createdAt: 'asc' }, { numeroConsulta: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      total,
      page,
      limit,
      items: consultas.map((consulta) => ({
        ...consulta,
        fechaAtencion: consulta.cita?.fecha ?? consulta.createdAt,
        horaAtencion: consulta.cita?.horaInicio ?? null,
        estadoFirma: consulta.firmada ? 'FIRMADA' : 'PENDIENTE',
        pdfDisponible: Boolean(
          consulta.firmada
          && consulta.archivoPdfUrl
          && fs.existsSync(consulta.archivoPdfUrl),
        ),
      })),
    };
  }

  async buscarPacientesConHc(filters: BuscarPacientesHcQueryDto) {
    const q = filters.q?.trim();
    const pacientes = await this.prisma.paciente.findMany({
      where: {
        consultasHCE: { some: {} },
        ...(q
          ? {
              OR: [
                { nombres: { contains: q } },
                { apellidos: { contains: q } },
                { numeroIdentificacion: { contains: q } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        numeroIdentificacion: true,
        consultasHCE: {
          select: {
            firmada: true,
          },
        },
      },
      orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
      take: filters.limit || 15,
    });

    return pacientes.map(({ consultasHCE, ...paciente }) => ({
      ...paciente,
      totalHc: consultasHCE.length,
      firmadas: consultasHCE.filter((consulta) => consulta.firmada).length,
      pendientes: consultasHCE.filter((consulta) => !consulta.firmada).length,
    }));
  }

  private sortConsultasCronologicamente<T extends ConsultaZip>(consultas: T[]): T[] {
    return [...consultas].sort((a, b) => {
      const dateDiff = (a.cita?.fecha ?? a.createdAt).getTime() - (b.cita?.fecha ?? b.createdAt).getTime();
      if (dateDiff !== 0) return dateDiff;
      const hourDiff = (a.cita?.horaInicio ?? '').localeCompare(b.cita?.horaInicio ?? '');
      if (hourDiff !== 0) return hourDiff;
      return (a.numeroConsulta ?? 0) - (b.numeroConsulta ?? 0);
    });
  }

  private formatEcDate(date: Date): string {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Guayaquil',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }

  private sanitizeFilenamePart(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'sin-dato';
  }

  private async getPacienteConConsultas(pacienteId: string) {
    const paciente = await this.prisma.paciente.findUnique({
      where: { id: pacienteId },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        numeroIdentificacion: true,
        consultasHCE: {
          select: {
            id: true,
            numeroConsulta: true,
            createdAt: true,
            firmada: true,
            archivoPdfUrl: true,
            cita: { select: { fecha: true, horaInicio: true } },
            especialista: {
              select: {
                especialidad: true,
                nombres: true,
                apellidos: true,
              },
            },
          },
        },
      },
    });
    if (!paciente) throw new NotFoundException('Paciente no encontrado');
    return paciente;
  }

  async getResumenHcPaciente(pacienteId: string) {
    const paciente = await this.getPacienteConConsultas(pacienteId);
    const consultas = this.sortConsultasCronologicamente(paciente.consultasHCE);
    const firmadas = consultas.filter((consulta) => consulta.firmada);
    const pdfNoDisponible = firmadas.filter(
      (consulta) => !consulta.archivoPdfUrl || !fs.existsSync(consulta.archivoPdfUrl),
    ).length;

    return {
      paciente: {
        id: paciente.id,
        nombres: paciente.nombres,
        apellidos: paciente.apellidos,
        numeroIdentificacion: paciente.numeroIdentificacion,
      },
      totalHc: consultas.length,
      firmadas: firmadas.length,
      pendientes: consultas.length - firmadas.length,
      pdfNoDisponible,
      primeraFecha: consultas.length ? (consultas[0].cita?.fecha ?? consultas[0].createdAt) : null,
      ultimaFecha: consultas.length
        ? (consultas[consultas.length - 1].cita?.fecha ?? consultas[consultas.length - 1].createdAt)
        : null,
    };
  }

  async prepararZipHcPaciente(pacienteId: string) {
    const paciente = await this.getPacienteConConsultas(pacienteId);
    const consultas = this.sortConsultasCronologicamente(paciente.consultasHCE);
    const firmadas = consultas.filter((consulta) => consulta.firmada);
    if (firmadas.length === 0) {
      throw new BadRequestException('El paciente no tiene historias clínicas firmadas para descargar');
    }

    const width = Math.max(3, String(firmadas.length).length);
    const files: Array<{ path: string; name: string; consultaId: string }> = [];
    let noDisponibles = 0;

    for (const [index, consulta] of firmadas.entries()) {
      try {
        const pdfPath = await this.hceService.ensureConsultaPdfPath(consulta.id);
        const fecha = this.formatEcDate(consulta.cita?.fecha ?? consulta.createdAt);
        const especialidad = this.sanitizeFilenamePart(consulta.especialista.especialidad);
        const numero = String(index + 1).padStart(width, '0');
        const consultaNumero = String(consulta.numeroConsulta ?? index + 1).padStart(3, '0');
        files.push({
          path: pdfPath,
          name: `${numero}_${fecha}_${especialidad}_HC-${consultaNumero}.pdf`,
          consultaId: consulta.id,
        });
      } catch {
        noDisponibles++;
      }
    }

    if (files.length === 0) {
      throw new BadRequestException('No se pudo preparar ningún PDF firmado para la descarga');
    }

    const identificacion = this.sanitizeFilenamePart(paciente.numeroIdentificacion);
    return {
      paciente: {
        id: paciente.id,
        nombres: paciente.nombres,
        apellidos: paciente.apellidos,
        numeroIdentificacion: paciente.numeroIdentificacion,
      },
      filename: `HC_${identificacion}_${this.formatEcDate(new Date())}.zip`,
      files,
      incluidas: files.length,
      pendientes: consultas.length - firmadas.length,
      noDisponibles,
    };
  }

  async getNoAsistidos(especialidad?: string, fechaInicio?: string, fechaFin?: string) {
    const where: Prisma.CitaWhereInput = { estado: 'NO_ASISTIO' };
    if (especialidad) where.especialidad = { contains: especialidad };
    const dateRange = this.buildDateRange(fechaInicio, fechaFin);
    if (dateRange) where.fecha = dateRange;

    const citas = await this.prisma.cita.findMany({
      where,
      include: {
        paciente: { select: { id: true, nombres: true, apellidos: true, numeroIdentificacion: true, telefono: true } },
        especialista: { select: { nombres: true, apellidos: true, especialidad: true } },
      },
      orderBy: [{ fecha: 'desc' }, { horaInicio: 'asc' }],
    });

    const agrupado: Record<string, { paciente: any; especialidad: string; total: number; citas: any[] }> = {};
    for (const cita of citas) {
      const key = `${cita.pacienteId}-${cita.especialidad}`;
      if (!agrupado[key]) {
        agrupado[key] = {
          paciente: cita.paciente,
          especialidad: cita.especialidad,
          total: 0,
          citas: [],
        };
      }
      agrupado[key].total++;
      agrupado[key].citas.push({
        fecha: cita.fecha,
        hora: cita.horaInicio,
        especialista: `${cita.especialista.nombres} ${cita.especialista.apellidos}`,
      });
    }

    return Object.values(agrupado)
      .map((item) => ({
        ...item,
        contador: item.total,
        ultimaInasistencia: item.citas[0]?.fecha ?? null,
      }))
      .sort((a, b) => b.total - a.total);
  }

  async getCitasPorEspecialista(fechaInicio?: string, fechaFin?: string) {
    const where: Prisma.CitaWhereInput = {};
    const dateRange = this.buildDateRange(fechaInicio, fechaFin);
    if (dateRange) where.fecha = dateRange;

    const citas = await this.prisma.cita.findMany({
      where,
      include: {
        especialista: { select: { id: true, nombres: true, apellidos: true, especialidad: true } },
      },
    });

    const agrupado: Record<string, any> = {};
    const estadoField: Record<string, string> = {
      PENDIENTE: 'pendientes',
      CONFIRMADA: 'confirmadas',
      ATENDIDA: 'atendidas',
      CANCELADA: 'canceladas',
      NO_ASISTIO: 'noAsistieron',
    };

    for (const cita of citas) {
      const key = cita.especialistaId;
      if (!agrupado[key]) {
        agrupado[key] = {
          especialistaId: cita.especialistaId,
          especialista: `${cita.especialista.nombres} ${cita.especialista.apellidos}`,
          especialidad: cita.especialista.especialidad,
          total: 0,
          pendientes: 0,
          confirmadas: 0,
          atendidas: 0,
          canceladas: 0,
          noAsistieron: 0,
        };
      }
      agrupado[key].total++;
      const field = estadoField[cita.estado];
      if (field) agrupado[key][field]++;
    }

    return Object.values(agrupado).sort((a: any, b: any) => b.total - a.total);
  }

  async getDashboard(fecha?: string) {
    const hoy = new Date();
    const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    const fechaBase = fecha ? new Date(`${fecha}T00:00:00`) : hoySinHora;
    const fechaSinHora = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), fechaBase.getDate());

    const inicio = new Date(fechaSinHora);
    const fin = new Date(fechaSinHora);
    fin.setDate(fin.getDate() + 1);

    const [citas, totalEspecialistas, totalPacientes] = await Promise.all([
      this.prisma.cita.findMany({
        where: {
          fecha: { gte: inicio, lt: fin },
          NOT: { estado: 'CANCELADA', slotLiberado: true },
        },
        include: {
          paciente: { select: { id: true, nombres: true, apellidos: true, numeroIdentificacion: true, telefono: true } },
          especialista: { select: { id: true, nombres: true, apellidos: true, especialidad: true, sede: true, consultorioPredeterminado: true } },
        },
        orderBy: [{ horaInicio: 'asc' }],
      }),
      this.prisma.especialista.count({ where: { estado: 'HABILITADO' } }),
      this.prisma.paciente.count(),
    ]);

    const porEstado: Record<string, number> = {};
    for (const cita of citas) {
      porEstado[cita.estado] = (porEstado[cita.estado] || 0) + 1;
    }

    const especialistasConCitas = new Set(citas.map((c) => c.especialistaId)).size;
    const pacientesConCitas = new Set(
      citas.filter((c) => c.estado !== 'CANCELADA').map((c) => c.pacienteId),
    ).size;

    const horaActual = `${String(hoy.getHours()).padStart(2, '0')}:${String(hoy.getMinutes()).padStart(2, '0')}`;
    const esHoy = fechaSinHora.getTime() === hoySinHora.getTime();
    const esPasado = fechaSinHora.getTime() < hoySinHora.getTime();
    const esFuturo = fechaSinHora.getTime() > hoySinHora.getTime();

    let anteriores: typeof citas = [];
    let enCurso: typeof citas = [];
    let proximas: typeof citas = [];

    if (esPasado) {
      anteriores = citas;
    } else if (esFuturo) {
      proximas = citas;
    } else {
      anteriores = citas.filter((c) => c.horaInicio < horaActual);
      enCurso = citas.filter((c) => c.estado === 'EN_ATENCION');
      proximas = citas.filter((c) => c.horaInicio >= horaActual && c.estado !== 'EN_ATENCION');
    }

    return {
      fecha: `${fechaSinHora.getFullYear()}-${String(fechaSinHora.getMonth() + 1).padStart(2, '0')}-${String(fechaSinHora.getDate()).padStart(2, '0')}`,
      total: citas.length,
      porEstado,
      atendidas: porEstado.ATENDIDA || 0,
      pendientes: porEstado.PENDIENTE || 0,
      confirmadas: porEstado.CONFIRMADA || 0,
      enEspera: porEstado.EN_ESPERA || 0,
      enAtencion: porEstado.EN_ATENCION || 0,
      noAsistieron: porEstado.NO_ASISTIO || 0,
      canceladas: porEstado.CANCELADA || 0,
      especialistasConCitas,
      totalEspecialistas,
      pacientesConCitas,
      totalPacientes,
      citas,
      citasAgrupadas: { anteriores, enCurso, proximas },
      esHoy,
    };
  }

  private escapeCsv(value: unknown): string {
    let text = String(value ?? '');
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return text.includes(',') || text.includes('"') || text.includes('\n')
      ? `"${text.replace(/"/g, '""')}"`
      : text;
  }

  private formatCsvDate(value: Date | string | null | undefined): string {
    if (!value) return '';
    return new Date(value).toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil' });
  }

  async exportarCsv(filters: ExportarReporteQueryDto): Promise<string> {
    const headers = CSV_HEADERS[filters.tipo];
    if (!headers) throw new BadRequestException('Tipo de reporte no válido');
    const rows: string[][] = [];

    if (filters.tipo === 'no-asistidos') {
      const data = await this.getNoAsistidos(filters.especialidad, filters.fechaInicio, filters.fechaFin);
      for (const item of data) {
        for (const cita of item.citas) {
          rows.push([
            `${item.paciente.nombres} ${item.paciente.apellidos}`,
            item.paciente.numeroIdentificacion,
            item.paciente.telefono,
            item.especialidad,
            String(item.total),
            this.formatCsvDate(cita.fecha),
            cita.hora,
            cita.especialista,
          ]);
        }
      }
    } else if (filters.tipo === 'citas-por-especialista') {
      const data = await this.getCitasPorEspecialista(filters.fechaInicio, filters.fechaFin);
      for (const item of data as any[]) {
        rows.push([
          item.especialista,
          item.especialidad,
          String(item.total),
          String(item.pendientes),
          String(item.confirmadas),
          String(item.atendidas),
          String(item.canceladas),
          String(item.noAsistieron),
        ]);
      }
    } else if (filters.tipo === 'dashboard') {
      const data = await this.getDashboard(filters.fechaInicio);
      const indicators = [
        ['Total Citas', String(data.total)],
        ['Atendidas', String(data.atendidas)],
        ['Pendientes', String(data.pendientes)],
        ['Confirmadas', String(data.confirmadas)],
        ['Canceladas', String(data.canceladas)],
        ['No Asistieron', String(data.noAsistieron)],
        ['Especialistas con Citas', String(data.especialistasConCitas)],
        ['Total Especialistas', String(data.totalEspecialistas)],
        ['Pacientes con Citas', String(data.pacientesConCitas)],
        ['Total Pacientes', String(data.totalPacientes)],
      ];
      rows.push(...indicators);
    } else if (filters.tipo === 'asistencias-por-paciente') {
      const where = this.buildAsistenciasWhere(filters);
      const citas = await this.prisma.cita.findMany({
        where,
        select: this.asistenciaSelect,
        orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }],
      });
      for (const cita of citas) {
        rows.push([
          `${cita.paciente.nombres} ${cita.paciente.apellidos}`,
          cita.paciente.numeroIdentificacion,
          this.formatCsvDate(cita.fecha),
          cita.horaInicio,
          cita.horaFin,
          cita.especialidad,
          `${cita.especialista.nombres} ${cita.especialista.apellidos}`,
          cita.estado,
          cita.lugar,
        ]);
      }
    } else if (filters.tipo === 'registro-hc') {
      const where = this.buildRegistroHcWhere(filters);
      const consultas = await this.prisma.consultaHCE.findMany({
        where,
        select: this.registroHcSelect,
        orderBy: [{ cita: { fecha: 'asc' } }, { createdAt: 'asc' }, { numeroConsulta: 'asc' }],
      });
      for (const consulta of consultas) {
        rows.push([
          this.formatCsvDate(consulta.cita?.fecha ?? consulta.createdAt),
          consulta.cita?.horaInicio ?? '',
          `${consulta.paciente.nombres} ${consulta.paciente.apellidos}`,
          consulta.paciente.numeroIdentificacion,
          consulta.numeroConsulta ? String(consulta.numeroConsulta).padStart(3, '0') : '',
          consulta.especialista.especialidad,
          `${consulta.especialista.nombres} ${consulta.especialista.apellidos}`,
          consulta.firmada ? 'FIRMADA' : 'PENDIENTE',
          consulta.firmada && consulta.archivoPdfUrl ? 'SI' : 'NO',
        ]);
      }
    }

    return `\uFEFF${headers.map((value) => this.escapeCsv(value)).join(',')}\n${rows
      .map((row) => row.map((value) => this.escapeCsv(value)).join(','))
      .join('\n')}`;
  }
}
