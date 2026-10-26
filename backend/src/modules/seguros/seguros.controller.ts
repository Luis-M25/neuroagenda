import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { SegurosService } from './seguros.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('seguros')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMISION_PRINCIPAL', 'ADMISION')
export class SegurosController {
  constructor(private segurosService: SegurosService) {}

  @Get()
  findAll() { return this.segurosService.findAll(); }

  @Post()
  create(@Body() dto: { nombre: string; tipo: string; telefono?: string; direccion?: string }) { return this.segurosService.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: { nombre?: string; tipo?: string; telefono?: string; direccion?: string; activo?: boolean }) { return this.segurosService.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.segurosService.remove(id); }
}
