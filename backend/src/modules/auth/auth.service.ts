import { Injectable, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes, createHmac } from 'crypto';
import { PrismaService } from '../../common/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { PermisosService } from '../permisos/permisos.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const REFRESH_TOKEN_BYTES = 48;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const LOGIN_THROTTLE_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 5;

function computeRefreshHmac(token: string): string {
  return createHmac('sha256', process.env.JWT_REFRESH_SECRET || 'fallback-secret')
    .update(token)
    .digest('hex');
}

function generateOpaqueToken(): string {
  return randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
}

function computeExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  return d;
}

function parseJwtExpiresIn(value: string | number | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 900;
  const match = value.match(/(\d+)([smh])/);
  if (!match) return 900;
  const [, v, u] = match;
  const unit: Record<string, number> = { s: 1, m: 60, h: 3600 };
  return parseInt(v, 10) * (unit[u] || 1);
}

@Injectable()
export class AuthService {
  private loginFailures = new Map<string, { count: number; firstAttempt: number }>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditoriaService: AuditoriaService,
    private permisosService: PermisosService,
  ) {}

  private async buildAuthPayload(userId: string, email: string, rol: string) {
    const [roles, permisos] = await Promise.all([
      this.permisosService.rolesEfectivos(userId),
      this.permisosService.permisosEfectivos(userId),
    ]);
    return { sub: userId, email, rol, roles, permisos };
  }

  private recordLoginFailure(email: string, now: number) {
    const fail = this.loginFailures.get(email);
    if (!fail || (now - fail.firstAttempt) >= LOGIN_THROTTLE_WINDOW_MS) {
      this.loginFailures.set(email, { count: 1, firstAttempt: now });
    } else {
      fail.count += 1;
    }
  }

  private async issueTokens(userId: string, email: string, rol: string) {
    const payload = await this.buildAuthPayload(userId, email, rol);
    const jwtExpiresIn = (process.env.JWT_EXPIRES_IN as any) || '60m';
    const accessToken = this.jwtService.sign(payload, { expiresIn: jwtExpiresIn });
    const opaqueToken = generateOpaqueToken();
    const tokenHash = await bcrypt.hash(opaqueToken, 10);
    const family = randomBytes(16).toString('hex');

    await this.prisma.refreshToken.create({
      data: { usuarioId: userId, family, tokenHash, expiresAt: computeExpiry() },
    });

    const refreshHmac = computeRefreshHmac(opaqueToken);
    await this.prisma.sesion.create({
      data: { usuarioId: userId, refreshHash: refreshHmac, expiresAt: computeExpiry() },
    });

    return {
      accessToken,
      refreshToken: opaqueToken,
      expiresIn: parseJwtExpiresIn(jwtExpiresIn),
      payload,
    };
  }

  async login(dto: LoginDto) {
    const now = Date.now();
    const fail = this.loginFailures.get(dto.email);
    if (fail && fail.count >= LOGIN_MAX_FAILURES && (now - fail.firstAttempt) < LOGIN_THROTTLE_WINDOW_MS) {
      throw new HttpException('Demasiados intentos fallidos. Intente nuevamente en 15 minutos.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const user = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
      include: { administracion: { include: { permisos: true } } },
    });
    if (!user || !user.activo) {
      this.recordLoginFailure(dto.email, now);
      throw new UnauthorizedException('Credenciales invalidas');
    }
    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      this.recordLoginFailure(dto.email, now);
      throw new UnauthorizedException('Credenciales invalidas');
    }
    this.loginFailures.delete(dto.email);
    await this.prisma.usuario.update({
      where: { id: user.id },
      data: { ultimoAcceso: new Date() },
    });
    await this.auditoriaService.registrar({
      usuarioId: user.id,
      accion: 'INICIO_SESION',
      entidad: 'Usuario',
      entidadId: user.id,
      detalle: { email: user.email, rol: user.rol },
    });
    const tokens = await this.issueTokens(user.id, user.email, user.rol);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
        roles: tokens.payload.roles,
        permisos: tokens.payload.permisos,
        administracion: user.administracion
          ? { permisos: user.administracion.permisos }
          : undefined,
      },
    };
  }

  // evita O(n) bcrypt scan: HMAC lookup via Sesion table (indexed refreshHash)
  async refresh(refreshToken: string) {
    const refreshHmac = computeRefreshHmac(refreshToken);

    const sesion = await this.prisma.sesion.findFirst({
      where: { refreshHash: refreshHmac, revoked: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!sesion) throw new UnauthorizedException('Refresh token invalido');

    // Incluir tokens revocados para detectar reuso de family
    const candidates = await this.prisma.refreshToken.findMany({
      where: {
        usuarioId: sesion.usuarioId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    let matchedRecord: (typeof candidates)[number] | null = null;
    for (const candidate of candidates) {
      const ok = await bcrypt.compare(refreshToken, candidate.tokenHash);
      if (ok) {
        matchedRecord = candidate;
        break;
      }
    }

    if (!matchedRecord) {
      await this.prisma.sesion.updateMany({
        where: { usuarioId: sesion.usuarioId, refreshHash: refreshHmac, revoked: false },
        data: { revoked: true, revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token invalido');
    }

    // Reuso: token ya revocado de la misma family
    if (matchedRecord.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { family: matchedRecord.family, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.prisma.sesion.updateMany({
        where: { usuarioId: matchedRecord.usuarioId, revoked: false },
        data: { revoked: true, revokedAt: new Date() },
      });
      await this.auditoriaService.registrar({
        usuarioId: matchedRecord.usuarioId,
        accion: 'TOKEN_REUSE_DETECTED',
        entidad: 'RefreshToken',
        entidadId: matchedRecord.id,
        detalle: { family: matchedRecord.family },
      });
      throw new UnauthorizedException(
        'Token reutilizado detectado. Se ha revocado toda la sesion por seguridad.',
      );
    }

    const user = await this.prisma.usuario.findUnique({ where: { id: matchedRecord.usuarioId } });
    if (!user || !user.activo) throw new UnauthorizedException('Usuario invalido');

    // Rotación en LA MISMA family — NO llamar issueTokens()
    const newOpaqueToken = generateOpaqueToken();
    const newTokenHash = await bcrypt.hash(newOpaqueToken, 10);
    const newRecord = await this.prisma.refreshToken.create({
      data: {
        usuarioId: user.id,
        family: matchedRecord.family,
        tokenHash: newTokenHash,
        expiresAt: computeExpiry(),
      },
    });
    await this.prisma.refreshToken.update({
      where: { id: matchedRecord.id },
      data: { revokedAt: new Date(), replacedById: newRecord.id },
    });

    await this.prisma.sesion.update({
      where: { id: sesion.id },
      data: { revoked: true, revokedAt: new Date() },
    });
    const newRefreshHmac = computeRefreshHmac(newOpaqueToken);
    await this.prisma.sesion.create({
      data: {
        usuarioId: user.id,
        refreshHash: newRefreshHmac,
        expiresAt: computeExpiry(),
      },
    });

    const payload = await this.buildAuthPayload(user.id, user.email, user.rol);
    const jwtExpiresIn = (process.env.JWT_EXPIRES_IN as any) || '60m';
    const accessToken = this.jwtService.sign(payload, { expiresIn: jwtExpiresIn });

    return {
      accessToken,
      refreshToken: newOpaqueToken,
      expiresIn: parseJwtExpiresIn(jwtExpiresIn),
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
        roles: payload.roles,
        permisos: payload.permisos,
      },
    };
  }

  async revoke(refreshToken: string) {
    const refreshHmac = computeRefreshHmac(refreshToken);
    const sesion = await this.prisma.sesion.findFirst({
      where: { refreshHash: refreshHmac, revoked: false },
      orderBy: { createdAt: 'desc' },
    });
    if (!sesion) return;

    await this.prisma.sesion.update({
      where: { id: sesion.id },
      data: { revoked: true, revokedAt: new Date() },
    });
    await this.prisma.refreshToken.updateMany({
      where: { usuarioId: sesion.usuarioId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    const passwordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Contrasena actual incorrecta');
    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.usuario.update({ where: { id: userId }, data: { passwordHash: newHash } });
    await this.prisma.refreshToken.updateMany({
      where: { usuarioId: userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.prisma.sesion.updateMany({
      where: { usuarioId: userId, revoked: false },
      data: { revoked: true, revokedAt: new Date() },
    });
    return { message: 'Contrasena actualizada exitosamente', success: true };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: { administracion: { include: { permisos: true } }, especialista: true },
    });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    const [roles, permisos] = await Promise.all([
      this.permisosService.rolesEfectivos(userId),
      this.permisosService.permisosEfectivos(userId),
    ]);
    const { passwordHash, refreshTokens, sesiones, ...safe } = user as any;
    return { ...safe, roles, permisos };
  }
}
