import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuditorService } from './auditor.service';
import { RevisarHcDto } from './dto/revision.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auditor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('AUDITOR', 'ADMISION_PRINCIPAL')
export class AuditorController {
  constructor(private auditorService: AuditorService) {}

  @Get('hce')
  listarHc(
    @Query('especialistaId') especialistaId?: string,
    @Query('pacienteId') pacienteId?: string,
    @Query('especialidad') especialidad?: string,
    @Query('estadoRevision') estadoRevision?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('pagina') pagina?: string,
    @Query('limite') limite?: string,
  ) {
    return this.auditorService.listarHc({
      especialistaId, pacienteId, especialidad, estadoRevision, desde, hasta,
      pagina: pagina ? parseInt(pagina) : 1,
      limite: limite ? parseInt(limite) : 50,
    });
  }

  @Get('hce/:consultaId')
  getHcCompleta(@Param('consultaId') consultaId: string) {
    return this.auditorService.getHcCompleta(consultaId);
  }

  @Post('hce/:consultaId/revisar')
  revisarHc(
    @Param('consultaId') consultaId: string,
    @Body() dto: RevisarHcDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.auditorService.revisarHc(consultaId, dto, userId);
  }

  @Get('especialistas')
  listarEspecialistas() {
    return this.auditorService.listarEspecialistas();
  }

  @Get('estadisticas')
  getEstadisticas() {
    return this.auditorService.getEstadisticas();
  }
}
