import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdatePermisosDto } from './dto/update-permisos.dto';

@Injectable()
export class AdminsService {
  constructor(
    private prisma: PrismaService,
    private auditoriaService: AuditoriaService,
  ) {}

  async create(dto: CreateAdminDto, creadoPorId: string, permisosData?: any) {
    const existingEmail = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (existingEmail) {
      throw new ConflictException('El email ya esta registrado');
    }

    const existingDoc = await this.prisma.administracion.findUnique({
      where: { numeroIdentificacion: dto.numeroIdentificacion },
    });
    if (existingDoc) {
      throw new ConflictException('El numero de identificacion ya esta registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.usuario.create({
      data: {
        email: dto.email,
        passwordHash,
        rol: 'ADMISION',
        creadoPorId,
        administracion: {
          create: {
            nombres: dto.nombres,
            apellidos: dto.apellidos,
            tipoIdentificacion: dto.tipoIdentificacion,
            numeroIdentificacion: dto.numeroIdentificacion,
            telefono: dto.telefono,
            direccion: dto.direccion || '',
            fotoUrl: dto.fotoUrl,
            permisos: {
              create: permisosData && Object.keys(permisosData).length > 0 ? permisosData : {},
            },
          },
        },
      },
      include: {
        administracion: { include: { permisos: true } },
      },
    });

    await this.auditoriaService.registrar({
      usuarioId: creadoPorId,
      accion: 'CREAR_ADMIN',
      entidad: 'Administracion',
      entidadId: user.id,
      detalle: { email: dto.email, nombres: dto.nombres, apellidos: dto.apellidos },
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async findAll() {
    const users = await this.prisma.usuario.findMany({
      where: { rol: { in: ['ADMISION_PRINCIPAL', 'ADMISION'] } },
      include: {
        administracion: { include: { permisos: true } },
        creadoPor: { select: { email: true } },
      },
    });

    return users.map(({ passwordHash, ...u }) => u);
  }

  async findAllAuditores() {
    const users = await this.prisma.usuario.findMany({
      where: { rol: 'AUDITOR' },
      include: {
        creadoPor: { select: { email: true } },
      },
    });
    return users.map(({ passwordHash, ...u }) => u);
  }

  async createAuditor(dto: { nombres: string; apellidos: string; email: string; password: string; numeroIdentificacion: string }, creadoPorId: string) {
    const existing = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('El email ya esta registrado');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.usuario.create({
      data: {
        email: dto.email,
        passwordHash,
        rol: 'AUDITOR',
        nombres: dto.nombres,
        apellidos: dto.apellidos,
        numeroIdentificacion: dto.numeroIdentificacion,
        creadoPorId,
      },
    });

    await this.auditoriaService.registrar({
      usuarioId: creadoPorId,
      accion: 'CREAR_AUDITOR',
      entidad: 'Usuario',
      entidadId: user.id,
      detalle: { email: dto.email, nombres: dto.nombres, apellidos: dto.apellidos },
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async removeAuditor(id: string, requesterId: string) {
    const user = await this.prisma.usuario.findUnique({ where: { id } });
    if (!user || user.rol !== 'AUDITOR') throw new NotFoundException('Auditor no encontrado');

    await this.prisma.usuario.delete({ where: { id } });

    await this.auditoriaService.registrar({
      usuarioId: requesterId,
      accion: 'ELIMINAR_AUDITOR',
      entidad: 'Usuario',
      entidadId: id,
      detalle: { email: user.email },
    });

    return { message: 'Auditor eliminado' };
  }

  async findAllPorteros() {
    const users = await this.prisma.usuario.findMany({
      where: { rol: 'PORTERO' },
      include: {
        creadoPor: { select: { email: true } },
      },
    });

    return users.map(({ passwordHash, ...u }) => u);
  }

  async createPortero(dto: { nombres: string; apellidos: string; email: string; password: string; numeroIdentificacion: string }, creadoPorId: string) {
    const existing = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('El email ya esta registrado');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.usuario.create({
      data: {
        email: dto.email,
        passwordHash,
        rol: 'PORTERO',
        nombres: dto.nombres,
        apellidos: dto.apellidos,
        numeroIdentificacion: dto.numeroIdentificacion,
        creadoPorId,
      },
    });

    await this.auditoriaService.registrar({
      usuarioId: creadoPorId,
      accion: 'CREAR_PORTERO',
      entidad: 'Usuario',
      entidadId: user.id,
      detalle: { email: dto.email, nombres: dto.nombres, apellidos: dto.apellidos },
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async removePortero(id: string, requesterId: string) {
    const user = await this.prisma.usuario.findUnique({ where: { id } });
    if (!user || user.rol !== 'PORTERO') throw new NotFoundException('Portero no encontrado');

    await this.prisma.usuario.delete({ where: { id } });

    await this.auditoriaService.registrar({
      usuarioId: requesterId,
      accion: 'ELIMINAR_PORTERO',
      entidad: 'Usuario',
      entidadId: id,
      detalle: { email: user.email },
    });

    return { message: 'Portero eliminado' };
  }

  async findAllEnfermeros() {
    const users = await this.prisma.usuario.findMany({
      where: { rol: 'ENFERMERO' },
      include: {
        creadoPor: { select: { email: true } },
      },
    });
    return users.map(({ passwordHash, ...u }) => u);
  }

  async createEnfermero(dto: { nombres: string; apellidos: string; email: string; password: string; numeroIdentificacion: string }, creadoPorId: string) {
    const existing = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('El email ya esta registrado');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.usuario.create({
      data: {
        email: dto.email,
        passwordHash,
        rol: 'ENFERMERO',
        nombres: dto.nombres,
        apellidos: dto.apellidos,
        numeroIdentificacion: dto.numeroIdentificacion,
        creadoPorId,
      },
    });

    await this.auditoriaService.registrar({
      usuarioId: creadoPorId,
      accion: 'CREAR_ENFERMERO',
      entidad: 'Usuario',
      entidadId: user.id,
      detalle: { email: dto.email, nombres: dto.nombres, apellidos: dto.apellidos },
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async removeEnfermero(id: string, requesterId: string) {
    const user = await this.prisma.usuario.findUnique({ where: { id } });
    if (!user || user.rol !== 'ENFERMERO') throw new NotFoundException('Enfermero no encontrado');

    await this.prisma.usuario.delete({ where: { id } });

    await this.auditoriaService.registrar({
      usuarioId: requesterId,
      accion: 'ELIMINAR_ENFERMERO',
      entidad: 'Usuario',
      entidadId: id,
      detalle: { email: user.email },
    });

    return { message: 'Enfermero eliminado' };
  }

  async findOne(id: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
      include: {
        administracion: { include: { permisos: true } },
      },
    });

    if (!user || !['ADMISION_PRINCIPAL', 'ADMISION'].includes(user.rol)) {
      throw new NotFoundException('Admin no encontrado');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async update(id: string, dto: Partial<CreateAdminDto>) {
    const admin = await this.findOne(id);

    const updateData: any = {};
    if (dto.nombres) updateData.nombres = dto.nombres;
    if (dto.apellidos) updateData.apellidos = dto.apellidos;
    if (dto.telefono) updateData.telefono = dto.telefono;
    if (dto.direccion) updateData.direccion = dto.direccion;
    if (dto.fotoUrl !== undefined) updateData.fotoUrl = dto.fotoUrl;

    if (dto.email) {
      const existing = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
      if (existing && existing.id !== id) {
        throw new ConflictException('El email ya esta en uso');
      }
      await this.prisma.usuario.update({ where: { id }, data: { email: dto.email } });
    }

    if (dto.password) {
      const passwordHash = await bcrypt.hash(dto.password, 10);
      await this.prisma.usuario.update({ where: { id }, data: { passwordHash } });
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.administracion.update({
        where: { usuarioId: id },
        data: updateData,
      });
    }

    return this.findOne(id);
  }

  async updatePermisos(id: string, dto: UpdatePermisosDto, requesterId: string) {
    const requester = await this.prisma.usuario.findUnique({ where: { id: requesterId } });
    if (requester?.rol !== 'ADMISION_PRINCIPAL') {
      throw new ForbiddenException('Solo el administrador principal puede gestionar permisos');
    }

    const admin = await this.findOne(id);
    if (admin.rol === 'ADMISION_PRINCIPAL') {
      throw new ForbiddenException('No puedes modificar los permisos del administrador principal');
    }

    const permisos = await this.prisma.permisosAdmin.findUnique({
      where: { administracionId: admin.administracion!.id },
    });

    if (!permisos) {
      await this.prisma.permisosAdmin.create({
        data: {
          administracionId: admin.administracion!.id,
          ...dto as any,
        },
      });
    } else {
      await this.prisma.permisosAdmin.update({
        where: { administracionId: admin.administracion!.id },
        data: dto as any,
      });
    }

    await this.auditoriaService.registrar({
      usuarioId: id,
      accion: 'ACTUALIZAR_ADMIN',
      entidad: 'Administracion',
      entidadId: id,
    });

    return this.findOne(id);
  }

  async remove(id: string, requesterId: string) {
    const target = await this.findOne(id);

    if (target.rol === 'ADMISION_PRINCIPAL') {
      throw new ForbiddenException('No puedes eliminar al administrador principal');
    }

    await this.prisma.usuario.delete({ where: { id } });

    await this.auditoriaService.registrar({
      usuarioId: requesterId,
      accion: 'ELIMINAR_ADMIN',
      entidad: 'Administracion',
      entidadId: id,
      detalle: { targetEmail: target.email },
    });

    return { message: 'Admin eliminado exitosamente' };
  }
}
