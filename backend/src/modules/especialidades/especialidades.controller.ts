import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { EspecialidadesService } from './especialidades.service';
import { CreateEspecialidadDto } from './dto/create-especialidad.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('especialidades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EspecialidadesController {
  constructor(private especialidadesService: EspecialidadesService) {}

  @Get()
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  findAll(@Query('activo') activo?: string) {
    const filtro = activo !== undefined ? activo === 'true' : undefined;
    return this.especialidadesService.findAll(filtro);
  }

  @Get(':id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  findOne(@Param('id') id: string) {
    return this.especialidadesService.findOne(id);
  }

  @Post()
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  create(@Body() dto: CreateEspecialidadDto) {
    return this.especialidadesService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  update(@Param('id') id: string, @Body() dto: Partial<CreateEspecialidadDto>) {
    return this.especialidadesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMISION_PRINCIPAL')
  remove(@Param('id') id: string) {
    return this.especialidadesService.remove(id);
  }
}
