import { Module } from '@nestjs/common';
import { CitasController } from './citas.controller';
import { CitasService } from './citas.service';
import { CitaDomainService } from './services/domain/cita-domain.service';
import { CitaConflictsService } from './services/domain/cita-conflicts.service';
import { CitaSlotsService } from './services/domain/cita-slots.service';
import { CitaRecurrenceService } from './services/domain/cita-recurrence.service';
import { CitaCreateService } from './services/application/cita-create.service';
import { CitaUpdateService } from './services/application/cita-update.service';
import { CitaEstadosService } from './services/application/cita-estados.service';
import { CitaReagendarService } from './services/application/cita-reagendar.service';
import { NotificacionesModule } from '../../modules/notificaciones/notificaciones.module';

@Module({
  imports: [NotificacionesModule],
  controllers: [CitasController],
  providers: [
    CitasService,
    CitaDomainService,
    CitaConflictsService,
    CitaSlotsService,
    CitaRecurrenceService,
    CitaCreateService,
    CitaUpdateService,
    CitaEstadosService,
    CitaReagendarService,
  ],
  exports: [CitasService],
})
export class CitasModule {}
