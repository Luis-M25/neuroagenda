import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

interface AuthUser {
  sub: string;
  email: string;
  rol?: string;
  roles?: string[];
  permisos?: string[];
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPermisos = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length && !requiredPermisos?.length) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user: AuthUser = req.user;
    if (!user) {
      throw new ForbiddenException('No autenticado');
    }

    // ADMIN bypass — aplica tanto para roles como permisos
    const isAdmin = user.roles?.includes('ADMIN') || user.rol === 'ADMIN';
    if (isAdmin) return true;

    if (requiredRoles?.length) {
      const userRoles = new Set<string>([
        ...(user.roles ?? []),
        ...(user.rol ? [user.rol] : []),
      ]);
      const ok = requiredRoles.some((r) => userRoles.has(r));
      if (!ok) throw new ForbiddenException('No tienes el rol requerido');
    }

    if (requiredPermisos?.length) {
      const granted = new Set<string>(user.permisos ?? []);
      const missing = requiredPermisos.filter((p) => !granted.has(p));
      if (missing.length > 0) {
        throw new ForbiddenException(`Permisos faltantes: ${missing.join(', ')}`);
      }
    }

    return true;
  }
}
