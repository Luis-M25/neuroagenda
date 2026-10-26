import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { HorariosService } from './horarios.service';
import { CreateHorarioDto, BatchHorariosDto } from './dto/create-horario.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('horarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HorariosController {
  constructor(private horariosService: HorariosService) {}

  @Post()
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  create(@Body() dto: CreateHorarioDto, @CurrentUser('sub') userId: string) {
    return this.horariosService.create(dto, userId);
  }

  @Post('batch')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  createBatch(@Body() dto: BatchHorariosDto, @CurrentUser('sub') userId: string) {
    return this.horariosService.createBatch(dto, userId);
  }

  @Get()
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  findByEspecialista(
    @Query('especialistaId') especialistaId: string,
    @Query('todos') todos?: string,
  ) {
    return this.horariosService.findByEspecialista(especialistaId, todos !== 'true');
  }

  @SkipThrottle()
  @Get('disponibles')
  getAvailableSlots(
    @Query('especialistaId') especialistaId: string,
    @Query('fecha') fecha: string,
    @Query('pacienteId') pacienteId?: string,
    @Query('tienePasantes') tienePasantes?: string,
    @Query('pasanteCedula') pasanteCedula?: string,
  ) {
    return this.horariosService.getAvailableSlots(especialistaId, fecha, pacienteId, tienePasantes === 'true', pasanteCedula);
  }

  @Patch(':id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  update(@Param('id') id: string, @Body() dto: Partial<CreateHorarioDto>, @CurrentUser('sub') userId: string) {
    return this.horariosService.update(id, dto, userId);
  }

  @Patch(':id/toggle')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  toggleActive(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.horariosService.toggleActive(id, userId);
  }

  @Delete(':id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.horariosService.remove(id, userId);
  }
}
