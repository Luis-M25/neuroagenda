import { Module } from '@nestjs/common';
import { PasantesService } from './pasantes.service';
import { PasantesController } from './pasantes.controller';

@Module({
  controllers: [PasantesController],
  providers: [PasantesService],
  exports: [PasantesService],
})
export class PasantesModule {}
