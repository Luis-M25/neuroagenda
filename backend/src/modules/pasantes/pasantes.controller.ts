import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { PasantesService } from './pasantes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('pasantes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PasantesController {
  constructor(private pasantesService: PasantesService) {}

  @Get('especialista/:especialistaId')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  findAll(@Param('especialistaId') especialistaId: string, @CurrentUser() user: { sub: string; rol: string }) {
    return this.pasantesService.findAll(especialistaId, user.sub, user.rol);
  }

  @Post('especialista/:especialistaId')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  create(@Param('especialistaId') especialistaId: string, @Body() dto: { nombres: string; apellidos: string; tipoIdentificacion: string; numeroIdentificacion: string }, @CurrentUser() user: { sub: string; rol: string }) {
    return this.pasantesService.create(especialistaId, dto, user.sub, user.rol);
  }

  @Patch(':id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  update(@Param('id') id: string, @Body() dto: { nombres?: string; apellidos?: string; tipoIdentificacion?: string; numeroIdentificacion?: string; activo?: boolean }) {
    return this.pasantesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  remove(@Param('id') id: string) {
    return this.pasantesService.remove(id);
  }
}
