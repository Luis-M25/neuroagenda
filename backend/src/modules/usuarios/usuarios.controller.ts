import { Controller, Get, Param, Post, Patch, Body, UseGuards, ForbiddenException, NotFoundException, BadRequestException, ConflictException, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermiso } from '../../common/decorators/permissions.decorator';
import { PrismaService } from '../../common/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { validateCedulaEcuador } from '../../common/utils/cedula-ec.utils';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { DisableUsuarioDto } from './dto/disable-usuario.dto';

@ApiTags('Usuarios')
@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsuariosController {
  constructor(
    private prisma: PrismaService,
    private auditoria: AuditoriaService,
  ) {}

  @Get('check-identificacion/:numero')
  @Roles('ADMIN', 'ADMISION', 'ADMISION_PRINCIPAL')
  @ApiOperation({ summary: 'Verifica si existe un especialista/paciente con esa identificación' })
  async check(@Param('numero') numero: string) {
    const num = (numero ?? '').trim();
    if (!num) throw new BadRequestException('Numero requerido');
    const [especialista, paciente] = await Promise.all([
      this.prisma.especialista.findUnique({ where: { numeroIdentificacion: num } }).catch(() => null),
      this.prisma.paciente.findUnique({ where: { numeroIdentificacion: num } }).catch(() => null),
    ]);
    return {
      existe: !!especialista || !!paciente,
      validacion: validateCedulaEcuador(num),
    };
  }

  @Post(':id/reveal')
  @Roles('ADMIN', 'ADMISION_PRINCIPAL')
  @RequirePermiso('firmar_digitalmente', 'gestionar_permisos')
  @ApiOperation({ summary: 'Re-verifica contraseña y revela identidad/firma digital' })
  async reveal(
    @Param('id') id: string,
    @Body() body: { password: string; motivo?: string },
    @Req() req: Request & { user?: { sub: string } },
  ) {
    const { password } = body || {};
    if (!password) throw new BadRequestException('Contrasena requerida');
    const reqUserId = req.user?.sub ?? '';
    const user = await this.prisma.usuario.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new ForbiddenException('Contrasena incorrecta');
    await this.auditoria.registrar({
      usuarioId: reqUserId,
      accion: 'REVEAL_PASSWORD',
      entidad: 'Usuario',
      entidadId: user.id,
      motivo: body.motivo ?? 're-verificacion',
    });
    return { ok: true, at: new Date().toISOString(), revalidatedBy: reqUserId, targetUser: user.id };
  }

  @Get()
  @Roles('ADMIN', 'ADMISION_PRINCIPAL')
  @ApiOperation({ summary: 'Listar todos los usuarios del sistema' })
  async findAll() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        rol: true,
        activo: true,
        ultimoAcceso: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'ADMISION_PRINCIPAL')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  async findOne(@Param('id') id: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        rol: true,
        activo: true,
        ultimoAcceso: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  @Patch(':id/disable')
  @Roles('ADMIN', 'ADMISION_PRINCIPAL')
  @ApiOperation({ summary: 'Habilitar o deshabilitar un usuario' })
  async toggleActive(
    @Param('id') id: string,
    @Body() dto: DisableUsuarioDto,
    @Req() req: Request & { user?: { sub: string } },
  ) {
    const target = await this.prisma.usuario.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Usuario no encontrado');
    if (target.rol === 'ADMIN' && target.email === (process.env.ADMIN_EMAIL || 'admin@neurociencias.ec')) {
      throw new ForbiddenException('No puedes desactivar al administrador principal');
    }
    const updated = await this.prisma.usuario.update({
      where: { id },
      data: { activo: !dto.disable },
    });
    const reqUserId = (req as any).user?.sub ?? '';
    await this.auditoria.registrar({
      usuarioId: reqUserId,
      accion: dto.disable ? 'DESACTIVAR_USUARIO' : 'ACTIVAR_USUARIO',
      entidad: 'Usuario',
      entidadId: id,
      detalle: { email: target.email },
    });
    return {
      id: updated.id,
      email: updated.email,
      activo: updated.activo,
    };
  }

  @Post(':id/reset-password')
  @Roles('ADMIN', 'ADMISION_PRINCIPAL')
  @RequirePermiso('gestionar_permisos')
  @ApiOperation({ summary: 'Restablecer contraseña de un usuario' })
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
  ) {
    const user = await this.prisma.usuario.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.prisma.usuario.update({
      where: { id },
      data: { passwordHash },
    });
    await this.prisma.refreshToken.updateMany({
      where: { usuarioId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true, message: 'Contrasena restablecida exitosamente' };
  }
}
