import { Module } from '@nestjs/common';
import { EspecialistasController } from './especialistas.controller';
import { EspecialistasService } from './especialistas.service';

@Module({
  controllers: [EspecialistasController],
  providers: [EspecialistasService],
  exports: [EspecialistasService],
})
export class EspecialistasModule {}
