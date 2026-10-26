import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { EnfermeroService } from './enfermero.service';
import { CreateSignosVitalesDto, CreateAlergiaDto, CreateAntecedenteDto } from './dto/signos-vitales.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('enfermero')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ENFERMERO', 'ADMISION_PRINCIPAL')
export class EnfermeroController {
  constructor(private enfermeroService: EnfermeroService) {}

  @Get('citas-hoy')
  getCitasHoy() {
    return this.enfermeroService.getCitasHoy();
  }

  @Get('paciente/:id/datos-triaje')
  getDatosTriaje(@Param('id') pacienteId: string) {
    return this.enfermeroService.getDatosTriaje(pacienteId);
  }

  @Post('hce/:citaId/signos-vitales')
  guardarSignosVitales(
    @Param('citaId') citaId: string,
    @Body() dto: CreateSignosVitalesDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.enfermeroService.guardarSignosVitales(citaId, dto, userId);
  }

  @Post('hce/:citaId/alergias')
  guardarAlergias(
    @Param('citaId') citaId: string,
    @Body() dto: CreateAlergiaDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.enfermeroService.guardarAlergias(citaId, dto, userId);
  }

  @Post('hce/:citaId/antecedentes')
  guardarAntecedentes(
    @Param('citaId') citaId: string,
    @Body() dto: CreateAntecedenteDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.enfermeroService.guardarAntecedentes(citaId, dto, userId);
  }

  @Get('hce/:citaId')
  getHceParcial(@Param('citaId') citaId: string) {
    return this.enfermeroService.getHceParcial(citaId);
  }

  @Post('hce/:citaId/finalizar')
  finalizarTriaje(
    @Param('citaId') citaId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.enfermeroService.finalizarTriaje(citaId, userId);
  }
}
