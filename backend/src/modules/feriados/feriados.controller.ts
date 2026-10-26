import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { FeriadosService } from './feriados.service';
import { CreateFeriadoDto } from './dto/create-feriado.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('feriados')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeriadosController {
  constructor(private feriadosService: FeriadosService) {}

  @Get()
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  findAll() {
    return this.feriadosService.findAll();
  }

  @Post()
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  create(@Body() dto: CreateFeriadoDto, @CurrentUser('sub') userId: string) {
    return this.feriadosService.create(dto, userId);
  }

  @Patch(':id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  update(@Param('id') id: string, @Body() dto: Partial<CreateFeriadoDto>, @CurrentUser('sub') userId: string) {
    return this.feriadosService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.feriadosService.remove(id, userId);
  }
}
