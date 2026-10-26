import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { NotificacionesService, TIPO_NOTIFICACION } from '../notificaciones/notificaciones.service';
import { CreateSignosVitalesDto, CreateAlergiaDto, CreateAntecedenteDto } from './dto/signos-vitales.dto';

@Injectable()
export class EnfermeroService {
  constructor(
    private prisma: PrismaService,
    private auditoriaService: AuditoriaService,
    private notificacionesService: NotificacionesService,
  ) {}

  async getCitasHoy() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const citas = await this.prisma.cita.findMany({
      where: {
        fecha: { gte: hoy, lt: manana },
        estado: { in: ['PENDIENTE', 'CONFIRMADA', 'EN_ESPERA'] },
      },
      include: {
        paciente: {
          select: {
            id: true, nombres: true, apellidos: true,
            tipoIdentificacion: true, numeroIdentificacion: true,
            genero: true, telefono: true,
            grupoSanguineo: true, tipoSeguro: true,
            alergias: true, enfermedadesPreexistentes: true,
          },
        },
        especialista: {
          select: {
            id: true, nombres: true, apellidos: true,
            especialidad: true, consultorioPredeterminado: true,
          },
        },
        consultaHCE: {
          select: {
            id: true,
            _count: { select: { signosVitales: true } },
          },
        },
      },
      orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }],
    });

    return citas.map((c) => ({
      ...c,
      triajeCompletado: (c.consultaHCE?._count?.signosVitales ?? 0) > 0,
    }));
  }

  async getDatosTriaje(pacienteId: string) {
    const paciente = await this.prisma.paciente.findUnique({
      where: { id: pacienteId },
      include: {
        signosVitales: { orderBy: { fecha: 'desc' }, take: 5 },
        historialAlergias: { where: { activa: true } },
        antecedentes: { orderBy: { createdAt: 'desc' }, take: 10 },
        problemasActivos: { where: { estado: 'ACTIVO' } },
      },
    });

    if (!paciente) throw new NotFoundException('Paciente no encontrado');

    const { historialAlergias, ...rest } = paciente;
    return { ...rest, alergias: historialAlergias };
  }

  async guardarSignosVitales(citaId: string, dto: CreateSignosVitalesDto, userId: string) {
    const cita = await this.prisma.cita.findUnique({
      where: { id: citaId },
      include: { consultaHCE: true },
    });
    if (!cita) throw new NotFoundException('Cita no encontrada');

    let consulta = cita.consultaHCE;
    if (!consulta) {
      consulta = await this.prisma.consultaHCE.create({
        data: {
          pacienteId: cita.pacienteId,
          citaId: cita.id,
          especialistaId: cita.especialistaId,
        },
      });
    }

    if (dto.peso && dto.talla) {
      const alturaMetros = dto.talla / 100;
      dto.imc = Math.round((dto.peso / (alturaMetros * alturaMetros)) * 10) / 10;
    }

    const signo = await this.prisma.signoVital.create({
      data: {
        pacienteId: cita.pacienteId,
        consultaId: consulta.id,
        presionArterial: dto.presionArterial,
        frecuenciaCardiaca: dto.frecuenciaCardiaca,
        temperatura: dto.temperatura,
        saturacionOxigeno: dto.saturacionOxigeno,
        peso: dto.peso,
        talla: dto.talla,
        imc: dto.imc,
        dolorEVA: dto.dolorEVA,
        observaciones: dto.observaciones,
      },
    });

    await this.auditoriaService.registrar({
      usuarioId: userId,
      accion: 'REGISTRAR_SIGNOS_VITALES',
      entidad: 'SignoVital',
      entidadId: signo.id,
      detalle: { citaId, pacienteId: cita.pacienteId },
    });

    return signo;
  }

  async guardarAlergias(citaId: string, dto: CreateAlergiaDto, userId: string) {
    const cita = await this.prisma.cita.findUnique({
      where: { id: citaId },
    });
    if (!cita) throw new NotFoundException('Cita no encontrada');

    const alergia = await this.prisma.alergia.create({
      data: {
        pacienteId: cita.pacienteId,
        tipo: dto.tipo,
        descripcion: dto.descripcion,
        gravedad: dto.gravedad || 'LEVE',
        activa: true,
      },
    });

    await this.auditoriaService.registrar({
      usuarioId: userId,
      accion: 'REGISTRAR_ALERGIA',
      entidad: 'Alergia',
      entidadId: alergia.id,
      detalle: { citaId, pacienteId: cita.pacienteId },
    });

    return alergia;
  }

  async guardarAntecedentes(citaId: string, dto: CreateAntecedenteDto, userId: string) {
    const cita = await this.prisma.cita.findUnique({
      where: { id: citaId },
    });
    if (!cita) throw new NotFoundException('Cita no encontrada');

    const antecedente = await this.prisma.antecedente.create({
      data: {
        pacienteId: cita.pacienteId,
        tipo: dto.tipo,
        descripcion: dto.descripcion,
        categoria: dto.categoria,
        fechaDiagnostico: dto.fechaDiagnostico ? new Date(dto.fechaDiagnostico) : null,
      },
    });

    await this.auditoriaService.registrar({
      usuarioId: userId,
      accion: 'REGISTRAR_ANTECEDENTE',
      entidad: 'Antecedente',
      entidadId: antecedente.id,
      detalle: { citaId, pacienteId: cita.pacienteId },
    });

    return antecedente;
  }

  async getHceParcial(citaId: string) {
    const cita = await this.prisma.cita.findUnique({
      where: { id: citaId },
      select: {
        id: true, pacienteId: true, especialistaId: true,
        consultaHCE: {
          select: {
            id: true,
            signosVitales: { orderBy: { fecha: 'desc' } },
          },
        },
      },
    });

    if (!cita) throw new NotFoundException('Cita no encontrada');

    const [alergias, antecedentes, problemasActivos] = await Promise.all([
      this.prisma.alergia.findMany({
        where: { pacienteId: cita.pacienteId, activa: true },
      }),
      this.prisma.antecedente.findMany({
        where: { pacienteId: cita.pacienteId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.problemaActivo.findMany({
        where: { pacienteId: cita.pacienteId, estado: 'ACTIVO' },
      }),
    ]);

    return {
      consultaId: cita.consultaHCE?.id,
      signosVitales: cita.consultaHCE?.signosVitales || [],
      alergias,
      antecedentes,
      problemasActivos,
    };
  }

  /**
   * Finaliza el triaje de una cita:
   * - Si la cita no está EN_ESPERA, la pasa a EN_ESPERA (el portero pudo no haberlo hecho).
   * - Notifica al especialista de que el paciente está listo.
   */
  async finalizarTriaje(citaId: string, userId: string) {
    const cita = await this.prisma.cita.findUnique({
      where: { id: citaId },
      include: {
        paciente: { select: { id: true, nombres: true, apellidos: true } },
        especialista: { include: { usuario: { select: { id: true } } } },
        consultaHCE: { select: { id: true, _count: { select: { signosVitales: true } } } },
      },
    });
    if (!cita) throw new NotFoundException('Cita no encontrada');

    if (cita.estado === 'CANCELADA' || cita.estado === 'NO_ASISTIO') {
      throw new BadRequestException(`No se puede finalizar triaje de una cita ${cita.estado}`);
    }

    if (cita.estado !== 'EN_ESPERA') {
      await this.prisma.cita.update({
        where: { id: citaId },
        data: { estado: 'EN_ESPERA' },
      });
    }

    await this.auditoriaService.registrar({
      usuarioId: userId,
      accion: 'FINALIZAR_TRIAJE',
      entidad: 'Cita',
      entidadId: citaId,
      detalle: {
        pacienteId: cita.pacienteId,
        estadoAnterior: cita.estado,
        signosRegistrados: cita.consultaHCE?._count?.signosVitales ?? 0,
      },
    });

    // Notificar al especialista
    const especialistaUsuarioId = cita.especialista?.usuario?.id;
    if (especialistaUsuarioId) {
      const pacienteNombre = `${cita.paciente.nombres} ${cita.paciente.apellidos}`;
      
      // Obtener las últimas observaciones de signos vitales para incluirlas
      const signos = (cita.consultaHCE as any)?.signosVitales?.[0];
      const obs = signos?.observaciones ? ` Obs: ${signos.observaciones}` : '';

      await this.notificacionesService.crear({
        usuarioId: especialistaUsuarioId,
        tipo: TIPO_NOTIFICACION.TRIAGE_COMPLETADO,
        titulo: 'Paciente listo en triaje',
        mensaje: `${pacienteNombre} completó el triaje para su cita de ${cita.horaInicio}.${obs}`,
        refId: cita.pacienteId,
        refTipo: 'paciente',
      });
    }

    return { ok: true, estado: 'EN_ESPERA' };
  }
}
