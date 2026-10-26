import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { CitasService } from './citas.service';
import { CreateCitaDto } from './dto/create-cita.dto';
import { UpdateCitaDto } from './dto/update-cita.dto';
import { UpdateCitaEstadoDto, ReagendarCitaDto, ReagendarMasivoDto } from './dto/actions.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Citas')
@ApiBearerAuth()
@Controller('citas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CitasController {
  constructor(private citasService: CitasService) {}

  @Post()
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  @Permissions('crear_cita')
  @ApiOperation({ summary: 'Crear cita', description: 'Crea una nueva cita médica' })
  @ApiResponse({ status: 201, description: 'Cita creada exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  create(@Body() dto: CreateCitaDto, @CurrentUser('sub') userId: string) {
    return this.citasService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar citas', description: 'Obtiene todas las citas con filtros opcionales' })
  @ApiResponse({ status: 200, description: 'Listado de citas' })
  findAll(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('especialistaId') especialistaId?: string,
    @Query('pacienteId') pacienteId?: string,
    @Query('estado') estado?: string,
    @Query('especialidad') especialidad?: string,
    @Query('searchPaciente') searchPaciente?: string,
    @CurrentUser() user?: { sub: string; rol: string },
  ) {
    return this.citasService.findAll({
      fechaInicio,
      fechaFin,
      especialistaId,
      pacienteId,
      estado,
      especialidad,
      searchPaciente,
      userId: user?.sub,
      userRol: user?.rol,
    });
  }

  @Get('hoy')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Citas del día', description: 'Obtiene las citas programadas para hoy' })
  @ApiResponse({ status: 200, description: 'Listado de citas del día' })
  getCitasDelDia() {
    return this.citasService.getCitasDelDia();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener cita', description: 'Obtiene una cita por su ID' })
  @ApiResponse({ status: 200, description: 'Cita encontrada' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  findOne(@Param('id') id: string) {
    return this.citasService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  @Permissions('editar_cita')
  @ApiOperation({ summary: 'Actualizar cita', description: 'Actualiza los datos de una cita existente' })
  @ApiResponse({ status: 200, description: 'Cita actualizada exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  update(@Param('id') id: string, @Body() dto: UpdateCitaDto, @CurrentUser('sub') userId: string) {
    return this.citasService.update(id, dto, userId);
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Actualizar estado de cita', description: 'Cambia el estado de una cita' })
  @ApiResponse({ status: 200, description: 'Estado actualizado exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  updateEstado(
    @Param('id') id: string,
    @Body() dto: UpdateCitaEstadoDto,
    @CurrentUser() user: { sub: string; rol: string },
  ) {
    return this.citasService.updateEstado(id, dto, user.sub, user.rol);
  }

  @Post('reagendar/masivo')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  @Permissions('reagendar_cita')
  @ApiOperation({ summary: 'Reagendar masivo', description: 'Reagenda múltiples citas de forma masiva' })
  @ApiResponse({ status: 200, description: 'Reagendamiento masivo completado' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  reagendarMasivo(@Body() dto: ReagendarMasivoDto, @CurrentUser('sub') userId: string) {
    return this.citasService.reagendarMasivo(dto, userId);
  }

  @Post(':id/reagendar')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  @Permissions('reagendar_cita')
  @ApiOperation({ summary: 'Reagendar cita', description: 'Reagenda una cita para una nueva fecha/hora' })
  @ApiResponse({ status: 200, description: 'Cita reagendada exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  reagendar(@Param('id') id: string, @Body() dto: ReagendarCitaDto, @CurrentUser('sub') userId: string) {
    return this.citasService.reagendar(id, dto, userId);
  }

  @Patch(':id/liberar-horario')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  @ApiOperation({ summary: 'Liberar horario', description: 'Libera el horario de una cita cancelada' })
  @ApiResponse({ status: 200, description: 'Horario liberado exitosamente' })
  liberarHorario(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.citasService.liberarHorario(id, userId);
  }
}
