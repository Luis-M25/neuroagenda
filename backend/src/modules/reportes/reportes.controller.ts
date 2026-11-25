import { Controller, Get, Query, Param, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import * as yazl from 'yazl';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditoriaService } from '../auditoria/auditoria.service';
import {
  AsistenciasQueryDto,
  BuscarPacientesHcQueryDto,
  ExportarReporteQueryDto,
  RegistroHcQueryDto,
} from './dto/reportes-query.dto';

@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMISION_PRINCIPAL', 'ADMISION', 'AUDITOR')
export class ReportesController {
  constructor(
    private reportesService: ReportesService,
    private auditoriaService: AuditoriaService,
  ) {}

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

  @Get('asistencias-por-paciente')
  getAsistenciasPorPaciente(@Query() query: AsistenciasQueryDto) {
    return this.reportesService.getAsistencias(query);
  }

  @Get('historias-clinicas')
  getRegistroHistoriasClinicas(@Query() query: RegistroHcQueryDto) {
    return this.reportesService.getRegistroHistoriasClinicas(query);
  }

  @Get('historias-clinicas/pacientes')
  buscarPacientesConHc(@Query() query: BuscarPacientesHcQueryDto) {
    return this.reportesService.buscarPacientesConHc(query);
  }

  @Get('historias-clinicas/paciente/:id/resumen')
  getResumenHcPaciente(@Param('id') pacienteId: string) {
    return this.reportesService.getResumenHcPaciente(pacienteId);
  }

  @Get('historias-clinicas/paciente/:id/zip')
  async descargarHcPacienteZip(
    @Param('id') pacienteId: string,
    @CurrentUser('sub') userId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const data = await this.reportesService.prepararZipHcPaciente(pacienteId);

    await this.auditoriaService.registrar({
      usuarioId: userId,
      accion: 'DESCARGAR_HC_PACIENTE_ZIP',
      entidad: 'Paciente',
      entidadId: pacienteId,
      detalle: {
        incluidas: data.incluidas,
        pendientesExcluidas: data.pendientes,
        pdfNoDisponibles: data.noDisponibles,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${data.filename}"`);
    res.setHeader('X-HC-Incluidas', String(data.incluidas));
    res.setHeader('X-HC-Excluidas', String(data.pendientes));
    res.setHeader('X-HC-No-Disponibles', String(data.noDisponibles));
    res.setHeader(
      'Access-Control-Expose-Headers',
      'Content-Disposition, X-HC-Incluidas, X-HC-Excluidas, X-HC-No-Disponibles',
    );

    const zipFile = new yazl.ZipFile();
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      };
      const fail = (error: Error) => {
        if (!settled) {
          settled = true;
          res.destroy(error);
          reject(error);
        }
      };

      zipFile.on('error', fail);
      zipFile.outputStream.on('error', fail);
      res.on('finish', finish);
      res.on('close', () => {
        if (res.writableEnded) finish();
        else fail(new Error('La descarga del ZIP fue interrumpida'));
      });
      zipFile.outputStream.pipe(res);

      for (const file of data.files) {
        // Los PDF ya están comprimidos; almacenarlos evita CPU innecesaria.
        zipFile.addFile(file.path, file.name, { compress: false });
      }
      zipFile.end();
    });
  }

  @Get('exportar-csv')
  async exportarCsv(@Query() query: ExportarReporteQueryDto, @Res() res: Response) {
    const csv = await this.reportesService.exportarCsv(query);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${query.tipo}-${new Date().toISOString().split('T')[0]}.csv"`,
    );
    res.send(csv);
  }
}
