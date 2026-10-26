import { Module } from '@nestjs/common';
import { FeriadosController } from './feriados.controller';
import { FeriadosService } from './feriados.service';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [AuditoriaModule],
  controllers: [FeriadosController],
  providers: [FeriadosService],
  exports: [FeriadosService],
})
export class FeriadosModule {}
