import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SedesService } from './sedes.service';
import { CreateSedeDto } from './dto/create-sede.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('sedes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SedesController {
  constructor(private sedesService: SedesService) {}

  @Get()
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  findAll(@Query('activo') activo?: string) {
    const filtro = activo !== undefined ? activo === 'true' : undefined;
    return this.sedesService.findAll(filtro);
  }

  @Get(':id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  findOne(@Param('id') id: string) {
    return this.sedesService.findOne(id);
  }

  @Post()
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  create(@Body() dto: CreateSedeDto) {
    return this.sedesService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  update(@Param('id') id: string, @Body() dto: Partial<CreateSedeDto>) {
    return this.sedesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMISION_PRINCIPAL')
  remove(@Param('id') id: string) {
    return this.sedesService.remove(id);
  }
}
