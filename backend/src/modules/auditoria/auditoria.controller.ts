import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('auditoria')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMISION_PRINCIPAL')
export class AuditoriaController {
  constructor(private auditoriaService: AuditoriaService) {}

  @Get()
  listar(
    @Query('usuarioId') usuarioId?: string,
    @Query('entidad') entidad?: string,
    @Query('accion') accion?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('pagina') pagina?: string,
    @Query('limite') limite?: string,
  ) {
    return this.auditoriaService.listar({
      usuarioId,
      entidad,
      accion,
      desde,
      hasta,
      pagina: pagina ? parseInt(pagina) : 1,
      limite: limite ? parseInt(limite) : 50,
    });
  }
}
