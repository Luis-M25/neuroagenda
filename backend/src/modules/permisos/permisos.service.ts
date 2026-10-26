import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

const ROL_ADMIN = 'ADMIN';

@Injectable()
export class PermisosService {
  constructor(private prisma: PrismaService) {}

  async permisosEfectivos(usuarioId: string): Promise<string[]> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        roles: { include: { rol: { include: { permisos: true } } } },
        permisosOverride: true,
      },
    });

    if (!usuario) return [];

    const esAdmin = usuario.roles.some((ur) => ur.rol.clave === ROL_ADMIN) || usuario.rol === 'ADMISION_PRINCIPAL';
    if (esAdmin) {
      const todos = await this.prisma.permiso.findMany({ select: { clave: true } });
      return todos.map((p) => p.clave);
    }

    const desdeRoles = new Set<string>();
    for (const ur of usuario.roles) {
      for (const rp of ur.rol.permisos) {
        desdeRoles.add(rp.permisoId);
      }
    }

    const desdeOverrides = new Set<string>();
    const quitados = new Set<string>();
    for (const up of usuario.permisosOverride) {
      if (up.granted) desdeOverrides.add(up.permisoId);
      else quitados.add(up.permisoId);
    }

    const union = new Set<string>([...desdeRoles, ...desdeOverrides]);
    quitados.forEach((id) => union.delete(id));

    const permisos = await this.prisma.permiso.findMany({
      where: { id: { in: Array.from(union) } },
      select: { clave: true },
    });
    return permisos.map((p) => p.clave);
  }

  async rolesEfectivos(usuarioId: string): Promise<string[]> {
    const roles = await this.prisma.usuarioRol.findMany({
      where: { usuarioId },
      include: { rol: true },
    });
    return roles.map((r) => r.rol.clave);
  }

  async listarRoles(): Promise<any[]> {
    return this.prisma.rol.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      include: {
        permisos: { include: { permiso: { select: { id: true, clave: true, nombre: true } } } },
      },
    });
  }

  async obtenerPermisosPorRol(rolId: string): Promise<any> {
    const rol = await this.prisma.rol.findUnique({
      where: { id: rolId },
      include: {
        permisos: { include: { permiso: true } },
      },
    });
    if (!rol) throw new NotFoundException('Rol no encontrado');
    return {
      id: rol.id,
      clave: rol.clave,
      nombre: rol.nombre,
      permisos: rol.permisos.map((rp) => ({
        id: rp.permiso.id,
        clave: rp.permiso.clave,
        nombre: rp.permiso.nombre,
      })),
    };
  }

  async actualizarPermisosRol(rolId: string, permisoIds: string[]): Promise<any> {
    const rol = await this.prisma.rol.findUnique({ where: { id: rolId } });
    if (!rol) throw new NotFoundException('Rol no encontrado');

    await this.prisma.rolPermiso.deleteMany({ where: { rolId } });

    if (permisoIds.length > 0) {
      await this.prisma.rolPermiso.createMany({
        data: permisoIds.map((permisoId) => ({ rolId, permisoId })),
      });
    }

    return this.obtenerPermisosPorRol(rolId);
  }
}
