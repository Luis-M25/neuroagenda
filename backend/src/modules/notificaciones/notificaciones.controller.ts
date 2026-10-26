import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('notificaciones')
@UseGuards(JwtAuthGuard)
export class NotificacionesController {
  constructor(private notificacionesService: NotificacionesService) {}

  @Get()
  listar(@CurrentUser('sub') userId: string) {
    return this.notificacionesService.listar(userId);
  }

  @Get('no-leidas')
  async contarNoLeidas(@CurrentUser('sub') userId: string) {
    const count = await this.notificacionesService.contarNoLeidas(userId);
    return { count };
  }

  @Patch('leer-todas')
  marcarTodasLeidas(@CurrentUser('sub') userId: string) {
    return this.notificacionesService.marcarTodasLeidas(userId);
  }

  @Patch(':id/leida')
  marcarLeida(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.notificacionesService.marcarLeida(id, userId);
  }
}
