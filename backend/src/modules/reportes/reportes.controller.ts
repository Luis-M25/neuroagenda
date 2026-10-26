import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMISION_PRINCIPAL', 'ADMISION', 'AUDITOR')
export class ReportesController {
  constructor(private reportesService: ReportesService) {}

  @Get('dashboard')
  getDashboard(@Query('fecha') fecha?: string) {
    return this.reportesService.getDashboard(fecha);
  }

  @Get('no-asistidos')
  getNoAsistidos(
    @Query('especialidad') especialidad?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.reportesService.getNoAsistidos(especialidad, fechaInicio, fechaFin);
  }

  @Get('citas-por-especialista')
  getCitasPorEspecialista(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.reportesService.getCitasPorEspecialista(fechaInicio, fechaFin);
  }

  @Get('exportar-csv')
  async exportarCsv(
    @Query('tipo') tipo: 'no-asistidos' | 'citas-por-especialista' | 'dashboard',
    @Res() res: Response,
    @Query('especialidad') especialidad?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    const csv = await this.reportesService.exportarCsv(tipo, especialidad, fechaInicio, fechaFin);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${tipo}-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  }
}
