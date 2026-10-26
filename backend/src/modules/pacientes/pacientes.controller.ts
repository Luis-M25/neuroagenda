import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { PacientesService } from './pacientes.service';
import { CreatePacienteDto, UpdatePacienteDto } from './dto/create-paciente.dto';
import { CancelarProtocoloDto } from './dto/cancelar-protocolo.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermiso, Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Pacientes')
@ApiBearerAuth()
@Controller('pacientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PacientesController {
  constructor(private svc: PacientesService) {}

  @Post()
  @Roles('ADMIN', 'ADMISION', 'ADMISION_PRINCIPAL', 'PORTERO')
  @RequirePermiso('crear_paciente')
  @ApiOperation({ summary: 'Crear paciente', description: 'Crea un nuevo paciente en el sistema' })
  @ApiResponse({ status: 201, description: 'Paciente creado exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  create(@Body() dto: CreatePacienteDto, @CurrentUser('sub') userId: string) {
    return this.svc.create(dto, userId);
  }

  @Get()
  @Roles('ADMIN', 'ADMISION', 'ADMISION_PRINCIPAL', 'PORTERO', 'ESPECIALISTA')
  @RequirePermiso('ver_pacientes')
  @ApiOperation({ summary: 'Listar pacientes', description: 'Obtiene todos los pacientes con filtros opcionales' })
  @ApiResponse({ status: 200, description: 'Listado de pacientes' })
  findAll(
    @Query('nombre') nombre?: string,
    @Query('identificacion') identificacion?: string,
    @Query('bloqueado') bloqueado?: string,
  ) {
    return this.svc.findAll({
      nombre,
      identificacion,
      bloqueado: bloqueado !== undefined ? bloqueado === 'true' : undefined,
    });
  }

  @Get('reporte-inasistencias')
  @Roles('ADMIN', 'ADMISION', 'ADMISION_PRINCIPAL')
  @RequirePermiso('ver_inasistencias')
  @ApiOperation({ summary: 'Reporte de inasistencias', description: 'Obtiene el reporte de pacientes con inasistencias' })
  @ApiResponse({ status: 200, description: 'Reporte de inasistencias' })
  getReporteInasistencias() {
    return this.svc.getReporteInasistencias();
  }

  @Get('identificacion/:numero')
  @Roles('ADMIN', 'ADMISION', 'ADMISION_PRINCIPAL', 'PORTERO', 'ESPECIALISTA')
  @ApiOperation({ summary: 'Buscar por identificación', description: 'Busca un paciente por su número de identificación' })
  @ApiResponse({ status: 200, description: 'Paciente encontrado' })
  findByIdentificacion(@Param('numero') numero: string) {
    return this.svc.findByIdentificacion(numero);
  }

  @Get(':id')
  @Roles('ADMIN', 'ADMISION', 'ADMISION_PRINCIPAL', 'PORTERO', 'ESPECIALISTA')
  @ApiOperation({ summary: 'Obtener paciente', description: 'Obtiene un paciente por su ID' })
  @ApiResponse({ status: 200, description: 'Paciente encontrado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Get(':id/historial')
  @Roles('ADMIN', 'ADMISION', 'ADMISION_PRINCIPAL', 'PORTERO', 'ESPECIALISTA')
  @ApiOperation({ summary: 'Historial clínico', description: 'Obtiene el historial clínico del paciente' })
  @ApiResponse({ status: 200, description: 'Historial clínico del paciente' })
  getHistorialClinico(@Param('id') id: string) {
    return this.svc.getHistorialClinico(id);
  }

  @Get(':id/inasistencias')
  @Roles('ADMIN', 'ADMISION', 'ADMISION_PRINCIPAL')
  @RequirePermiso('ver_inasistencias')
  @ApiOperation({ summary: 'Inasistencias del paciente', description: 'Obtiene las inasistencias de un paciente' })
  @ApiResponse({ status: 200, description: 'Listado de inasistencias' })
  getInasistencias(@Param('id') id: string) {
    return this.svc.getInasistencias(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'ADMISION', 'ADMISION_PRINCIPAL')
  @RequirePermiso('editar_paciente')
  @ApiOperation({ summary: 'Actualizar paciente', description: 'Actualiza los datos de un paciente' })
  @ApiResponse({ status: 200, description: 'Paciente actualizado exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  update(@Param('id') id: string, @Body() dto: UpdatePacienteDto, @CurrentUser('sub') userId: string) {
    return this.svc.update(id, dto, userId);
  }

  @Post(':id/bloquear')
  @Roles('ADMIN', 'ADMISION', 'ADMISION_PRINCIPAL')
  @RequirePermiso('bloquear_paciente')
  @ApiOperation({ summary: 'Bloquear paciente', description: 'Bloquea a un paciente por inasistencias' })
  @ApiResponse({ status: 200, description: 'Paciente bloqueado exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  bloquear(
    @Param('id') id: string,
    @Body('motivo') motivo: string,
    @Body('especialidad') especialidad: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.svc.bloquear(id, motivo, userId, especialidad);
  }

  @Post(':id/desbloquear')
  @Roles('ADMIN', 'ADMISION', 'ADMISION_PRINCIPAL')
  @RequirePermiso('bloquear_paciente')
  @ApiOperation({ summary: 'Desbloquear paciente', description: 'Desbloquea a un paciente' })
  @ApiResponse({ status: 200, description: 'Paciente desbloqueado exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  desbloquear(
    @Param('id') id: string,
    @Body('especialidad') especialidad: string | undefined,
    @CurrentUser('sub') userId: string,
  ) {
    return this.svc.desbloquear(id, especialidad, userId);
  }

  @Post(':id/cancelar-protocolo')
  @Roles('ADMIN', 'ADMISION', 'ADMISION_PRINCIPAL')
  @RequirePermiso('gestionar_citas')
  @ApiOperation({ summary: 'Cancelar protocolo por inasistencias', description: 'Cancela todas las citas futuras de una especialidad y reinicia el contador de inasistencias' })
  @ApiResponse({ status: 200, description: 'Protocolo cancelado exitosamente' })
  cancelarProtocolo(
    @Param('id') id: string,
    @Body() dto: CancelarProtocoloDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.svc.cancelarProtocolo(id, dto.especialidad, dto.motivo, userId);
  }
}
