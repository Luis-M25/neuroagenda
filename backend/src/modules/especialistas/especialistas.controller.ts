import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { EspecialistasService } from './especialistas.service';
import { CreateEspecialistaDto, UpdateEspecialistaDto } from './dto/create-especialista.dto';
import { UpdateEspecialistaEstadoDto } from './dto/update-especialista-estado.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermiso, Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Especialistas')
@ApiBearerAuth()
@Controller('especialistas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EspecialistasController {
  constructor(private svc: EspecialistasService) {}

  @Post()
  @Roles('ADMIN', 'ADMISION', 'ADMISION_PRINCIPAL')
  @RequirePermiso('crear_especialista')
  @ApiOperation({ summary: 'Crear especialista', description: 'Crea un nuevo especialista médico' })
  @ApiResponse({ status: 201, description: 'Especialista creado exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  create(@Body() dto: CreateEspecialistaDto, @CurrentUser('sub') userId: string) {
    return this.svc.create(dto, userId);
  }

  @Get()
  @Roles('ADMIN', 'ADMISION', 'ADMISION_PRINCIPAL', 'ESPECIALISTA')
  @RequirePermiso('ver_especialistas')
  @ApiOperation({ summary: 'Listar especialistas', description: 'Obtiene todos los especialistas con filtros opcionales' })
  @ApiResponse({ status: 200, description: 'Listado de especialistas' })
  findAll(@Query('activo') activo?: string, @Query('especialidad') especialidad?: string) {
    return this.svc.findAll({
      activo: activo !== undefined ? activo === 'true' : undefined,
      especialidad,
    });
  }

  @Get('identificacion/:numero')
  @Roles('ADMIN', 'ADMISION', 'ADMISION_PRINCIPAL', 'PORTERO', 'ESPECIALISTA')
  @ApiOperation({ summary: 'Buscar por identificación', description: 'Busca un especialista por su número de identificación' })
  @ApiResponse({ status: 200, description: 'Resultado de búsqueda' })
  findByIdentificacion(@Param('numero') numero: string) {
    return this.svc.findByIdentificacion(numero).then((e) => ({ exists: !!e, especialista: e }));
  }

  @Get('especialidades')
  @ApiOperation({ summary: 'Listar especialidades', description: 'Obtiene todas las especialidades médicas' })
  @ApiResponse({ status: 200, description: 'Listado de especialidades' })
  getEspecialidades() {
    return this.svc.getEspecialidades();
  }

  @Get('bloqueo-grupal')
  @Roles('ADMIN', 'ADMISION', 'ADMISION_PRINCIPAL')
  @ApiOperation({ summary: 'Listar bloqueos grupales', description: 'Obtiene todos los bloqueos grupales' })
  @ApiResponse({ status: 200, description: 'Listado de bloqueos grupales' })
  findAllBloqueos() {
    return this.svc.findAllBloqueos();
  }

  @Post('bloqueo-grupal')
  @Roles('ADMIN', 'ADMISION', 'ADMISION_PRINCIPAL')
  @RequirePermiso('bloqueo_grupal_especialistas')
  @ApiOperation({ summary: 'Crear bloqueo grupal', description: 'Crea un bloqueo grupal para múltiples especialistas' })
  @ApiResponse({ status: 201, description: 'Bloqueo grupal creado exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  createBloqueoGrupal(
    @Body() dto: { nombre: string; descripcion?: string; especialistaIds: string[]; fechaInicio: string; fechaFin?: string; forzar?: boolean },
    @CurrentUser('sub') userId: string,
  ) {
    return this.svc.createBloqueoGrupal(dto, userId);
  }

  @Put('bloqueo-grupal/:id')
  @Roles('ADMIN', 'ADMISION', 'ADMISION_PRINCIPAL')
  @RequirePermiso('bloqueo_grupal_especialistas')
  @ApiOperation({ summary: 'Actualizar bloqueo grupal', description: 'Actualiza un bloqueo grupal existente' })
  @ApiResponse({ status: 200, description: 'Bloqueo grupal actualizado exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  updateBloqueoGrupal(
    @Param('id') id: string,
    @Body() dto: { nombre: string; descripcion?: string; especialistaIds: string[]; fechaInicio: string; fechaFin?: string },
  ) {
    return this.svc.updateBloqueoGrupal(id, dto);
  }

  @Delete('bloqueo-grupal/:id')
  @Roles('ADMIN', 'ADMISION', 'ADMISION_PRINCIPAL')
  @RequirePermiso('bloqueo_grupal_especialistas')
  @ApiOperation({ summary: 'Eliminar bloqueo grupal', description: 'Elimina un bloqueo grupal' })
  @ApiResponse({ status: 200, description: 'Bloqueo grupal eliminado exitosamente' })
  deleteBloqueoGrupal(@Param('id') id: string) {
    return this.svc.deleteBloqueoGrupal(id);
  }

  @Get(':id')
  @Roles('ADMIN', 'ADMISION', 'ADMISION_PRINCIPAL', 'ESPECIALISTA')
  @ApiOperation({ summary: 'Obtener especialista', description: 'Obtiene un especialista por su ID' })
  @ApiResponse({ status: 200, description: 'Especialista encontrado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    if (user.rol === 'ESPECIALISTA' && user.sub !== id) {
      throw new ForbiddenException('No tienes permiso para ver este especialista');
    }
    return this.svc.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'ADMISION', 'ADMISION_PRINCIPAL')
  @RequirePermiso('editar_especialista')
  @ApiOperation({ summary: 'Actualizar especialista', description: 'Actualiza los datos de un especialista' })
  @ApiResponse({ status: 200, description: 'Especialista actualizado exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  update(@Param('id') id: string, @Body() dto: UpdateEspecialistaDto, @CurrentUser('sub') userId: string) {
    return this.svc.update(id, dto, userId);
  }

  @Patch(':id/estado')
  @Roles('ADMIN', 'ADMISION', 'ADMISION_PRINCIPAL')
  @RequirePermiso('deshabilitar_especialista')
  @ApiOperation({ summary: 'Actualizar estado de especialista', description: 'Habilita o deshabilita un especialista' })
  @ApiResponse({ status: 200, description: 'Estado actualizado exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  updateEstado(@Param('id') id: string, @Body() dto: UpdateEspecialistaEstadoDto, @CurrentUser('sub') userId: string) {
    return this.svc.updateEstado(id, dto, userId);
  }
}
