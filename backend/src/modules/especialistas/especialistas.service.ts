import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateEspecialistaDto, UpdateEspecialistaDto } from './dto/create-especialista.dto';
import { UpdateEspecialistaEstadoDto } from './dto/update-especialista-estado.dto';
import { validateCedulaEcuador } from '../../common/utils/cedula-ec.utils';
import { parseEcDate } from '../../common/utils/date-ec.utils';

@Injectable()
export class EspecialistasService {
  constructor(
    private prisma: PrismaService,
    private auditoriaService: AuditoriaService,
  ) {}

  private async assertCatalogoActivo(opts: {
    sede?: string;
    especialidad?: string;
    consultorio?: string | null;
  }) {
    if (opts.sede) {
      const sede = await this.prisma.sede.findFirst({ where: { nombre: opts.sede, activo: true } });
      if (!sede) throw new BadRequestException('La sede seleccionada no existe o esta inactiva');
    }
    if (opts.especialidad) {
      const esp = await this.prisma.especialidad.findFirst({
        where: { nombre: opts.especialidad, activo: true },
      });
      if (!esp) throw new BadRequestException('La especialidad seleccionada no existe o esta inactiva');
    }
    if (opts.sede && opts.consultorio) {
      const cons = await this.prisma.consultorio.findFirst({
        where: { nombre: opts.consultorio, sede: opts.sede, activo: true },
      });
      if (!cons) {
        throw new BadRequestException(
          'El consultorio no pertenece a la sede seleccionada o no esta activo',
        );
      }
    }
  }

  async create(dto: CreateEspecialistaDto, creadoPorId: string) {
    if (dto.tipoIdentificacion === 'CEDULA') {
      const v = validateCedulaEcuador(dto.numeroIdentificacion);
      if (!v.valid) throw new BadRequestException(v.message ?? 'Cedula invalida');
    }

    const existingEmail = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (existingEmail) throw new ConflictException('El email ya esta registrado');

    const existingDoc = await this.prisma.especialista.findUnique({
      where: { numeroIdentificacion: dto.numeroIdentificacion },
    });
    if (existingDoc) throw new ConflictException('El numero de identificacion ya existe');

    if (dto.codigoMsp) {
      const existingMsp = await this.prisma.especialista.findFirst({ where: { codigoMsp: dto.codigoMsp } });
      if (existingMsp) throw new ConflictException('El codigo MSP ya existe');
    }

    const existingEmailInst = await this.prisma.especialista.findUnique({
      where: { emailInstitucional: dto.emailInstitucional },
    });
    if (existingEmailInst) throw new ConflictException('El email institucional ya existe');

    if (dto.emailSecundario) {
      const existingEmailSec = await this.prisma.especialista.findFirst({
        where: { emailSecundario: dto.emailSecundario },
      });
      if (existingEmailSec) throw new ConflictException('El email secundario ya existe');
    }

    if (dto.emailPersonal) {
      const existingEmailPers = await this.prisma.especialista.findFirst({
        where: { emailPersonal: dto.emailPersonal },
      });
      if (existingEmailPers) throw new ConflictException('El email personal ya existe');
    }

    await this.assertCatalogoActivo({
      sede: dto.sede,
      especialidad: dto.especialidad,
      consultorio: dto.consultorioPredeterminado ?? null,
    });

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.usuario.create({
      data: {
        email: dto.email,
        passwordHash,
        rol: 'ESPECIALISTA',
        creadoPorId,
        primerNombre: dto.primerNombre,
        segundoNombre: dto.segundoNombre,
        primerApellido: dto.primerApellido,
        segundoApellido: dto.segundoApellido,
        especialista: {
          create: {
            nombres: dto.nombres,
            apellidos: dto.apellidos,
            primerNombre: dto.primerNombre,
            segundoNombre: dto.segundoNombre,
            primerApellido: dto.primerApellido,
            segundoApellido: dto.segundoApellido,
            tipoIdentificacion: dto.tipoIdentificacion,
            numeroIdentificacion: dto.numeroIdentificacion,
            genero: dto.genero,
            fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : null,
            estadoCivil: dto.estadoCivil,
            fotoUrl: dto.fotoUrl,
            codigoMsp: dto.codigoMsp,
            especialidad: dto.especialidad,
            subEspecialidad: dto.subEspecialidad,
            tituloProfesional: dto.tituloProfesional,
            emailInstitucional: dto.emailInstitucional,
            emailSecundario: dto.emailSecundario,
            emailPersonal: dto.emailPersonal,
            telefono: dto.telefono,
            telefonoSecundario: dto.telefonoSecundario,
            direccion: dto.direccion,
            sede: dto.sede,
            consultorioPredeterminado: dto.consultorioPredeterminado,
            tienePasantes: dto.tienePasantes ?? false,
            colorCalendario: dto.colorCalendario,
            codigoAlfabetico: dto.codigoAlfabetico,
          },
        },
        roles: {
          create: {
            rol: { connect: { clave: 'ESPECIALISTA' } },
          },
        },
      },
      include: { especialista: true },
    });

    await this.auditoriaService.registrar({
      usuarioId: creadoPorId,
      accion: 'CREAR_ESPECIALISTA',
      entidad: 'Especialista',
      entidadId: user.id,
      detalle: { email: dto.email, nombres: dto.nombres, apellidos: dto.apellidos, especialidad: dto.especialidad },
    });

    const { passwordHash: _omit, ...result } = user;
    return result;
  }

  async findAll(filters?: { activo?: boolean; especialidad?: string }) {
    const users = await this.prisma.usuario.findMany({
      where: { rol: 'ESPECIALISTA' },
      include: { especialista: { include: { horarios: true } } },
    });

    const filtered = users.filter((u) => {
      if (!u.especialista) return false;
      if (filters?.especialidad && !u.especialista.especialidad.toLowerCase().includes(filters.especialidad.toLowerCase())) return false;
      if (filters?.activo !== undefined) {
        if (filters.activo && u.especialista.estado !== 'HABILITADO') return false;
        if (!filters.activo && u.especialista.estado === 'HABILITADO') return false;
      }
      return true;
    });

    return filtered.map(({ passwordHash, ...u }) => ({ ...u, especialista: u.especialista }));
  }

  async findOne(id: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
      include: { especialista: { include: { horarios: true } } },
    });
    if (!user || !user.especialista) {
      throw new NotFoundException('Especialista no encontrado');
    }
    const { passwordHash, ...result } = user;
    return result;
  }

  async findByIdentificacion(numero: string) {
    return this.prisma.especialista.findUnique({
      where: { numeroIdentificacion: numero },
      include: { usuario: true, horarios: true },
    });
  }

  async update(id: string, dto: UpdateEspecialistaDto, actualizadoPorId: string) {
    const user = await this.findOne(id);
    if (!user.especialista) throw new NotFoundException();

    if (dto.numeroIdentificacion && dto.numeroIdentificacion !== user.especialista.numeroIdentificacion) {
      const existingDoc = await this.prisma.especialista.findUnique({
        where: { numeroIdentificacion: dto.numeroIdentificacion },
      });
      if (existingDoc) throw new ConflictException('El numero de identificacion ya existe');
    }
    if (dto.codigoMsp && dto.codigoMsp !== user.especialista.codigoMsp) {
      const existingMsp = await this.prisma.especialista.findFirst({ where: { codigoMsp: dto.codigoMsp } });
      if (existingMsp) throw new ConflictException('El codigo MSP ya existe');
    }
    if (dto.emailInstitucional && dto.emailInstitucional !== user.especialista.emailInstitucional) {
      const existingEmailInst = await this.prisma.especialista.findUnique({
        where: { emailInstitucional: dto.emailInstitucional },
      });
      if (existingEmailInst) throw new ConflictException('El email institucional ya existe');
    }
    if (dto.emailSecundario !== undefined && dto.emailSecundario !== user.especialista.emailSecundario) {
      if (dto.emailSecundario) {
        const dup = await this.prisma.especialista.findFirst({ where: { emailSecundario: dto.emailSecundario } });
        if (dup) throw new ConflictException('El email secundario ya existe');
      }
    }
    if (dto.emailPersonal !== undefined && dto.emailPersonal !== user.especialista.emailPersonal) {
      if (dto.emailPersonal) {
        const dup = await this.prisma.especialista.findFirst({ where: { emailPersonal: dto.emailPersonal } });
        if (dup) throw new ConflictException('El email personal ya existe');
      }
    }
    if (dto.email && dto.email !== user.email) {
      const existingEmail = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
      if (existingEmail) throw new ConflictException('El email ya esta registrado');
    }

    const sedeChanged = dto.sede && dto.sede !== user.especialista.sede;
    const consChanged = dto.consultorioPredeterminado !== undefined && dto.consultorioPredeterminado !== user.especialista.consultorioPredeterminado;
    const espChanged = dto.especialidad && dto.especialidad !== user.especialista.especialidad;
    if (sedeChanged || consChanged || espChanged) {
      await this.assertCatalogoActivo({
        sede: dto.sede ?? user.especialista.sede,
        especialidad: dto.especialidad ?? user.especialista.especialidad,
        consultorio: (dto.consultorioPredeterminado ?? user.especialista.consultorioPredeterminado) ?? null,
      });
    }

    const espUpdate: any = {};
    const setIf = (k: string, v: any) => { if (v !== undefined) espUpdate[k] = v; };
    setIf('primerNombre', dto.primerNombre);
    setIf('segundoNombre', dto.segundoNombre);
    setIf('primerApellido', dto.primerApellido);
    setIf('segundoApellido', dto.segundoApellido);
    setIf('nombres', dto.nombres);
    setIf('apellidos', dto.apellidos);
    setIf('tipoIdentificacion', dto.tipoIdentificacion);
    setIf('numeroIdentificacion', dto.numeroIdentificacion);
    setIf('genero', dto.genero);
    if (dto.fechaNacimiento) espUpdate.fechaNacimiento = new Date(dto.fechaNacimiento);
    setIf('estadoCivil', dto.estadoCivil);
    setIf('fotoUrl', dto.fotoUrl);
    setIf('codigoMsp', dto.codigoMsp);
    setIf('especialidad', dto.especialidad);
    setIf('subEspecialidad', dto.subEspecialidad);
    setIf('tituloProfesional', dto.tituloProfesional);
    setIf('emailInstitucional', dto.emailInstitucional);
    setIf('emailSecundario', dto.emailSecundario);
    setIf('emailPersonal', dto.emailPersonal);
    setIf('telefono', dto.telefono);
    setIf('telefonoSecundario', dto.telefonoSecundario);
    setIf('direccion', dto.direccion);
    setIf('sede', dto.sede);
    setIf('consultorioPredeterminado', dto.consultorioPredeterminado);
    setIf('tienePasantes', dto.tienePasantes);
    setIf('colorCalendario', dto.colorCalendario);
    setIf('codigoAlfabetico', dto.codigoAlfabetico);

    if (Object.keys(espUpdate).length > 0) {
      await this.prisma.especialista.update({ where: { usuarioId: id }, data: espUpdate });
    }

    if (dto.email || dto.primerNombre || dto.primerApellido) {
      const userData: any = {};
      if (dto.email) userData.email = dto.email;
      if (dto.primerNombre) userData.primerNombre = dto.primerNombre;
      if (dto.segundoNombre !== undefined) userData.segundoNombre = dto.segundoNombre;
      if (dto.primerApellido) userData.primerApellido = dto.primerApellido;
      if (dto.segundoApellido !== undefined) userData.segundoApellido = dto.segundoApellido;
      await this.prisma.usuario.update({ where: { id }, data: userData });
    }

    await this.auditoriaService.registrar({
      usuarioId: actualizadoPorId,
      accion: 'ACTUALIZAR_ESPECIALISTA',
      entidad: 'Especialista',
      entidadId: id,
      detalle: { camposCambiados: Object.keys(espUpdate) },
    });

    return this.findOne(id);
  }

  async updateEstado(id: string, dto: UpdateEspecialistaEstadoDto, actualizadoPorId: string) {
    const user = await this.findOne(id);

    const data: any = { estado: dto.estado };
    if (dto.estado === 'SUSPENDIDO_TEMPORAL') {
      data.fechaInicioSuspension = dto.fechaInicioSuspension
        ? parseEcDate(dto.fechaInicioSuspension)
        : new Date();
      data.fechaFinSuspension = dto.fechaFinSuspension ? new Date(dto.fechaFinSuspension) : null;
    } else {
      data.fechaInicioSuspension = null;
      data.fechaFinSuspension = null;
    }

    await this.prisma.especialista.update({ where: { usuarioId: id }, data });

    await this.auditoriaService.registrar({
      usuarioId: actualizadoPorId,
      accion: 'CAMBIAR_ESTADO_ESPECIALISTA',
      entidad: 'Especialista',
      entidadId: id,
      detalle: { estadoAnterior: user.especialista?.estado, nuevoEstado: dto.estado },
    });

    return this.findOne(id);
  }

  async getEspecialidades() {
    const result = await this.prisma.especialista.findMany({
      select: { especialidad: true },
      distinct: ['especialidad'],
      where: { estado: 'HABILITADO' },
    });
    return result.map((r) => r.especialidad).sort();
  }

  async createBloqueoGrupal(dto: { nombre: string; descripcion?: string; especialistaIds: string[]; fechaInicio: string; fechaFin?: string; forzar?: boolean }, creadoPorId: string) {
    const desde = new Date(`${dto.fechaInicio}T00:00:00.000Z`);
    const hasta = dto.fechaFin
      ? new Date(`${dto.fechaFin}T23:59:59.999Z`)
      : new Date(`${dto.fechaInicio}T23:59:59.999Z`);

    if (!dto.forzar) {
      const citas = await this.prisma.cita.findMany({
        where: {
          especialistaId: { in: dto.especialistaIds },
          fecha: { gte: desde, lte: hasta },
          estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
        },
        include: {
          paciente: { select: { nombres: true, apellidos: true } },
          especialista: { select: { nombres: true, apellidos: true } },
        },
      });

      if (citas.length > 0) {
        throw new BadRequestException({
          message: `Hay ${citas.length} cita(s) pendiente(s) en el rango de fechas seleccionado`,
          citas,
          codigo: 'CITAS_PENDIENTES',
        });
      }
    }

    const bloqueo = await this.prisma.bloqueoGrupal.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        fechaInicio: desde,
        fechaFin: dto.fechaFin ? new Date(`${dto.fechaFin}T00:00:00.000Z`) : null,
        especialistas: {
          create: dto.especialistaIds.map((id) => ({ especialistaId: id })),
        },
      },
      include: { especialistas: { include: { especialista: true } } },
    });

    await this.auditoriaService.registrar({
      usuarioId: creadoPorId,
      accion: 'CREAR_BLOQUEO_GRUPAL',
      entidad: 'BloqueoGrupal',
      entidadId: bloqueo.id,
      detalle: { nombre: dto.nombre, especialistaIds: dto.especialistaIds },
    });

    return bloqueo;
  }

  async updateBloqueoGrupal(id: string, dto: { nombre: string; descripcion?: string; especialistaIds: string[]; fechaInicio: string; fechaFin?: string }) {
    await this.prisma.bloqueoGrupalEspecialista.deleteMany({ where: { bloqueoGrupalId: id } });
    return this.prisma.bloqueoGrupal.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        fechaInicio: parseEcDate(dto.fechaInicio),
        fechaFin: dto.fechaFin ? parseEcDate(dto.fechaFin) : null,
        especialistas: {
          create: dto.especialistaIds.map((id) => ({ especialistaId: id })),
        },
      },
      include: { especialistas: { include: { especialista: true } } },
    });
  }

  async deleteBloqueoGrupal(id: string) {
    await this.prisma.bloqueoGrupalEspecialista.deleteMany({ where: { bloqueoGrupalId: id } });
    await this.prisma.bloqueoGrupal.delete({ where: { id } });
    return { message: 'Bloqueo eliminado correctamente' };
  }

  async findAllBloqueos() {
    return this.prisma.bloqueoGrupal.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        especialistas: {
          include: { especialista: { select: { id: true, nombres: true, apellidos: true } } },
        },
      },
    });
  }
}
