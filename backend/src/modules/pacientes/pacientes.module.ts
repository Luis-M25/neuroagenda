import { Module } from '@nestjs/common';
import { PacientesController } from './pacientes.controller';
import { PacientesService } from './pacientes.service';
import { AntecedentesService } from './antecedentes.service';
import { AlergiasService } from './alergias.service';
import { HabitosService } from './habitos.service';
import { ProblemasService } from './problemas.service';

@Module({
  controllers: [PacientesController],
  providers: [
    PacientesService,
    AntecedentesService,
    AlergiasService,
    HabitosService,
    ProblemasService,
  ],
  exports: [PacientesService],
})
export class PacientesModule {}
