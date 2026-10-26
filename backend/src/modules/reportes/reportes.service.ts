import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

const CSV_HEADERS: Record<string, string[]> = {
  'no-asistidos': ['Paciente', 'Identificacion', 'Telefono', 'Especialidad', 'Total Inasistencias', 'Fecha', 'Hora', 'Especialista'],
  'citas-por-especialista': ['Especialista', 'Especialidad', 'Total', 'Pendientes', 'Confirmadas', 'Atendidas', 'Canceladas', 'No Asistieron'],
  dashboard: ['Indicador', 'Valor'],
};

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  async getNoAsistidos(especialidad?: string, fechaInicio?: string, fechaFin?: string) {
    const where: any = { estado: 'NO_ASISTIO' };
    if (especialidad) where.especialidad = { contains: especialidad };
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio);
      if (fechaFin) where.fecha.lte = new Date(fechaFin);
    }

    const citas = await this.prisma.cita.findMany({
      where,
      include: {
        paciente: { select: { nombres: true, apellidos: true, numeroIdentificacion: true, telefono: true } },
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

    return Object.values(agrupado).sort((a, b) => b.total - a.total);
  }

  async getCitasPorEspecialista(fechaInicio?: string, fechaFin?: string) {
    const where: any = {};
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio);
      if (fechaFin) where.fecha.lte = new Date(fechaFin);
    }

    const citas = await this.prisma.cita.findMany({
      where,
      include: {
        especialista: { select: { id: true, nombres: true, apellidos: true, especialidad: true } },
      },
    });

    const agrupado: Record<string, any> = {};
    for (const cita of citas) {
      const key = cita.especialistaId;
      if (!agrupado[key]) {
        agrupado[key] = {
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
      agrupado[key][cita.estado.toLowerCase()]++;
    }

    return Object.values(agrupado);
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

    const especialistasConCitas = new Set(citas.map(c => c.especialistaId)).size;
    const pacientesConCitas = new Set(
      citas.filter(c => c.estado !== 'CANCELADA').map(c => c.pacienteId),
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
      anteriores = citas.filter(c => c.horaInicio < horaActual);
      enCurso = citas.filter(c => c.estado === 'EN_ATENCION');
      proximas = citas.filter(c => c.horaInicio >= horaActual && c.estado !== 'EN_ATENCION');
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

  async exportarCsv(tipo: string, especialidad?: string, fechaInicio?: string, fechaFin?: string): Promise<string> {
    const headers = CSV_HEADERS[tipo];
    if (!headers) return '';

    const escape = (v: any) => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };

    let rows: string[][] = [];

    if (tipo === 'no-asistidos') {
      const data = await this.getNoAsistidos(especialidad, fechaInicio, fechaFin) as any[];
      for (const item of data) {
        for (const cita of item.citas) {
          rows.push([
            escape(`${item.paciente.nombres} ${item.paciente.apellidos}`),
            escape(item.paciente.numeroIdentificacion),
            escape(item.paciente.telefono),
            escape(item.especialidad),
            String(item.total),
            cita.fecha ? new Date(cita.fecha).toLocaleDateString('es-CL') : '',
            escape(cita.hora),
            escape(cita.especialista),
          ]);
        }
      }
    } else if (tipo === 'citas-por-especialista') {
      const data = await this.getCitasPorEspecialista(fechaInicio, fechaFin) as any[];
      for (const item of data) {
        rows.push([
          escape(item.especialista),
          escape(item.especialidad),
          String(item.total),
          String(item.pendientes),
          String(item.confirmadas),
          String(item.atendidas),
          String(item.canceladas),
          String(item.noAsistieron),
        ]);
      }
    } else if (tipo === 'dashboard') {
      const data = await this.getDashboard(fechaInicio) as any;
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
      for (const [k, v] of indicators) {
        rows.push([escape(k), escape(v)]);
      }
    }

    return headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
  }
}
