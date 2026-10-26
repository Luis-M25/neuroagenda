import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CalendarioService } from './calendario.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('calendario')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CalendarioController {
  constructor(private calendarioService: CalendarioService) {}

  @Get('eventos')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA', 'PORTERO')
  getEventos(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Query('especialistaId') especialistaId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.calendarioService.getEventos(
      fechaInicio,
      fechaFin,
      especialistaId,
      user?.sub,
      user?.rol,
    );
  }

  @Post('bloquear-dia')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  @Permissions('editar_cita')
  bloquearDia(
    @Body() dto: { fecha: string; motivo: string; cancelarCitas?: boolean; reagendarCitas?: boolean },
    @CurrentUser('sub') userId: string,
  ) {
    return this.calendarioService.bloquearDia(dto, userId);
  }

  @Patch('bloquear-dia/:id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  @Permissions('editar_cita')
  actualizarBloqueo(
    @Param('id') id: string,
    @Body() dto: { motivo?: string; activo?: boolean },
  ) {
    return this.calendarioService.actualizarBloqueo(id, dto);
  }

  @Delete('bloquear-dia/:id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  @Permissions('editar_cita')
  eliminarBloqueo(@Param('id') id: string) {
    return this.calendarioService.eliminarBloqueo(id);
  }

  @Get('dias-bloqueados')
  getDiasBloqueados(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.calendarioService.getDiasBloqueados(fechaInicio, fechaFin);
  }

  @Get('dias-bloqueados/todas')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  getTodasFechasBloqueadas() {
    return this.calendarioService.getTodasFechasBloqueadas();
  }
}
