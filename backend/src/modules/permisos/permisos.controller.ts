import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermiso } from '../../common/decorators/permissions.decorator';
import { PermisosService } from './permisos.service';

@ApiTags('Permisos')
@Controller('permisos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PermisosController {
  constructor(private svc: PermisosService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos los permisos del sistema' })
  async listar() {
    return this.svc['prisma'].permiso.findMany({
      orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Permisos efectivos del usuario actual' })
  async mios(@CurrentUser('sub') userId: string) {
    const [roles, permisos] = await Promise.all([
      this.svc.rolesEfectivos(userId),
      this.svc.permisosEfectivos(userId),
    ]);
    return { roles, permisos };
  }

  @Get('roles')
  @ApiOperation({ summary: 'Lista todos los roles con sus permisos' })
  async listarRoles() {
    return this.svc.listarRoles();
  }

  @Get('roles/:id')
  @ApiOperation({ summary: 'Obtiene permisos de un rol específico' })
  async obtenerPermisosRol(@Param('id') id: string) {
    return this.svc.obtenerPermisosPorRol(id);
  }

  @Put('roles/:id/permisos')
  @ApiOperation({ summary: 'Actualiza los permisos asignados a un rol' })
  @UseGuards(RolesGuard)
  @RequirePermiso('gestionarPermisos')
  async actualizarPermisosRol(
    @Param('id') id: string,
    @Body() body: { permisoIds: string[] },
  ) {
    return this.svc.actualizarPermisosRol(id, body.permisoIds);
  }
}
