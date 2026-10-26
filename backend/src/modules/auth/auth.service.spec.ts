/**
 * Test de INTEGRACION contra la base de datos SQLite local real (backend/prisma/dev.db).
 * NO usa mocks: instancia PrismaService, JwtService, AuditoriaService y PermisosService reales.
 * Crea usuarios de prueba con prefijo TEST_EMAIL_PREFIX y los elimina al finalizar
 * (tambien limpia residuos de ejecuciones interrumpidas en beforeAll).
 */
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { PermisosService } from '../permisos/permisos.service';

// Carga el mismo .env que usa la app (DATABASE_URL=file:./dev.db → backend/prisma/dev.db)
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

jest.setTimeout(30000);

const TEST_EMAIL_PREFIX = 'test-auth-spec-';

describe('AuthService (integracion — DB local real)', () => {
  let prisma: PrismaService;
  let authService: AuthService;
  let emailCounter = 0;
  const createdUserIds: string[] = [];

  function nextEmail(tag: string): string {
    emailCounter += 1;
    return `${TEST_EMAIL_PREFIX}${Date.now()}-${emailCounter}-${tag}@test.local`;
  }

  async function createTestUser(opts: {
    email: string;
    password: string;
    activo?: boolean;
    rol?: string;
  }) {
    const passwordHash = await bcrypt.hash(opts.password, 10);
    const user = await prisma.usuario.create({
      data: {
        email: opts.email,
        passwordHash,
        rol: opts.rol || 'ESPECIALISTA',
        activo: opts.activo ?? true,
      },
    });
    createdUserIds.push(user.id);
    return user;
  }

  async function cleanupTestData() {
    // Residuos de ejecuciones anteriores interrumpidas
    const stale = await prisma.usuario.findMany({
      where: { email: { startsWith: TEST_EMAIL_PREFIX } },
      select: { id: true },
    });
    const ids = [...new Set([...createdUserIds, ...stale.map((u) => u.id)])];
    if (ids.length === 0) return;
    // Auditoria no tiene onDelete: Cascade — se borra primero
    await prisma.auditoria.deleteMany({ where: { usuarioId: { in: ids } } });
    // Sesion y RefreshToken tienen onDelete: Cascade — se borran con el usuario
    await prisma.usuario.deleteMany({ where: { id: { in: ids } } });
    createdUserIds.length = 0;
  }

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    const jwtService = new JwtService({ secret: process.env.JWT_SECRET });
    const auditoriaService = new AuditoriaService(prisma);
    const permisosService = new PermisosService(prisma);
    authService = new AuthService(prisma, jwtService, auditoriaService, permisosService);
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  describe('login', () => {
    it('debe lanzar UnauthorizedException si el usuario no existe', async () => {
      await expect(
        authService.login({ email: nextEmail('noexiste'), password: 'Password1!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe lanzar UnauthorizedException si el usuario esta inactivo', async () => {
      const email = nextEmail('inactivo');
      await createTestUser({ email, password: 'Password1!', activo: false });

      await expect(
        authService.login({ email, password: 'Password1!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe lanzar UnauthorizedException si la contrasena es incorrecta', async () => {
      const email = nextEmail('wrongpass');
      await createTestUser({ email, password: 'correct-password' });

      await expect(
        authService.login({ email, password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe retornar tokens y persistir sesion + refreshToken en login exitoso', async () => {
      const email = nextEmail('ok');
      const user = await createTestUser({ email, password: 'Password1!', rol: 'ADMISION_PRINCIPAL' });

      const result = await authService.login({ email, password: 'Password1!' });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken.length).toBe(96);
      expect(result.user.rol).toBe('ADMISION_PRINCIPAL');

      // Verificacion directa en DB real
      const refreshTokens = await prisma.refreshToken.findMany({ where: { usuarioId: user.id } });
      expect(refreshTokens.length).toBe(1);
      const sesiones = await prisma.sesion.findMany({ where: { usuarioId: user.id, revoked: false } });
      expect(sesiones.length).toBe(1);

      // ultimoAcceso actualizado
      const updated = await prisma.usuario.findUnique({ where: { id: user.id } });
      expect(updated!.ultimoAcceso).not.toBeNull();
    });
  });

  describe('refresh', () => {
    it('debe lanzar UnauthorizedException si el token no se encuentra', async () => {
      await expect(authService.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('rota el token: refresh valido funciona una vez y el token viejo queda inutilizable', async () => {
      const email = nextEmail('rotate');
      const user = await createTestUser({ email, password: 'Password1!' });
      const login = await authService.login({ email, password: 'Password1!' });

      const refreshed = await authService.refresh(login.refreshToken);
      expect(refreshed.accessToken).toBeDefined();
      expect(refreshed.refreshToken).toBeDefined();
      expect(refreshed.refreshToken).not.toBe(login.refreshToken);

      // El token anterior fue revocado en DB — reusarlo falla
      await expect(authService.refresh(login.refreshToken)).rejects.toThrow(UnauthorizedException);

      // La sesion anterior quedo revocada y existe una nueva activa
      const sesiones = await prisma.sesion.findMany({ where: { usuarioId: user.id } });
      expect(sesiones.some((s) => s.revoked)).toBe(true);
      expect(sesiones.some((s) => !s.revoked)).toBe(true);
    });
  });

    it('refresh rota token en la misma family y no crea family nueva', async () => {
      const email = nextEmail('same-family');
      const user = await createTestUser({ email, password: 'Password1!' });
      const login = await authService.login({ email, password: 'Password1!' });

      // Obtener family del token original
      const originalTokens = await prisma.refreshToken.findMany({
        where: { usuarioId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });
      const originalFamily = originalTokens[0].family;

      const refreshed = await authService.refresh(login.refreshToken);
      expect(refreshed.accessToken).toBeDefined();
      expect(refreshed.refreshToken).toBeDefined();

      // Verificar que el nuevo token tiene la misma family
      const newTokens = await prisma.refreshToken.findMany({
        where: { usuarioId: user.id, revokedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });
      expect(newTokens[0].family).toBe(originalFamily);

      // Solo hubo un nuevo token (no se creó una segunda family distinta)
      const allTokens = await prisma.refreshToken.findMany({
        where: { usuarioId: user.id },
      });
      const families = new Set(allTokens.map((t) => t.family));
      expect(families.size).toBe(1);
    });

    it('refresh con token revocado lanza y revoca family', async () => {
      const email = nextEmail('reuse-detected');
      const user = await createTestUser({ email, password: 'Password1!' });
      const login = await authService.login({ email, password: 'Password1!' });

      // Revocar manualmente el refresh token
      const firstToken = await prisma.refreshToken.findFirst({
        where: { usuarioId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      await prisma.refreshToken.update({
        where: { id: firstToken!.id },
        data: { revokedAt: new Date() },
      });

      // Reusar el token original debe detectar la reutilización
      await expect(
        authService.refresh(login.refreshToken),
      ).rejects.toThrow(/reutilizado/);

      // Verificar que se revocó toda la family
      const familyTokens = await prisma.refreshToken.findMany({
        where: { family: firstToken!.family },
      });
      expect(familyTokens.every((t) => t.revokedAt !== null)).toBe(true);

      // Verificar que todas las sesiones del usuario quedaron revocadas
      const sesiones = await prisma.sesion.findMany({
        where: { usuarioId: user.id, revoked: false },
      });
      expect(sesiones.length).toBe(0);
    });

  describe('changePassword', () => {
    it('cambia la contrasena y revoca todos los tokens/sesiones en DB', async () => {
      const email = nextEmail('changepass');
      const user = await createTestUser({ email, password: 'Password1!' });
      await authService.login({ email, password: 'Password1!' });

      const result = await authService.changePassword(user.id, {
        currentPassword: 'Password1!',
        newPassword: 'NewPassword2!',
      });
      expect(result.message).toBe('Contrasena actualizada exitosamente');

      // Todos los refresh tokens y sesiones del usuario quedaron revocados
      const tokens = await prisma.refreshToken.findMany({ where: { usuarioId: user.id } });
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.every((t) => t.revokedAt !== null)).toBe(true);
      const sesiones = await prisma.sesion.findMany({ where: { usuarioId: user.id } });
      expect(sesiones.every((s) => s.revoked)).toBe(true);

      // La contrasena vieja ya no sirve, la nueva si
      await expect(
        authService.login({ email, password: 'Password1!' }),
      ).rejects.toThrow(UnauthorizedException);
      const relogin = await authService.login({ email, password: 'NewPassword2!' });
      expect(relogin.accessToken).toBeDefined();
    });

    it('lanza UnauthorizedException si la contrasena actual es incorrecta', async () => {
      const email = nextEmail('changepass-wrong');
      const user = await createTestUser({ email, password: 'Password1!' });

      await expect(
        authService.changePassword(user.id, {
          currentPassword: 'WrongPassword1!',
          newPassword: 'NewPassword2!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
