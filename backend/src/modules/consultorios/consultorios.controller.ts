import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ConsultoriosService } from './consultorios.service';
import { CreateConsultorioDto } from './dto/create-consultorio.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('consultorios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsultoriosController {
  constructor(private consultoriosService: ConsultoriosService) {}

  @Get()
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  findAll(@Query('activo') activo?: string) {
    const filtro = activo !== undefined ? activo === 'true' : undefined;
    return this.consultoriosService.findAll(filtro);
  }

  @Get(':id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  findOne(@Param('id') id: string) {
    return this.consultoriosService.findOne(id);
  }

  @Post()
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  create(@Body() dto: CreateConsultorioDto) {
    return this.consultoriosService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  update(@Param('id') id: string, @Body() dto: Partial<CreateConsultorioDto>) {
    return this.consultoriosService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMISION_PRINCIPAL')
  remove(@Param('id') id: string) {
    return this.consultoriosService.remove(id);
  }
}
