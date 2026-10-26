import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreatePacienteDto, UpdatePacienteDto } from './dto/create-paciente.dto';
import { validateCedulaEcuador } from '../../common/utils/cedula-ec.utils';

const ALERGIA_CAT = 'ALERGIA';
const ENFPREV_CAT = 'ENFERMEDAD_PREVIA';

function joinList(arr?: string[]): string | null | undefined {
  if (arr === undefined) return undefined;
  if (arr.length === 0) return null;
  return arr.join(', ');
}

function splitList(text?: string | null): string[] {
  if (!text) return [];
  return text
    .split(/,|;/)
    .map((s) => s.trim())
    .filter(Boolean);
}

@Injectable()
export class PacientesService {
  constructor(
    private prisma: PrismaService,
    private auditoriaService: AuditoriaService,
  ) {}

  private async ifIdentificacionEsCedula(num: string) {
    if (!num) return;
    const v = validateCedulaEcuador(num);
    if (!v.valid) throw new BadRequestException(v.message ?? 'Cedula invalida');
  }

  private async syncAntecedentes(
    tx: any,
    pacienteId: string,
    alergias: string[] | undefined,
    enfermedades: string[] | undefined,
  ) {
    // No se eliminan registros clínicos previos: los que dejan de estar vigentes
    // se desactivan y los nuevos se agregan como filas independientes.
    if (alergias !== undefined) {
      const existentes = await tx.antecedente.findMany({
        where: { pacienteId, categoria: ALERGIA_CAT, activo: true },
      });
      const normalizar = (s: string) => s.trim().toLowerCase();
      for (const descripcion of alergias) {
        if (!existentes.some((e: any) => normalizar(e.descripcion) === normalizar(descripcion))) {
          await tx.antecedente.create({
            data: {
              pacienteId,
              tipo: 'ALERGIA',
              descripcion,
              categoria: ALERGIA_CAT,
              ambito: 'PERSONAL',
              activo: true,
            },
          });
        }
      }
      for (const anterior of existentes) {
        if (!alergias.some((a) => normalizar(a) === normalizar(anterior.descripcion))) {
          await tx.antecedente.update({ where: { id: anterior.id }, data: { activo: false } });
        }
      }
    }
    if (enfermedades !== undefined) {
      const existentes = await tx.antecedente.findMany({
        where: { pacienteId, categoria: ENFPREV_CAT, activo: true },
      });
      const normalizar = (s: string) => s.trim().toLowerCase();
      for (const descripcion of enfermedades) {
        if (!existentes.some((e: any) => normalizar(e.descripcion) === normalizar(descripcion))) {
          await tx.antecedente.create({
            data: {
              pacienteId,
              tipo: 'ENFERMEDAD',
              descripcion,
              categoria: ENFPREV_CAT,
              ambito: 'PERSONAL',
              activo: true,
            },
          });
        }
      }
      for (const anterior of existentes) {
        if (!enfermedades.some((e) => normalizar(e) === normalizar(anterior.descripcion))) {
          await tx.antecedente.update({ where: { id: anterior.id }, data: { activo: false } });
        }
      }
    }
  }

  async create(dto: CreatePacienteDto, creadoPorId: string) {
    if (dto.tipoIdentificacion === 'CEDULA') {
      await this.ifIdentificacionEsCedula(dto.numeroIdentificacion);
    }

    const existing = await this.prisma.paciente.findUnique({
      where: { numeroIdentificacion: dto.numeroIdentificacion },
    });
    if (existing) throw new ConflictException('Paciente ya registrado con esa identificacion');

    const nacimiento = new Date(dto.fechaNacimiento);
    if (isNaN(nacimiento.getTime()) || nacimiento >= new Date()) {
      throw new BadRequestException('La fecha de nacimiento debe ser una fecha pasada');
    }

    const alergiasCsv = joinList(dto.alergias) ?? '';
    const enfPrevCsv = joinList(dto.enfermedadesPreexistentes) ?? '';

    const paciente = await this.prisma.$transaction(async (tx) => {
      const p = await tx.paciente.create({
        data: {
          nombres: dto.nombres,
          apellidos: dto.apellidos,
          primerNombre: dto.primerNombre,
          segundoNombre: dto.segundoNombre,
          primerApellido: dto.primerApellido,
          segundoApellido: dto.segundoApellido,
          tipoIdentificacion: dto.tipoIdentificacion,
          numeroIdentificacion: dto.numeroIdentificacion,
          genero: dto.genero,
          fechaNacimiento: new Date(dto.fechaNacimiento),
          estadoCivil: dto.estadoCivil,
          telefono: dto.telefono,
          telefonoSecundario: dto.telefonoSecundario,
          direccion: dto.direccion,
          provincia: dto.provincia,
          canton: dto.canton,
          parroquia: dto.parroquia,
          zona: dto.zona,
          grupoSanguineo: dto.grupoSanguineo,
          tipoSeguro: dto.tipoSeguro,
          nombreConvenio: dto.nombreConvenio,
          alergias: alergiasCsv,
          enfermedadesPreexistentes: enfPrevCsv,
          emergenciaNombre: dto.emergenciaNombre,
          emergenciaTelefono: dto.emergenciaTelefono,
          emergenciaParentesco: dto.emergenciaParentesco,
          laboralEmpresa: dto.laboralEmpresa,
          laboralCargo: dto.laboralCargo,
          laboralDireccion: dto.laboralDireccion,
          laboralTelefono: dto.laboralTelefono,
        },
      });
      await this.syncAntecedentes(tx, p.id, dto.alergias ?? [], dto.enfermedadesPreexistentes ?? []);
      return p;
    });

    await this.auditoriaService.registrar({
      usuarioId: creadoPorId,
      accion: 'CREAR_PACIENTE',
      entidad: 'Paciente',
      entidadId: paciente.id,
      detalle: {
        nombres: dto.nombres,
        apellidos: dto.apellidos,
        identificacion: dto.numeroIdentificacion,
      },
    });

    return this.findOne(paciente.id);
  }

  async findAll(filters?: { nombre?: string; identificacion?: string; bloqueado?: boolean }) {
    const where: any = {};

    if (filters?.nombre) {
      where.OR = [
        { nombres: { contains: filters.nombre } },
        { apellidos: { contains: filters.nombre } },
      ];
    }
    if (filters?.identificacion) {
      where.numeroIdentificacion = { contains: filters.identificacion };
    }
    if (filters?.bloqueado !== undefined) {
      where.bloqueado = filters.bloqueado;
    }

    return this.prisma.paciente.findMany({
      where,
      orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
    });
  }

  async findOne(id: string) {
    const paciente = await this.prisma.paciente.findUnique({
      where: { id },
      include: {
        inasistencias: true,
        antecedentes: true,
        citas: {
          orderBy: [{ fecha: 'desc' }, { horaInicio: 'desc' }],
          take: 20,
          include: {
            especialista: { select: { nombres: true, apellidos: true, especialidad: true } },
          },
        },
      },
    });
    if (!paciente) throw new NotFoundException('Paciente no encontrado');
    return paciente;
  }

  async findByIdentificacion(numero: string) {
    return this.prisma.paciente.findUnique({
      where: { numeroIdentificacion: numero },
      include: { inasistencias: true, antecedentes: true },
    });
  }

  async update(id: string, dto: UpdatePacienteDto, actualizadoPorId: string) {
    await this.findOne(id);

    if (
      dto.tipoIdentificacion === 'CEDULA' &&
      dto.numeroIdentificacion
    ) {
      await this.ifIdentificacionEsCedula(dto.numeroIdentificacion);
    }

    const data: any = {};
    if (dto.primerNombre !== undefined) data.primerNombre = dto.primerNombre;
    if (dto.segundoNombre !== undefined) data.segundoNombre = dto.segundoNombre;
    if (dto.primerApellido !== undefined) data.primerApellido = dto.primerApellido;
    if (dto.segundoApellido !== undefined) data.segundoApellido = dto.segundoApellido;
    if (dto.nombres !== undefined) data.nombres = dto.nombres;
    if (dto.apellidos !== undefined) data.apellidos = dto.apellidos;
    if (dto.tipoIdentificacion !== undefined) data.tipoIdentificacion = dto.tipoIdentificacion;
    if (dto.numeroIdentificacion !== undefined) data.numeroIdentificacion = dto.numeroIdentificacion;
    if (dto.genero !== undefined) data.genero = dto.genero;
    if (dto.fechaNacimiento) data.fechaNacimiento = new Date(dto.fechaNacimiento);
    if (dto.estadoCivil !== undefined) data.estadoCivil = dto.estadoCivil;
    if (dto.telefono !== undefined) data.telefono = dto.telefono;
    if (dto.telefonoSecundario !== undefined) data.telefonoSecundario = dto.telefonoSecundario;
    if (dto.direccion !== undefined) data.direccion = dto.direccion;
    if (dto.provincia !== undefined) data.provincia = dto.provincia;
    if (dto.canton !== undefined) data.canton = dto.canton;
    if (dto.parroquia !== undefined) data.parroquia = dto.parroquia;
    if (dto.zona !== undefined) data.zona = dto.zona;
    if (dto.grupoSanguineo !== undefined) data.grupoSanguineo = dto.grupoSanguineo;
    if (dto.tipoSeguro !== undefined) data.tipoSeguro = dto.tipoSeguro;
    if (dto.nombreConvenio !== undefined) data.nombreConvenio = dto.nombreConvenio;

    if (dto.alergias !== undefined) {
      data.alergias = joinList(dto.alergias) ?? null;
    }
    if (dto.enfermedadesPreexistentes !== undefined) {
      data.enfermedadesPreexistentes = joinList(dto.enfermedadesPreexistentes) ?? null;
    }

    if (dto.emergenciaNombre !== undefined) data.emergenciaNombre = dto.emergenciaNombre;
    if (dto.emergenciaTelefono !== undefined) data.emergenciaTelefono = dto.emergenciaTelefono;
    if (dto.emergenciaParentesco !== undefined) data.emergenciaParentesco = dto.emergenciaParentesco;
    if (dto.laboralEmpresa !== undefined) data.laboralEmpresa = dto.laboralEmpresa;
    if (dto.laboralCargo !== undefined) data.laboralCargo = dto.laboralCargo;
    if (dto.laboralDireccion !== undefined) data.laboralDireccion = dto.laboralDireccion;
    if (dto.laboralTelefono !== undefined) data.laboralTelefono = dto.laboralTelefono;

    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.paciente.update({ where: { id }, data });
      }
      await this.syncAntecedentes(tx, id, dto.alergias, dto.enfermedadesPreexistentes);
    });

    await this.auditoriaService.registrar({
      usuarioId: actualizadoPorId,
      accion: 'ACTUALIZAR_PACIENTE',
      entidad: 'Paciente',
      entidadId: id,
      detalle: { camposCambiados: Object.keys(data) },
    });

    return this.findOne(id);
  }

  async bloquear(id: string, motivo: string, bloqueadoPorId: string, especialidad?: string) {
    const paciente = await this.findOne(id);
    if (!paciente) throw new NotFoundException();

    const updateData: any = {
      bloqueado: true,
      motivoBloqueo: motivo,
      bloqueadoPorId,
      fechaBloqueo: new Date(),
    };

    if (especialidad) {
      const bloqueadas = paciente.especialidadesBloqueadas
        ? JSON.parse(paciente.especialidadesBloqueadas)
        : [];
      if (!bloqueadas.includes(especialidad)) {
        bloqueadas.push(especialidad);
      }
      updateData.especialidadesBloqueadas = JSON.stringify(bloqueadas);
    }

    const pacienteBloqueado = await this.prisma.paciente.update({
      where: { id },
      data: updateData,
    });

    await this.auditoriaService.registrar({
      usuarioId: bloqueadoPorId,
      accion: 'BLOQUEAR_PACIENTE',
      entidad: 'Paciente',
      entidadId: id,
      detalle: { motivo, especialidad },
    });

    return pacienteBloqueado;
  }

  async desbloquear(id: string, especialidad: string | undefined, desbloqueadoPorId: string) {
    const paciente = await this.findOne(id);

    if (especialidad && paciente.especialidadesBloqueadas) {
      let bloqueadas = JSON.parse(paciente.especialidadesBloqueadas);
      bloqueadas = bloqueadas.filter((e: string) => e !== especialidad);
      const updateData: any = {
        especialidadesBloqueadas: JSON.stringify(bloqueadas),
      };
      if (bloqueadas.length === 0) {
        updateData.bloqueado = false;
        updateData.fechaDesbloqueo = new Date();
      }
      const result = await this.prisma.paciente.update({ where: { id }, data: updateData });
      await this.auditoriaService.registrar({
        usuarioId: desbloqueadoPorId,
        accion: 'DESBLOQUEAR_PACIENTE',
        entidad: 'Paciente',
        entidadId: id,
        detalle: { especialidad },
      });
      return result;
    }

    const pacienteDesbloqueado = await this.prisma.paciente.update({
      where: { id },
      data: {
        bloqueado: false,
        motivoBloqueo: null,
        fechaDesbloqueo: new Date(),
        especialidadesBloqueadas: null,
      },
    });

    await this.auditoriaService.registrar({
      usuarioId: desbloqueadoPorId,
      accion: 'DESBLOQUEAR_PACIENTE',
      entidad: 'Paciente',
      entidadId: id,
      detalle: { especialidad },
    });

    return pacienteDesbloqueado;
  }

  async getInasistencias(id: string) {
    await this.findOne(id);
    return this.prisma.inasistenciaPorEspecialidad.findMany({
      where: { pacienteId: id },
      include: {
        paciente: {
          select: { nombres: true, apellidos: true, numeroIdentificacion: true },
        },
      },
      orderBy: { contador: 'desc' },
    });
  }

  async getReporteInasistencias() {
    return this.prisma.inasistenciaPorEspecialidad.findMany({
      include: {
        paciente: {
          select: { id: true, nombres: true, apellidos: true, numeroIdentificacion: true, bloqueado: true },
        },
      },
      orderBy: [{ contador: 'desc' }, { ultimaInasistencia: 'desc' }],
    });
  }

  async getHistorialClinico(id: string) {
    await this.findOne(id);
    const citas = await this.prisma.cita.findMany({
      where: { pacienteId: id, estado: 'ATENDIDA' },
      include: {
        especialista: {
          select: { nombres: true, apellidos: true, especialidad: true, codigoMsp: true },
        },
      },
      orderBy: [{ fecha: 'desc' }, { horaInicio: 'desc' }],
    });

    const agrupado: Record<string, any> = {};
    for (const cita of citas) {
      const esp = cita.especialidad;
      if (!agrupado[esp]) {
        agrupado[esp] = { especialidad: esp, citas: [] };
      }
      agrupado[esp].citas.push({
        id: cita.id,
        fecha: cita.fecha,
        horaInicio: cita.horaInicio,
        especialista: `${cita.especialista.nombres} ${cita.especialista.apellidos}`,
        motivo: cita.motivo,
        notaAdmin: cita.notaAdmin,
        notaEspecialista: cita.notaEspecialista,
      });
    }

    return Object.values(agrupado);
  }

  async cancelarProtocolo(pacienteId: string, especialidad: string, motivo: string, userId: string) {
    const inasistencia = await this.prisma.inasistenciaPorEspecialidad.findUnique({
      where: { pacienteId_especialidad: { pacienteId, especialidad } },
    });
    if (!inasistencia) {
      throw new NotFoundException(`No se encontró un registro de inasistencias para el paciente ${pacienteId} en la especialidad ${especialidad}`);
    }

    const hoy = new Date();
    const citasActualizadas = await this.prisma.cita.updateMany({
      where: {
        pacienteId,
        especialidad,
        estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
        fecha: { gte: hoy },
      },
      data: { estado: 'CANCELADA' },
    });

    await this.prisma.inasistenciaPorEspecialidad.update({
      where: { id: inasistencia.id },
      data: {
        contador: 0,
        ultimaNotificacionSeveridad: 'PROTOCOLO_CANCELADO',
      },
    });

    await this.auditoriaService.registrar({
      usuarioId: userId,
      accion: 'CANCELAR_PROTOCOLO',
      entidad: 'Paciente',
      entidadId: pacienteId,
      motivo,
    });

    return {
      ok: true,
      especialidad,
      citasCanceladas: citasActualizadas.count,
      message: `Protocolo cancelado: se cancelaron ${citasActualizadas.count} citas futuras del paciente en la especialidad ${especialidad}.`,
    };
  }
}
