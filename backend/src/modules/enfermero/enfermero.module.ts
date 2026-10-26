import { Module } from '@nestjs/common';
import { EnfermeroController } from './enfermero.controller';
import { EnfermeroService } from './enfermero.service';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [NotificacionesModule],
  controllers: [EnfermeroController],
  providers: [EnfermeroService],
  exports: [EnfermeroService],
})
export class EnfermeroModule {}
