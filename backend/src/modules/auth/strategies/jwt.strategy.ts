import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../common/prisma.service';
import { PermisosService } from '../../permisos/permisos.service';

interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private permisosService: PermisosService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.activo) {
      throw new UnauthorizedException('Usuario inactivo o no existe');
    }

    const [rolesEfectivos, permisosEfectivos] = await Promise.all([
      this.permisosService.rolesEfectivos(user.id),
      this.permisosService.permisosEfectivos(user.id),
    ]);

    return {
      sub: user.id,
      email: user.email,
      rol: user.rol,
      roles: rolesEfectivos,
      permisos: permisosEfectivos,
    };
  }
}
