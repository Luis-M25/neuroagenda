import { Module } from '@nestjs/common';
import { ConsultoriosController } from './consultorios.controller';
import { ConsultoriosService } from './consultorios.service';

@Module({
  controllers: [ConsultoriosController],
  providers: [ConsultoriosService],
  exports: [ConsultoriosService],
})
export class ConsultoriosModule {}
